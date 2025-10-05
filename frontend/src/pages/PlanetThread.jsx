import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './PlanetThread.css'

/* ---- username helpers ---- */
const getUsername = () => localStorage.getItem('username') || 'Anonymous'

/* ---- tiny white SVG icons ---- */
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

/* ---- inline anon avatar (data URI) ---- */
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

/* ---------- titles per planet ---------- */
const TITLES = {
  earth: 'Earth Forum',
  purple: 'Girls in Tech',
  orange: 'Design',
  turquoise: 'AI / ML',
  orangeblue: 'Hardware',
  bacon: 'Kevin • Networking',
}

/* ---------- planet-specific seed content ---------- */
const seedsFor = (planetId, username) => {
  const u = username || 'Anonymous'
  switch (planetId) {
    case 'purple': // Girls in Tech
      return [
        {
          id: 'p1',
          author: u,
          body:
            "What helped you most when starting out? Mentorship? Communities? I’m organizing a beginner-friendly study group.",
          score: 5, ts: '2h', avatar: null,
          comments: [
            { id: 'c1', author: 'Maya', text: 'Meetups + a Discord accountability channel.' },
            { id: 'c2', author: 'Jules', text: 'Women Who Code workshops were amazing.' },
          ],
        },
        {
          id: 'p2',
          author: 'Ava',
          body:
            "Impostor syndrome tips? I freeze when I’m the only woman in the room.",
          score: 8, ts: '5h', avatar: null,
          comments: [{ id: 'c3', author: u, text: 'Prep notes + one concrete win to share helps me.' }],
        },
        {
          id: 'p3',
          author: 'Sam',
          body:
            "Resources for conference scholarships or speaker CFPs?",
          score: 3, ts: '1d', avatar: null,
          comments: [{ id: 'c4', author: 'Nia', text: 'Check out PyLadies + local tech foundations.' }],
        },
      ]

    case 'orange': // Design
      return [
        {
          id: 'p1',
          author: u,
          body:
            "What’s your Figma → dev handoff flow? Struggling to keep tokens tidy.",
          score: 4, ts: '1h', avatar: null,
          comments: [{ id: 'c1', author: 'Rex', text: 'Style dictionary + documented tokens FTW.' }],
        },
        {
          id: 'p2',
          author: 'Lina',
          body:
            "Critique request: onboarding mock — empty states too heavy?",
          score: 2, ts: '7h', avatar: null,
          comments: [{ id: 'c2', author: 'Oli', text: 'Lighten copy; add one success illustration.' }],
        },
        {
          id: 'p3',
          author: 'Theo',
          body:
            "Favorite usability test script templates?",
          score: 1, ts: '22h', avatar: null,
          comments: [],
        },
      ]

    case 'turquoise': // AI / ML
      return [
        {
          id: 'p1',
          author: 'Ada',
          body:
            "Best small open dataset for RAG demos? Needs citations + diverse domains.",
          score: 6, ts: '4h', avatar: null,
          comments: [{ id: 'c1', author: u, text: 'Gov docs + wiki extracts work well.' }],
        },
        {
          id: 'p2',
          author: u,
          body:
            "Anyone tried LoRA on a 7B for classification? Curious about batch sizes on a 3090.",
          score: 3, ts: '9h', avatar: null,
          comments: [{ id: 'c2', author: 'Devon', text: 'bs 16–32, watch grad accumulation.' }],
        },
        {
          id: 'p3',
          author: 'Kai',
          body:
            "Prompt eval ideas beyond BLEU/ROUGE?",
          score: 5, ts: '1d', avatar: null,
          comments: [{ id: 'c3', author: 'V', text: 'Task-driven eval + human rubric.' }],
        },
      ]

    case 'orangeblue': // Hardware
      return [
        {
          id: 'p1',
          author: u,
          body:
            "Show us your tiny builds! I’ve got a Pi Zero cyberdeck; any heat tips?",
          score: 7, ts: '3h', avatar: null,
          comments: [{ id: 'c1', author: 'Max', text: 'Copper shim + small blower fan works.' }],
        },
        {
          id: 'p2',
          author: 'Ivy',
          body:
            "Best starter keyboard kit for hot-swap + low profile?",
          score: 4, ts: '11h', avatar: null,
          comments: [{ id: 'c2', author: u, text: 'Check Nuphy + Keychron.' }],
        },
        {
          id: 'p3',
          author: 'Rob',
          body:
            "How are you powering e-paper displays outdoors?",
          score: 2, ts: '1d', avatar: null,
          comments: [],
        },
      ]

    case 'bacon': // Kevin • Networking
      return [
        {
          id: 'p1',
          author: u,
          body:
            "Cold DM template that actually gets replies? Trying to meet PMs named… Kevin 👀",
          score: 9, ts: '1h', avatar: null,
          comments: [
            { id: 'c1', author: 'Nora', text: 'Lead with value + 1 line ask.' },
            { id: 'c2', author: 'Lee', text: 'Mutuals matter—mention shared events.' },
          ],
        },
        {
          id: 'p2',
          author: 'Kevin',
          body:
            "I host a monthly coffee for folks changing roles—drop your city if you want invites.",
          score: 12, ts: '8h', avatar: null,
          comments: [{ id: 'c3', author: u, text: 'NYC here! Would love to join.' }],
        },
        {
          id: 'p3',
          author: 'Ari',
          body:
            "Quick portfolio opener when meeting recruiters?",
          score: 3, ts: '1d', avatar: null,
          comments: [{ id: 'c4', author: 'Mo', text: '1 line problem → 1 line result with numbers.' }],
        },
      ]

    case 'earth': // Earth Forum (generic)
    default:
      return [
        {
          id: 'p1',
          author: u,
          body:
            "Welcome to TechSpace! Share what you’re building this week.",
          score: 5, ts: '2h', avatar: null,
          comments: [{ id: 'c1', author: 'A', text: 'Prototype of a campus app.' }],
        },
        {
          id: 'p2',
          author: 'B',
          body:
            "Anyone want to pair on a small JS game?",
          score: 2, ts: '7h', avatar: null,
          comments: [{ id: 'c2', author: u, text: 'I’m in! DM me.' }],
        },
        { id: 'p3', author: 'C', body: 'Show & tell Friday ideas?', score: 1, ts: '1d', avatar: null, comments: [] },
      ]
  }
}

