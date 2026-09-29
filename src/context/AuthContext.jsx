import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('pulseflow_token') || '');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all users/personas
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load users list:', err);
    }
  };

  // Check current auth status or load default demo persona
  useEffect(() => {
    const initAuth = async () => {
      await fetchUsers();
      try {
        const storedToken = localStorage.getItem('pulseflow_token');
        const res = await fetch('/api/auth/me', {
          headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {}
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Fallback to first user as demo user
          const uRes = await fetch('/api/auth/users');
          const uData = await uRes.json();
          if (uData.users && uData.users.length > 0) {
            setUser(uData.users[0]);
          }
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('pulseflow_token', data.token);
    return data.user;
  };

  const register = async ({ name, email, password, role }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('pulseflow_token', data.token);
    await fetchUsers();
    return data.user;
  };

  const switchPersona = async (targetUserId) => {
    try {
      const res = await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('pulseflow_token', data.token);
      }
    } catch (err) {
      console.error('Error switching demo persona:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('pulseflow_token');
    setToken('');
    // reset to first persona for demo continuity
    if (users.length > 0) {
      setUser(users[0]);
    } else {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, users, loading, login, register, switchPersona, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
