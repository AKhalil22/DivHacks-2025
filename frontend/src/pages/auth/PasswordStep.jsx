import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './PasswordStep.css'

export default function PasswordStep() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')

  const userInfo = {
    name: 'user',
    email: 'user@example.com'
  }

  const validations = {
    noNameOrEmail:
      !password.toLowerCase().includes(userInfo.name.toLowerCase()) &&
      !password.toLowerCase().includes(userInfo.email.toLowerCase()),
    minLength: password.length >= 8,
    hasSymbolOrNumber: /[\d!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)
  }

  const strength =
    !validations.minLength
      ? 'weak'
      : validations.minLength && validations.hasSymbolOrNumber && validations.noNameOrEmail
      ? 'strong'
      : 'moderate'

  const allGood =
    validations.noNameOrEmail &&
    validations.minLength &&
    validations.hasSymbolOrNumber

  const handleConfirm = () => {
    if (!allGood) return
    navigate('/auth/username')
  }

  return (
    <div className='password-container'>
      <h1 className='heading'>Create your password:</h1>

      <div className='password-input-wrapper'>
        <input
          type='password'
          className='password-input'
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder='Enter password'
          aria-label='Password'
        />
      </div>

      <div className={`password-strength ${strength.toLowerCase()}`}>
        password strength: <span>{strength}</span>
      </div>

      <ul className='validation-list'>
        <li className={validations.noNameOrEmail ? 'valid' : ''}>
          {validations.noNameOrEmail ? '✓' : '○'} Must not contain your name or email
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
        disabled={!allGood}
        onClick={handleConfirm}
        aria-disabled={!allGood}
      >
        confirm
      </button>
    </div>
  )
}