/* ---- localStorage helpers (per-planet) ---- */
const storageKey = (planetId) => `planetThread:${planetId || 'unknown'}`

const loadPosts = (planetId) => {
  try {
    const raw = localStorage.getItem(storageKey(planetId))
    if (raw) return JSON.parse(raw)
  } catch {}
  return seedsFor(planetId, getUsername())
}

const savePosts = (planetId, posts) => {
  try {
    localStorage.setItem(storageKey(planetId), JSON.stringify(posts))
  } catch {}
}

// File -> data URL so images persist across reloads
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

  const username = useMemo(() => getUsername(), [])

  const [posts, setPosts] = useState(() => loadPosts(planetId))

  useEffect(() => { setPosts(loadPosts(planetId)) }, [planetId])
  useEffect(() => { savePosts(planetId, posts) }, [planetId, posts])

  // composer
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)

  const [commentDrafts, setCommentDrafts] = useState({})

  const title = TITLES[planetId] || 'Planet Thread'

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
      author: username,
      body: text.trim(),
      score: 0,
      avatar: null,
      ts: 'now',
      image: imageDataUrl,
      comments: [],
    }
    setPosts(prev => [...prev, newPost])
    setText(''); setFile(null); setPreview(null)
  }

  const setDraftFor = (postId, val) =>
    setCommentDrafts((d) => ({ ...d, [postId]: val }))

  const submitComment = (postId) => {
    const draft = (commentDrafts[postId] || '').trim()
    if (!draft) return
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, comments: [...p.comments, { id: `c${Date.now()}`, author: username, text: draft }] }
          : p
      )
    )
    setDraftFor(postId, '')
  }

  return (
    <div className="thread-wrap">
      <header className="thread-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon.back className="icon" />
        </button>

        <div className="thread-title">
          <span className="tag">🏷</span>
          <h1 className="thread-title-text">{title}</h1>
        </div>

        <div className="brand">TechSpace</div>
      </header>

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
