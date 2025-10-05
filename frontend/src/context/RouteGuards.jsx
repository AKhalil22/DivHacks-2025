import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export function RequireAuth({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/signin" replace />;
    return children;
}

export function PublicOnly({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div />;
    if (user) return <Navigate to="/home" replace />;
    return children;
}
