import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './PlanetThread.css'

/** tiny white SVG icons */
const Icon = {
  // Add this inside your Icon object:
  paperclip: (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M21.44 11.05l-8.49 8.49a5.5 5.5 0 01-7.78-7.78L13.66 3.27a4 4 0 115.66 5.66L8.88 19.38a2.5 2.5 0 11-3.54-3.54L15.59 5.59"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>

  ),

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

/** inline SVG avatar (data URI) for anonymous users */
const ANON_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#9aa7ff"/>
          <stop offset="100%" stop-color="#5f6bff"/>
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill="url(#g)"/>
      <circle cx="40" cy="32" r="14" fill="#fff" opacity="0.9"/>
      <rect x="18" y="48" width="44" height="22" rx="11" fill="#fff" opacity="0.9"/>
    </svg>`
  )

const SAMPLE_TEXT =
  "So yes: people remembered more content from text, but were more accurate at saying that certain information was from audio. This pattern replicates Johnson & Raye’s source-monitoring framework: perceptual detail (richer in audio) makes source discrimination easier."

/** --- localStorage helpers (per-planet) --- */
const storageKey = (planetId) => `planetThread:${planetId || 'unknown'}`

const loadPosts = (planetId) => {
  try {
    const raw = localStorage.getItem(storageKey(planetId))
    if (raw) return JSON.parse(raw)
  } catch {}
  // seed if nothing saved yet for this planet
  return [
    {
      id: 'p1',
      author: 'LambOverRice',
      body: SAMPLE_TEXT,
      score: 2,
      avatar: null,
      ts: '2h',
      comments: [
        { id: 'c1', author: 'Anon', text: 'Interesting take!' },
        { id: 'c2', author: 'Reader42', text: 'Agree on source-monitoring.' },
      ],
    },
    { id: 'p2', author: 'LambOverRice', body: SAMPLE_TEXT, score: 2, avatar: null, ts: '3h', comments: [] },
    { id: 'p3', author: 'LambOverRice', body: SAMPLE_TEXT, score: 2, avatar: null, ts: '6h', comments: [] },
  ]
}

const savePosts = (planetId, posts) => {
  try {
    localStorage.setItem(storageKey(planetId), JSON.stringify(posts))
  } catch {}
}

// convert File -> data URL so images persist across reloads
const fileToDataURL = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })

export default function PlanetThread({ planetId: propPlanetId }) {
  const params = useParams()
  const planetId = propPlanetId ?? params.planetId
  const navigate = useNavigate()

  /** posts persisted per planet */
  const [posts, setPosts] = useState(() => loadPosts(planetId))

  // when planetId changes, load that planet’s saved posts
  useEffect(() => {
    setPosts(loadPosts(planetId))
  }, [planetId])

  // persist whenever posts change for this planet
  useEffect(() => {
    savePosts(planetId, posts)
  }, [planetId, posts])

  // composer (bottom)
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)

  // per-post comment drafts
  const [commentDrafts, setCommentDrafts] = useState({})

  const title = useMemo(
    () => ((planetId && planetId !== 'earth') ? 'Girls in Tech' : 'Earth Forum'),
    [planetId]
  )

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) { setFile(null); setPreview(null); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const submitPost = async (e) => {
    e.preventDefault()
    if (!text.trim() && !file) return

    let imageDataUrl = null
    if (file) {
      try { imageDataUrl = await fileToDataURL(file) } catch {}
    }

    const newPost = {
      id: `p${Date.now()}`,
      author: 'You',
      body: text.trim(),
      score: 0,
      avatar: null,
      ts: 'now',
      image: imageDataUrl,
      comments: [],
    }
    // append to bottom
    setPosts(prev => [...prev, newPost])
    setText('')
    setFile(null)
    setPreview(null)
  }

  const setDraftFor = (postId, val) =>
    setCommentDrafts((d) => ({ ...d, [postId]: val }))

  const submitComment = (postId) => {
    const draft = (commentDrafts[postId] || '').trim()
    if (!draft) return
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, comments: [...p.comments, { id: `c${Date.now()}`, author: 'You', text: draft }] }
          : p
      )
    )
    setDraftFor(postId, '')
  }

  return (
    <div className="thread-wrap">
      {/* Header */}
      <header className="thread-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon.back className="icon" />
        </button>

        <div className="thread-title">
          <span className="tag">🏷</span>
          <h1 className="thread-title-text">{title}</h1>
        </div>

        <div className="brand">TechSpace</div>

        {/* live bubbles removed for now */}
      </header>

      {/* Posts */}
      <main className="thread-main">
        {posts.map(p => (
          <article key={p.id} className="post">
            <div className="post-avatar">
              <img src={p.avatar || ANON_AVATAR} alt="" />
            </div>

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

              {/* comments */}
              {p.comments.length > 0 && (
                <ul className="comments">
                  {p.comments.map(c => (
                    <li key={c.id} className="comment">
                      <div className="comment-avatar">
                        <img src={ANON_AVATAR} alt="" />
                      </div>
                      <div className="comment-content">
                        <div className="comment-meta">
                          <strong>{c.author}</strong>
                        </div>
                        <p className="comment-text">{c.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* comment composer */}
              <div className="comment-composer">
                <input
                  type="text"
                  placeholder="Add a comment…"
                  value={commentDrafts[p.id] || ''}
                  onChange={(e) => setDraftFor(p.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      submitComment(p.id)
                    }
                  }}
                />
                <button
                  className="comment-send"
                  type="button"
                  disabled={!(commentDrafts[p.id] || '').trim()}
                  onClick={() => submitComment(p.id)}
                  title="Post comment"
                >
                  <Icon.send className="icon-sm" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </main>

      {/* New post composer at bottom */}
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
            <label className="file-btn" title="Attach file">
              <Icon.paperclip className="icon" />
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
            <button
              type="button"
              className="clear-preview"
              onClick={() => { setPreview(null); setFile(null); }}
            >
              Remove
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
