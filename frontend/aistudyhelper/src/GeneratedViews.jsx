import { useState } from 'react'

export function LessonResult({ result }) {
  const [openSection, setOpenSection] = useState(0)
  return <div className="study-result lesson-result">
    <div className="result-summary"><span className="result-label">AT A GLANCE</span><p>{result.summary || 'A focused guide built from your notes.'}</p></div>
    <div className="result-sections">{(result.sections || []).map((section, index) => <article className={`result-section ${openSection === index ? 'open' : ''}`} key={`${section.heading}-${index}`}>
      <button className="section-toggle" onClick={() => setOpenSection(openSection === index ? -1 : index)} aria-expanded={openSection === index}><span className="section-number">{String(index + 1).padStart(2, '0')}</span><strong>{section.heading}</strong><span className="toggle-icon">{openSection === index ? '−' : '+'}</span></button>
      {openSection === index && <div className="section-body"><p>{section.explanation}</p>{section.keyPoints?.length > 0 && <ul>{section.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul>}</div>}
    </article>)}</div>
    {result.revisionNotes?.length > 0 && <div className="revision-box"><span className="result-label">REVISION NOTES</span><ul>{result.revisionNotes.map((note) => <li key={note}>{note}</li>)}</ul></div>}
  </div>
}

export function QuizResult({ result }) {
  const [answers, setAnswers] = useState({})
  const [checked, setChecked] = useState({})
  return <div className="study-result quiz-result">{(result.questions || []).map((item, index) => {
    const selected = answers[index]
    const isChecked = checked[index]
    const correct = selected === item.answer
    return <article className="quiz-card" key={`${item.question}-${index}`}><div className="quiz-meta"><span>QUESTION {index + 1}</span><b className={`difficulty ${item.difficulty}`}>{item.difficulty || 'medium'}</b></div><h3>{item.question}</h3><div className="quiz-options">{(item.options || []).map((option, optionIndex) => <button key={option} className={`quiz-option ${selected === option ? 'selected' : ''} ${isChecked && option === item.answer ? 'correct' : ''}`} onClick={() => setAnswers({ ...answers, [index]: option })}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}</div><div className="quiz-footer">{isChecked && <p className={correct ? 'answer-correct' : 'answer-wrong'}>{correct ? 'Correct. Nice work.' : `Answer: ${item.answer}`} {item.explanation && <small>{item.explanation}</small>}</p>}<button className="check-answer" disabled={!selected} onClick={() => setChecked({ ...checked, [index]: true })}>{isChecked ? (correct ? 'Checked' : 'Try again') : 'Check answer'}</button></div></article>
  })}</div>
}

export function SlidesResult({ result }) {
  const [slide, setSlide] = useState(0)
  const slides = result.slides || []
  const current = slides[slide]
  if (!current) return <div className="empty-result">No slides were returned for these notes.</div>
  return <div className="study-result slides-result"><div className="slide-stage"><span className="slide-count">{String(slide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span><h2>{current.title}</h2><ul>{(current.bullets || []).map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></div><div className="slide-controls"><button className="slide-nav" disabled={slide === 0} onClick={() => setSlide(slide - 1)}>←</button><div className="slide-dots">{slides.map((item, index) => <button key={item.title} className={index === slide ? 'active' : ''} onClick={() => setSlide(index)} aria-label={`Go to slide ${index + 1}`} />)}</div><button className="slide-nav" disabled={slide === slides.length - 1} onClick={() => setSlide(slide + 1)}>→</button></div><details className="speaker-notes"><summary>Speaker notes</summary><p>{current.speakerNotes || 'No speaker notes for this slide.'}</p></details></div>
}

export function GeneratedContent({ generated }) {
  if (generated.type === 'quiz') return <QuizResult result={generated.result} />
  if (generated.type === 'slides') return <SlidesResult result={generated.result} />
  return <LessonResult result={generated.result} />
}
