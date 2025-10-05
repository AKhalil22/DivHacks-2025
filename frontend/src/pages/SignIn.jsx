import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SignIn() {
    const { signIn, error, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        try { await signIn(email, password); navigate('/'); } catch { }
    }

    return (
        <div className="auth-form">
            <h2>Sign In</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" required /></label>
                <label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" required minLength={8} /></label>
                <button type="submit" disabled={loading}>{loading ? '...' : 'Sign In'}</button>
            </form>
        </div>
    );
}
