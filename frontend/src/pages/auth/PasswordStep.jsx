import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './PasswordStep.css'
import { auth } from '../../api/firebase' // fixed relative path
import { createUserWithEmailAndPassword } from 'firebase/auth'

export default function PasswordStep() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Remove hardcoded userInfo; validate against entered email instead
  const emailLocalPart = email?.split('@')[0] || ''
  const validations = {
    noEmailInPassword:
      (!email || !password.toLowerCase().includes(email.toLowerCase())) &&
      (!emailLocalPart || !password.toLowerCase().includes(emailLocalPart.toLowerCase())),
    minLength: password.length >= 8,
    hasSymbolOrNumber: /[\d!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password),
  }

  const strength =
    !validations.minLength
      ? 'weak'
      : validations.minLength && validations.hasSymbolOrNumber && validations.noEmailInPassword
      ? 'strong'
      : 'moderate'

  const allGood =
    validations.noEmailInPassword &&
    validations.minLength &&
    validations.hasSymbolOrNumber

  // Remove unused handleConfirm; use handleSubmit for Firebase signup only
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!allGood || !email) {
      setError('Enter a valid email and strong password')
      return
    }
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await cred.user.getIdToken(true) // set localStorage via onIdTokenChanged
      // After auth, the Username step will call the backend to create the profile
      navigate('/auth/username')
    } catch (err) {
      setError(err.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='password-container'>
      <h1 className='heading'>Create your account</h1>

      <form onSubmit={handleSubmit}>
        <div className='password-input-wrapper'>
          <input
            type='email'
            className='password-input'
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder='Enter email'
            aria-label='Email'
            autoComplete='email'
            required
          />
        </div>

        <div className='password-input-wrapper'>
          <input
            type='password'
            className='password-input'
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder='Enter password'
            aria-label='Password'
            autoComplete='new-password'
            required
          />
        </div>

        <div className={`password-strength ${strength.toLowerCase()}`}>
          password strength: <span>{strength}</span>
        </div>

        <ul className='validation-list'>
          <li className={validations.noEmailInPassword ? 'valid' : ''}>
            {validations.noEmailInPassword ? '✓' : '○'} Must not contain your email
          </li>
          <li className={validations.minLength ? 'valid' : ''}>
            {validations.minLength ? '✓' : '○'} At least 8 characters
          </li>
          <li className={validations.hasSymbolOrNumber ? 'valid' : ''}>
            {validations.hasSymbolOrNumber ? '✓' : '○'} Contains a symbol or number
          </li>
        </ul>

        <button
          className='confirm-button'
          disabled={!allGood || loading}
          aria-disabled={!allGood || loading}
          type='submit'
        >
          {loading ? 'Creating...' : 'Confirm'}
        </button>
      </form>

      {error && <div className='error-message'>{error}</div>}
    </div>
  )
}
