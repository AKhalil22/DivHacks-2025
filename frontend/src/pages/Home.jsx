import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'
import './Galaxy.css'

import earthImg from '../../images/earth.png'
import purpleImg from '../../images/purpleripplyplanet.webp'
import orangeImg from '../../images/orangeripplyplanet.webp'
import turquoiseImg from '../../images/turquoisemeteorplanet.png'
import bacon from '../../images/bacon.png'
/* If you have this file, keep this import; otherwise remove this planet or fix the path */
import orangeblueImg from '../../images/orangeplanetbluerivers.webp'

const PLANETS = [
  { id: 'earth',     name: 'Earth',                    img: earthImg,     left: '22%', top: '38%', size: 120 },
  { id: 'purple',    name: 'Girls in Tech',            img: purpleImg,    left: '45%', top: '28%', size: 102 },
  { id: 'orange',    name: 'Design',                   img: orangeImg,    left: '68%', top: '42%', size: 112 },
  { id: 'turquoise', name: 'AI / ML',                  img: turquoiseImg, left: '40%', top: '62%', size: 96  },
  { id: 'orangeblue',name: 'Hardware',                 img: orangeblueImg,left: '70%', top: '72%', size: 108 }, // remove if file missing
  { id: 'bacon',     name: 'Networking',       img: bacon,        left: '25%', top: '75%', size: 130 },
]

export default function Home() {
  const navigate = useNavigate()
  const viewportRef = useRef(null)
  const canvasRef = useRef(null)

  // center the viewport over the canvas cluster
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
            <div
              key={p.id}
              className="planet-wrap"
              style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
            >
              <button
                className='planet'
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${p.img})`,
                }}
                aria-label={p.name}
                onClick={() => navigate(`/planet/${p.id}`)}
              />
              <span className="planet-label">{p.name}</span>
            </div>
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
