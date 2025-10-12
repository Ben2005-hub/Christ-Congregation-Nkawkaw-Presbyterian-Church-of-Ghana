import { useState } from 'react';
import getApiBase from './apiBase';
import './App.css';


function Login({ onLogin, serverStatus, checkServer }) {
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
  const res = await fetch(`${getApiBase()}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        // call parent first so App state updates immediately, then persist token
        try { console.log('Login successful, invoking onLogin with token', String(data.token).slice(0,8) + '...'); } catch(e){}
        onLogin(data.token);
        try { localStorage.setItem('admin_token', data.token); } catch (e) {}
        setSuccess('Login successful');
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
  const res = await fetch(`${getApiBase()}/api/admin/signup`, {
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
      {serverStatus !== 'ok' && (
        <div>
          <p style={{ color: 'darkred' }}>Server appears unreachable ({serverStatus}). Please start the backend and try again.</p>
          <div style={{ marginBottom: 8 }}>
            <button type="button" onClick={async () => { try { const ok = await checkServer(); if (!ok) alert('Still unreachable'); else alert('Server is now reachable, please login'); } catch(e){ alert('Check failed'); } }} style={{ background: 'none', border: '1px solid #ccc', padding: '6px 10px', borderRadius: 4 }}>Check server</button>
          </div>
        </div>
      )}
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
