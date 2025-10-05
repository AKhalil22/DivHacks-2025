import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CreateAccount() {
    const { signUp, error, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        try { await signUp(email, password, displayName, username); navigate('/'); } catch { }
    }

    return (
        <div className="auth-form">
            <h2>Create Account</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" required /></label>
                <label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" required minLength={8} /></label>
                <label>Display Name<input value={displayName} onChange={e => setDisplayName(e.target.value)} required /></label>
                <label>Username<input value={username} onChange={e => setUsername(e.target.value)} required pattern="^[A-Za-z0-9_]{3,24}$" /></label>
                <button type="submit" disabled={loading}>{loading ? '...' : 'Create Account'}</button>
            </form>
        </div>
    );
}
