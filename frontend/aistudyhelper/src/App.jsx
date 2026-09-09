import { useEffect, useState } from 'react'
import './App.css'
import { GeneratedContent } from './GeneratedViews'

function App() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [selectedTool, setSelectedTool] = useState('Lesson')
  const [uploaded, setUploaded] = useState(false)
  const [fileName, setFileName] = useState('')
  const [noteFile, setNoteFile] = useState(null)
  const [generated, setGenerated] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [settings, setSettings] = useState(() => {
    try {
      return { defaultTool: 'Lesson', difficulty: 'Medium', explanations: true, compact: false, theme: 'dark', ...JSON.parse(localStorage.getItem('studymate-settings') || '{}') }
    } catch {
      return { defaultTool: 'Lesson', difficulty: 'Medium', explanations: true, compact: false, theme: 'dark' }
    }
  })

  useEffect(() => {
    localStorage.setItem('studymate-settings', JSON.stringify(settings))
  }, [settings])

  const navItems = [['Overview', '⌂'], ['My materials', '▤'], ['Practice', '◇'], ['Presentations', '▣']]
  const tools = [
    { name: 'Lesson', icon: '✦', copy: 'Turn notes into a clear study guide' },
    { name: 'Quiz', icon: '?', copy: 'Test your understanding with smart questions' },
    { name: 'Slides', icon: '▥', copy: 'Build a presentation in seconds' },
  ]

  const submitAnswer = () => { if (answer.trim()) setSubmitted(true) }
  const pageDetails = {
    'My materials': { eyebrow: 'YOUR LIBRARY', title: 'Your study materials', copy: 'Upload notes to build lessons, quizzes, and presentations from the same source.', icon: '▤', action: 'Add notes' },
    Practice: { eyebrow: 'PRACTICE CENTER', title: 'Practice with confidence', copy: 'Work through exam-like questions generated from your notes and see corrections as you go.', icon: '◇', action: 'Start practice' },
    Presentations: { eyebrow: 'PRESENTATION STUDIO', title: 'Build a presentation', copy: 'Turn a set of notes into a focused, presentation-ready story with clear slides.', icon: '▣', action: 'Choose notes' },
    Lesson: { eyebrow: 'LESSON BUILDER', title: 'Create a lesson', copy: 'Choose notes from your library and let StudyMate shape them into a guided lesson.', icon: '✦', action: 'Choose notes' },
    Quiz: { eyebrow: 'QUIZ BUILDER', title: 'Generate a quiz', copy: 'Create adaptive questions that reveal what you know and what to revisit next.', icon: '?', action: 'Choose notes' },
    Slides: { eyebrow: 'PRESENTATION STUDIO', title: 'Build a presentation', copy: 'Choose notes from your library and turn them into a focused, presentation-ready story.', icon: '▥', action: 'Choose notes' },
  }
  const currentPage = pageDetails[activeNav] || pageDetails['My materials']
  const goToTool = (toolName) => { setSelectedTool(toolName); setActiveNav(toolName); if (noteFile) generate(toolName, noteFile) }
  const handleFile = (file) => {
    if (!file) return
    setNoteFile(file)
    setFileName(file.name)
    setUploaded(true)
    setGenerated(null)
    setError('')
  }
  async function generate(toolName, file = noteFile) {
    if (!file) { setError('Upload school notes before generating content.'); return }
    setGenerating(true)
    setError('')
    const body = new FormData()
    body.append('file', file)
    body.append('type', toolName.toLowerCase())
    body.append('difficulty', settings.difficulty.toLowerCase())
    try {
      const backendDomain = (import.meta.env.VITE_BACKEND_DOMAIN || 'http://localhost:3001').replace(/\/$/, '')
      const response = await fetch(`${backendDomain}/api/generate`, { method: 'POST', body })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Generation failed')
      setGenerated(payload)
      setActiveNav(toolName)
    } catch (generationError) {
      setError(generationError.message)
    } finally {
      setGenerating(false)
    }
  }
  const handlePageAction = () => {
    if (activeNav === 'Practice') {
      setActionMessage('Practice session ready. Your first question is waiting on the overview.')
      return
    }
    if (['Lesson', 'Quiz', 'Slides'].includes(activeNav)) {
      generate(activeNav)
      return
    }
    setActiveNav('Overview')
  }
  const saveSettings = () => { setActionMessage('Preferences saved for this workspace.'); setTimeout(() => setActionMessage(''), 2500) }
  const settingsPage = <section className="settings-page"><div className="settings-heading"><div><p className="eyebrow">PREFERENCES</p><h1>Make StudyMate yours</h1><p>Choose how your study workspace creates and presents content.</p></div><div className="settings-symbol">⚙</div></div><div className="settings-grid"><label className="setting-card"><span><strong>Default generator</strong><small>Open this tool when you upload notes</small></span><select value={settings.defaultTool} onChange={(event) => setSettings({ ...settings, defaultTool: event.target.value })}><option>Lesson</option><option>Quiz</option><option>Slides</option></select></label><label className="setting-card"><span><strong>Question difficulty</strong><small>Used for generated quizzes</small></span><select value={settings.difficulty} onChange={(event) => setSettings({ ...settings, difficulty: event.target.value })}><option>Easy</option><option>Medium</option><option>Hard</option><option>Challenging</option></select></label><label className="setting-card"><span><strong>Workspace theme</strong><small>Choose the look that helps you focus</small></span><select value={settings.theme} onChange={(event) => setSettings({ ...settings, theme: event.target.value })}><option value="light">Light</option><option value="dark">Dark</option></select></label><label className="setting-card setting-toggle"><span><strong>Show explanations</strong><small>Reveal answer reasoning after checking</small></span><input type="checkbox" checked={settings.explanations} onChange={(event) => setSettings({ ...settings, explanations: event.target.checked })} /><i /></label><label className="setting-card setting-toggle"><span><strong>Compact reading mode</strong><small>Keep generated content tighter on screen</small></span><input type="checkbox" checked={settings.compact} onChange={(event) => setSettings({ ...settings, compact: event.target.checked })} /><i /></label></div><button className="primary-button" onClick={saveSettings}>Save preferences <span>→</span></button>{actionMessage && <p className="action-message" role="status">{actionMessage}</p>}</section>

  return (
    <div className={`app-shell theme-${settings.theme}`}>
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✦</span><span>study<span className="brand-accent">mate</span></span></div>
        <nav aria-label="Main navigation"><p className="nav-label">Workspace</p>{navItems.map(([label, icon]) => <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => setActiveNav(label)}><span className="nav-icon">{icon}</span>{label}</button>)}</nav>
        <div className="sidebar-bottom"><button className={`nav-item ${activeNav === 'Settings' ? 'active' : ''}`} onClick={() => setActiveNav('Settings')}><span className="nav-icon">⚙</span>Settings</button></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>{activeNav}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Open materials" onClick={() => setActiveNav('My materials')}>⌕</button><button className="icon-button notification" aria-label="Open practice" onClick={() => setActiveNav('Practice')}>♢<i /></button></div></header>
        <div className="content-wrap">
          {activeNav === 'Settings' ? settingsPage : activeNav === 'Overview' ? <>
          <section className="welcome-row"><div><p className="eyebrow">YOUR STUDY WORKSPACE</p><h1>Ready to make progress? <span>✦</span></h1><p className="subhead">Pick up a lesson or turn your notes into something new.</p></div><button className="primary-button" onClick={() => document.getElementById('note-file-input').click()}><span>＋</span> Add new notes</button></section>
          <div className="dashboard-grid"><section className="panel upload-panel"><div className="section-heading"><div><p className="eyebrow">START LEARNING</p><h2>Bring your notes to life</h2></div><button className="text-button" onClick={() => setActiveNav('Lesson')}>How it works <span>→</span></button></div><input id="note-file-input" className="file-input" type="file" accept=".pdf,.docx,.pptx,image/*" onChange={(event) => handleFile(event.target.files[0])} /><div id="upload-zone" className={`upload-zone ${uploaded ? 'uploaded' : ''}`} onClick={() => document.getElementById('note-file-input').click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleFile(event.dataTransfer.files[0]) }} role="button" tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter') document.getElementById('note-file-input').click() }}>{uploaded ? <><div className="file-icon">✓</div><div><strong>{fileName || 'Notes ready to transform'}</strong><span>Choose a generator below to get started</span></div><button className="change-file" onClick={(event) => { event.stopPropagation(); setUploaded(false); setFileName('') }}>Change file</button></> : <><div className="upload-icon">↑</div><div><strong>Drop your notes here, or <u>browse files</u></strong><span>PDF, DOCX, PPTX or images · up to 25 MB</span></div></>}</div><div className="tool-list">{tools.map((tool) => <button key={tool.name} className={`tool-row ${selectedTool === tool.name ? 'selected' : ''}`} onClick={() => goToTool(tool.name)}><span className="tool-icon">{tool.icon}</span><span><strong>{tool.name}</strong><small>{tool.copy}</small></span><span className="row-arrow">→</span></button>)}</div></section>
            <section className="panel focus-panel"><div className="section-heading"><div><p className="eyebrow">YOUR FOCUS</p><h2>Continue learning</h2></div><button className="dots" aria-label="Open materials" onClick={() => setActiveNav('My materials')}>•••</button></div><div className="focus-hero"><div className="subject-tag">SAVED LESSON <span>·</span> IN PROGRESS</div><h3>Continue your latest lesson</h3><p>Pick a lesson from your materials to begin</p><div className="lesson-progress"><span /></div><button className="dark-button" onClick={() => setActiveNav('My materials')}>Open materials <span>→</span></button></div><button className="next-up" onClick={() => setActiveNav('Practice')}><div className="next-icon">?</div><div><small>NEXT UP</small><strong>Exam-like questions</strong><span>Practice from your notes</span></div><span className="row-arrow">→</span></button></section></div>
          <div className="bottom-grid"><section className="panel question-panel"><div className="section-heading"><div><p className="eyebrow">EXAM PREP</p><h2>Question of the day</h2></div><span className="difficulty">MEDIUM</span></div><p className="question">Which molecule is the final electron acceptor in the electron transport chain?</p><div className="answer-row"><button className={`answer-option ${answer === 'Oxygen' ? 'chosen' : ''}`} onClick={() => setAnswer('Oxygen')}><span>A</span> Oxygen</button><button className={`answer-option ${answer === 'Glucose' ? 'chosen' : ''}`} onClick={() => setAnswer('Glucose')}><span>B</span> Glucose</button><button className={`answer-option ${answer === 'ATP' ? 'chosen' : ''}`} onClick={() => setAnswer('ATP')}><span>C</span> ATP</button><button className={`answer-option ${answer === 'NADH' ? 'chosen' : ''}`} onClick={() => setAnswer('NADH')}><span>D</span> NADH</button></div><button className="submit-button" onClick={submitAnswer} disabled={!answer}>{submitted ? (answer === 'Oxygen' ? 'Correct! Nice work' : 'Review answer') : 'Check answer'}</button></section><section className="panel activity-panel"><div className="section-heading"><div><p className="eyebrow">YOUR MATERIALS</p><h2>Keep exploring</h2></div><button className="text-button" onClick={() => setActiveNav('My materials')}>View library <span>→</span></button></div><div className="empty-activity"><div className="activity-thumb peach">＋</div><div><strong>Your next study session starts here</strong><span>Upload notes to see your materials</span></div></div><button className="library-link" onClick={() => setActiveNav('My materials')}>Open my materials <span>→</span></button></section></div>
          </> : <section className="page-view"><div className="page-icon">{currentPage.icon}</div><p className="eyebrow">{currentPage.eyebrow}</p><h1>{generated?.result?.title || currentPage.title}</h1><p className="page-copy">{generated ? `Generated from ${generated.fileName}` : currentPage.copy}</p>{generating ? <div className="loading-card"><span className="loading-orb">✦</span><strong>Building your {activeNav.toLowerCase()}...</strong><span>Reading your notes and shaping the important parts.</span></div> : generated ? <GeneratedContent generated={generated} /> : <button className="primary-button" onClick={handlePageAction}>{currentPage.action} <span>→</span></button>}{error && <p className="error-message" role="alert">{error}</p>}{actionMessage && <p className="action-message" role="status">{actionMessage}</p>}<button className="back-button" onClick={() => setActiveNav('Overview')}>Back to overview</button></section>}
        </div>
      </main>
    </div>
  )
}

export default App
