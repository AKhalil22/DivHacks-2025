import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'
import './Galaxy.css'


// Adjust these imports to your actual file names/paths
import earthImg from '../../images/earth.png'
import purpleImg from '../../images/purpleripplyplanet.webp'
import orangeImg from '../../images/orangeripplyplanet.webp'
import turquoiseImg from '../../images/turquoisemeteorplanet.png'
import orangeblueImg from '../../images/orangeplanetbluerivers.webp'
import bg from '../../images/starfield_natural.png';

// Spread planets across most of the canvas (no long scrolls needed)
const PLANETS = [
  { id: 'earth',     img: earthImg,     left: '22%', top: '38%', size: 120 },
  { id: 'purple',    img: purpleImg,    left: '45%', top: '28%', size: 102 },
  { id: 'orange',    img: orangeImg,    left: '68%', top: '42%', size: 112 },
  { id: 'turquoise', img: turquoiseImg, left: '40%', top: '62%', size: 96  },
  { id: 'orangeblue',img: orangeblueImg,left: '70%', top: '72%', size: 108 },
]

export default function Home() {
  const navigate = useNavigate()
  const viewportRef = useRef(null)
  const canvasRef = useRef(null)

  // Center the viewport on the canvas (so you see the cluster immediately)
  useEffect(() => {
    const vp = viewportRef.current
    const cv = canvasRef.current
    if (!vp || !cv) return
    const dx = Math.max((cv.scrollWidth  - vp.clientWidth)  / 2, 0)
    const dy = Math.max((cv.scrollHeight - vp.clientHeight) / 2, 0)
    vp.scrollTo({ left: dx, top: dy, behavior: 'instant' })
  }, [])

  return (
    <div className='galaxy-wrap'>
      <div className='galaxy-viewport' ref={viewportRef}>
        <div className='galaxy-canvas' ref={canvasRef}>
          {PLANETS.map(p => (
            <button
              key={p.id}
              className='planet'
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                backgroundImage: `url(${p.img})`,
              }}
              aria-label={p.id}
              onClick={() => navigate(`/planet/${p.id}`)}
            />
          ))}
        </div>
      </div>

      <div className='hud'>
        <h1>Welcome LambOverRice</h1>
        <p>Explore other planet forums or create your own.</p>
      </div>
    </div>
  )
}
