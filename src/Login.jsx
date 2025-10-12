import { useState } from 'react';

const API_BASE = (function(){ try { const loc = window.location; return `${loc.protocol}//${loc.hostname}:5001`; } catch(e){ return 'http://localhost:5001'; } })();
import './App.css';


function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [signup, setSignup] = useState(false);
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        // persist token so page reloads keep session
        try { localStorage.setItem('admin_token', data.token); } catch (e) {}
        onLogin(data.token);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Server error');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
  const res = await fetch(`${API_BASE}/api/admin/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Signup successful! You can now log in.');
        setSignup(false);
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch {
      setError('Server error');
    }
  };

  return (
    <div className="container">
      <h2>{signup ? 'Admin Signup' : 'Admin Login'}</h2>
      <form onSubmit={signup ? handleSignup : handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">{signup ? 'Sign Up' : 'Login'}</button>
      </form>
      <div style={{ marginTop: 10 }}>
        <button type="button" onClick={() => { setSignup(!signup); setError(''); setSuccess(''); }} style={{ background: 'none', color: '#1a3c1a', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>
          {signup ? 'Already have an account? Login' : 'New admin? Sign up'}
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
}

export default Login;
