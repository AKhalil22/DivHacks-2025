import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const [fadeOut, setFadeOut] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Start fade out slightly before navigation
    const fadeTimer = setTimeout(() => setFadeOut(true), 3000)
    const navTimer = setTimeout(() => navigate('/auth'), 3500)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(navTimer)
    }
  }, [navigate])

  return (
    <main className={`page ${fadeOut ? 'fade-out' : 'fade-in'}`}>
      <h1 className="title" class="header">Hello World...</h1>

      <div className="scene" aria-hidden="true">
        <img
          className="earth"
          src="/images/earth.png"
          alt="Earth"
        />
        <div className="shadow" />
      </div>
    </main>
  )
}
