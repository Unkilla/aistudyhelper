import "dotenv/config"
import cors from "cors"
import express from "express"
import multer from "multer"
import mammoth from "mammoth"
import pdf from "pdf-parse"
import AdmZip from "adm-zip"
import { spawn } from "node:child_process"
import { promises as fs } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import Groq from "groq-sdk"

const app = express()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
})
const port = Number(process.env.PORT || 3001)
const backendDomain = (process.env.BACKEND_DOMAIN || `http://localhost:${port}`).replace(/\/$/, "")
const allowedOrigins = (process.env.FRONTEND_DOMAIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean)
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null
const root = path.dirname(fileURLToPath(import.meta.url))

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: "2mb" }))

function textFromPptx(buffer) {
  const zip = new AdmZip(buffer)
  return zip.getEntries()
    .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName))
    .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }))
    .map((entry) => entry.getData().toString("utf8").replace(/<[^>]+>/g, " "))
    .join("\n")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

async function extractText(file) {
  const extension = path.extname(file.originalname).toLowerCase()
  if ([".txt", ".md", ".csv"].includes(extension)) return file.buffer.toString("utf8")
  if (extension === ".pdf") return (await pdf(file.buffer)).text
  if (extension === ".docx") return (await mammoth.extractRawText({ buffer: file.buffer })).value
  if (extension === ".pptx") return textFromPptx(file.buffer)
  throw new Error("Unsupported file type. Upload PDF, DOCX, PPTX, TXT, MD, or CSV notes.")
}

function retrieve(text, query) {
  return new Promise((resolve, reject) => {
    const python = spawn(process.platform === "win32" ? "python" : "python3", [path.join(root, "rag_pipeline.py")])
    let output = ""
    let error = ""
    python.stdout.on("data", (chunk) => { output += chunk })
    python.stderr.on("data", (chunk) => { error += chunk })
    python.on("error", () => resolve(retrieveInJavaScript(text, query)))
    python.on("close", (code) => {
      if (code !== 0) return resolve(retrieveInJavaScript(text, query))
      try { resolve(JSON.parse(output)) } catch { reject(new Error("RAG retrieval returned invalid JSON")) }
    })
    python.stdin.end(JSON.stringify({ text, query }))
  })
}

function retrieveInJavaScript(text, query) {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks = []
  for (let start = 0; start < words.length; start += 780) chunks.push(words.slice(start, start + 900).join(" "))
  const terms = query.toLowerCase().match(/[a-z0-9]{3,}/g) || []
  const ranked = chunks
    .map((chunk) => ({ chunk, score: terms.reduce((total, term) => total + chunk.toLowerCase().split(term).length - 1, 0) }))
    .sort((left, right) => right.score - left.score)
  return { context: ranked.slice(0, 5).map(({ chunk }) => chunk), chunkCount: chunks.length }
}

const schemas = {
  lesson: `{"title":"string","summary":"string","sections":[{"heading":"string","explanation":"string","keyPoints":["string"]}],"revisionNotes":["string"]}`,
  quiz: `{"title":"string","questions":[{"question":"string","options":["string","string","string","string"],"answer":"string","explanation":"string","difficulty":"easy|medium|hard"}]}`,
  slides: `{"title":"string","slides":[{"title":"string","bullets":["string"],"speakerNotes":"string"}]}`,
}

app.get("/api/health", (_req, res) => res.json({ ok: true, groqConfigured: Boolean(groq) }))

app.post("/api/generate", upload.single("file"), async (req, res) => {
  try {
    if (!groq) return res.status(503).json({ error: "GROQ_API_KEY is not configured in backend/.env" })
    if (!req.file) return res.status(400).json({ error: "Attach a notes file in the file field." })

    const type = String(req.body.type || "lesson").toLowerCase()
    if (!schemas[type]) return res.status(400).json({ error: "type must be lesson, quiz, or slides" })
    const notes = await extractText(req.file)
    if (!notes.trim()) return res.status(422).json({ error: "No readable text was found in that file." })
    const retrieved = await retrieve(notes, `${type} ${req.body.prompt || "study these school notes"}`)
    const context = retrieved.context.join("\n\n")
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `You are a precise study assistant. Use only the supplied notes. Return valid JSON matching this schema: ${schemas[type]}. Do not invent facts; mark gaps as unknown.` },
        { role: "user", content: `Create a ${type} from these retrieved note sections:\n${context}` },
      ],
    })
    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error("Groq returned an empty response")
    res.json({ type, fileName: req.file.originalname, result: JSON.parse(content), chunkCount: retrieved.chunkCount })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message || "Generation failed" })
  }
})

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "Files must be 25 MB or smaller." })
  res.status(500).json({ error: error.message || "Unexpected server error" })
})

if (process.env.VERCEL !== "1") app.listen(port, () => console.log(`StudyMate API running on ${backendDomain}`))

export { app }

process.on("SIGTERM", async () => {
  await fs.rm(path.join(root, ".tmp"), { recursive: true, force: true })
  process.exit(0)
})
