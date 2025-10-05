import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'
import './Galaxy.css'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className='galaxy-wrap'>
      <div className='galaxy-viewport'>
        <div className='galaxy-canvas'>

          {/* Earth */}
          <button
            className='planet planet-earth'
            style={{ left: '48%', top: '42%', width: 120, height: 120 }}
            aria-label='Earth'
            onClick={() => navigate('/planet/earth')}
          />

          {/* Purple */}
          <button
            className='planet planet-purple'
            style={{ left: '20%', top: '70%', width: 96, height: 96 }}
            aria-label='Purple Planet'
            onClick={() => navigate('/planet/purple')}
          />

          {/* Blue */}
          <button
            className='planet planet-blue'
            style={{ left: '72%', top: '24%', width: 100, height: 100 }}
            aria-label='Blue Planet'
            onClick={() => navigate('/planet/blue')}
          />

          {/* Red */}
          <button
            className='planet planet-red'
            style={{ left: '65%', top: '76%', width: 84, height: 84 }}
            aria-label='Red Planet'
            onClick={() => navigate('/planet/red')}
          />
        </div>
      </div>

      <div className='hud'>
        <h1>Galaxy</h1>
        <p>Click a planet to visit</p>
      </div>
    </div>
  )
}
