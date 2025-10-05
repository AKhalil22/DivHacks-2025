import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './PlanetThread.css'

/** tiny white SVG icons */
const Icon = {
  back: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
    </svg>
  ),
  upvote: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M12 4l-8 8h5v8h6v-8h5z"/>
    </svg>
  ),
  comment: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v14l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
    </svg>
  ),
  award: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M12 2l2.39 4.84L20 7.64l-3.5 3.41.83 4.95L12 13.77 6.67 16l.83-4.95L4 7.64l5.61-.8L12 2z"/>
    </svg>
  ),
  share: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a3.27 3.27 0 0 0 0-1.39l7.02-4.11A2.99 2.99 0 1 0 15 5a3 3 0 0 0 .06.59L8.04 9.7a3 3 0 1 0 0 4.6l7.02 4.11c-.04.19-.06.39-.06.59a3 3 0 1 0 3-3z"/>
    </svg>
  ),
  more: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="5" cy="12" r="2" fill="currentColor"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
      <circle cx="19" cy="12" r="2" fill="currentColor"/>
    </svg>
  ),
  image: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14l4-4h12a2 2 0 0 0 2-2zM8.5 11A1.5 1.5 0 1 1 10 9.5 1.5 1.5 0 0 1 8.5 11z"/>
    </svg>
  ),
  send: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2z"/>
    </svg>
  ),
}

const SAMPLE_TEXT =
  "So yes: people remembered more content from text, but were more accurate at saying that certain information was from audio. This pattern replicates Johnson & Raye’s source-monitoring framework: perceptual detail (richer in audio) makes source discrimination easier."

export default function PlanetThread() {
  const { planetId } = useParams()
  const navigate = useNavigate()

  const [posts, setPosts] = useState([
    { id: 'p1', author: 'LambOverRice', body: SAMPLE_TEXT, score: 2, avatar: null, ts: '2h' },
    { id: 'p2', author: 'LambOverRice', body: SAMPLE_TEXT, score: 2, avatar: null, ts: '3h' },
    { id: 'p3', author: 'LambOverRice', body: SAMPLE_TEXT, score: 2, avatar: null, ts: '6h' },
  ])

  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) { setFile(null); setPreview(null); return }
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  const submitPost = (e) => {
    e.preventDefault()
    if (!text.trim() && !file) return
    const newPost = {
      id: String(Date.now()),
      author: 'You',
      body: text.trim(),
      score: 0,
      avatar: null,
      ts: 'now',
      image: preview || null,
    }
    setPosts([newPost, ...posts])
    setText('')
    setFile(null)
    setPreview(null)
  }

  const title = (planetId && planetId !== 'earth') ? 'Girls in Tech' : 'Earth Forum'

  return (
    <div className="thread-wrap">
      {/* Header */}
      <header className="thread-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon.back className="icon" />
        </button>

        <div className="thread-title">
          <span className="tag">🏷</span>
          <h1>{title}</h1>
        </div>

        <div className="brand">TechSpace</div>

        {/* live chatter bubbles */}
        <div className="live-bubbles">
          <div className="bubble bubble-pink" title="Pusheen is online" />
          <div className="bubble bubble-green" title="Totoro is online" />
        </div>
      </header>

      {/* Scrollable post list */}
      <main className="thread-main">
        {posts.map(p => (
          <article key={p.id} className="post">
            <div className="post-avatar" aria-hidden="true"></div>
            <div className="post-body">
              <div className="post-meta">
                <strong>{p.author}</strong>
                <span className="dot">•</span>
                <span className="ts">{p.ts}</span>
              </div>
              {p.body && <p className="post-text">{p.body}</p>}
              {p.image && (
                <div className="post-media">
                  <img src={p.image} alt="uploaded" />
                </div>
              )}

              <div className="post-actions">
                <button className="action" title="Upvote">
                  <Icon.upvote className="icon-sm" /> <span>{p.score}</span>
                </button>
                <button className="action" title="Reply">
                  <Icon.comment className="icon-sm" />
                </button>
                <button className="action" title="Award">
                  <Icon.award className="icon-sm" />
                </button>
                <button className="action" title="Share">
                  <Icon.share className="icon-sm" />
                </button>
                <button className="action" title="More">
                  <Icon.more className="icon-sm" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </main>

      {/* Composer */}
      <form className="composer" onSubmit={submitPost}>
        <label htmlFor="composer-input" className="composer-label">Type here:</label>
        <div className="composer-row">
          <textarea
            id="composer-input"
            className="composer-input"
            placeholder="Write a post..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
          <div className="composer-actions">
            <label className="file-btn" title="Attach image">
              <Icon.image className="icon" />
              <input type="file" accept="image/*" onChange={handleFile} />
            </label>
            <button type="submit" className="send-btn" disabled={!text.trim() && !file}>
              <Icon.send className="icon" />
              <span>Post</span>
            </button>
          </div>
        </div>
        {preview && (
          <div className="preview">
            <img src={preview} alt="preview" />
            <button type="button" className="clear-preview" onClick={() => { setPreview(null); setFile(null); }}>
              Remove
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
