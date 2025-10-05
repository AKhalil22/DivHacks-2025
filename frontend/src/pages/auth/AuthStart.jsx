import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthStart() {
  const navigate = useNavigate()

  return (
    <main className="auth">
      <h1 className="auth-title header">TechSpace</h1>

      <div className="auth-actions">
        <button
          id="createAccount"
          className="auth-btn"
          onClick={() => navigate('/auth/email')}
        >
          create account
        </button>

        <button
          id="signIn"
          className="auth-link"
          onClick={() => navigate('/auth/signin')}
        >
          sign in
        </button>
      </div>
    </main>
  )
}
