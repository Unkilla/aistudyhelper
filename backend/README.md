# StudyMate API

The backend turns uploaded school notes into lessons, quizzes, and slide outlines using retrieval plus Groq.

## Run

1. Keep `GROQ_API_KEY` in `backend/.env`.
2. Install dependencies with `npm install`.
3. Start the API with `npm run dev` (or `npm start`).
4. Start the Vite frontend in `frontend/aistudyhelper` with `npm run dev`.

Set `BACKEND_DOMAIN` and `FRONTEND_DOMAIN` in `backend/.env` for deployment. The frontend uses `VITE_BACKEND_DOMAIN` from `frontend/aistudyhelper/.env`. The local values are documented in both `.env.example` files.

## Endpoint

`POST /api/generate` accepts multipart form data:

- `file`: PDF, DOCX, PPTX, TXT, MD, or CSV notes, up to 25 MB.
- `type`: `lesson`, `quiz`, or `slides`.

The response includes structured JSON in `result`. The Python script performs lightweight lexical retrieval over note chunks before the selected Groq model generates the result. Set `GROQ_MODEL` in `.env` to override the default model.

## Deploy To Vercel

Create a Vercel project with the repository root set to `backend`. Vercel will use `vercel.json` and deploy `api/index.js` as the Express function.

Set these backend project environment variables in Vercel:

- `GROQ_API_KEY`: your Groq secret.
- `GROQ_MODEL`: `llama-3.3-70b-versatile`.
- `BACKEND_DOMAIN`: the deployed backend URL, for example `https://your-api.vercel.app`.
- `FRONTEND_DOMAIN`: the deployed frontend URL, for example `https://your-app.vercel.app`.

The deployed function uses JavaScript retrieval automatically. Python retrieval remains available for local development when Python is installed.
