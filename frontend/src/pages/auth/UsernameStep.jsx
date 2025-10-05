import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './UsernameStep.css'

export default function UsernameStep({ userName, setUserName }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')

  // 3–20 chars, starts with a letter, letters/numbers/underscores only
  const usernameRegex = /^[A-Za-z][A-Za-z0-9_]{7,19}$/
  const isValid = usernameRegex.test(username)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isValid) return

    setUserName(username) // Update the global userName state
    navigate('/home') // Navigate to the home page
  }

  return (
    <main className="username-page">
      <h1 className="heading">Enter a username:</h1>

      <form className="username-form" onSubmit={handleSubmit}>
        {/* FIELD makes input + hint share the same left edge */}
        <div className="field">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="username-input"
            aria-label="Username"
            maxLength={20}
            autoCapitalize="off"
            autoComplete="off"
            spellCheck="false"
          />

          {username.length > 0 && (
            <p className={`username-hint ${isValid ? 'ok' : 'err'}`}>
              {isValid
                ? 'That is a valid username!'
                : 'Please enter valid username.'}
            </p>
          )}
        </div>

        <button type="submit" className="confirm-button" disabled={!isValid}>
          confirm
        </button>
      </form>
    </main>
  )
}
