import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './UsernameStep.css'
import { upsertProfile } from '../../api/client' // add

export default function UsernameStep() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')

  // 3–20 chars, starts with a letter, letters/numbers/underscores only
  const usernameRegex = /^[A-Za-z][A-Za-z0-9_]{2,19}$/   // fix length to 3–20
  const isValid = usernameRegex.test(username)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return
    try {
      await upsertProfile({
        display_name: username,
        username,
      })
      navigate('/home')
    } catch (err) {
      console.error('Failed to create profile', err)
      // Optional: surface an error toast/message
    }
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
