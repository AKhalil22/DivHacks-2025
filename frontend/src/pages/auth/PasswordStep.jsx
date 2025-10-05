import React, { useState } from 'react';
import './PasswordPage.css';

export default function PasswordPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  const userInfo = {
    name: 'user', // Replace with actual name/email logic if needed
    email: 'user@example.com',
  };

  const validations = {
    noNameOrEmail: !password.toLowerCase().includes(userInfo.name.toLowerCase()) &&
                   !password.toLowerCase().includes(userInfo.email.toLowerCase()),
    minLength: password.length >= 8,
    hasSymbolOrNumber: /[\d!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password),
  };

  const strength =
    !validations.minLength ? 'Weak' :
    validations.minLength && validations.hasSymbolOrNumber && validations.noNameOrEmail
      ? 'Strong' :
    'Moderate';

  return (
    <div className="password-container">
      <h1 className="password-title">Create your password:</h1>

      <div className="password-input-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          className="password-input"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setTouched(true);
          }}
          placeholder="Enter password"
        />
        <button
          type="button"
          className="toggle-button"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>

      {touched && (
        <>
          <div className={`password-strength ${strength.toLowerCase()}`}>
            Password Strength: <span>{strength}</span>
          </div>

          <ul className="validation-list">
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
        </>
      )}

      <button className="confirm-button">confirm</button>
    </div>
  );
}
