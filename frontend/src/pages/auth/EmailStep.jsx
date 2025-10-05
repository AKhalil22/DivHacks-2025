import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./EmailStep.css"

export default function EmailStep() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [isValid, setIsValid] = useState(false)

  const handleChange = (e) => {
    const input = e.target.value
    setEmail(input)
    // simple regex email validation
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
    setIsValid(valid)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isValid) {
      navigate("/auth/password") // ✅ go to next step
    }
  }

  return (
    <main className="email-page">
      <h1 className="email-title">What’s your email?</h1>

      <form className="email-form" onSubmit={handleSubmit}>
        <div className="email-input-wrapper">
          <input
            type="email"
            className={`email-input ${isValid ? "valid" : ""}`}
            value={email}
            onChange={handleChange}
            placeholder=""
            required
          />
          {isValid && <span className="checkmark">✓</span>}
        </div>

        <button
          type="submit"
          className="email-btn"
          disabled={!isValid}
        >
          confirm
        </button>
      </form>
    </main>
  )
}
