import React, { useState, useRef, useEffect } from 'react';
import './styles.css'

// ─── localStorage helpers (no backend needed) ─────────────────────────────────
function getUsers() {
  try { return JSON.parse(localStorage.getItem('dd_users') || '{}'); } catch { return {}; }
}
function saveUsers(users) { localStorage.setItem('dd_users', JSON.stringify(users)); }
function getSession() {
  try { return JSON.parse(localStorage.getItem('dd_session') || 'null'); } catch { return null; }
}
function saveSession(user) { localStorage.setItem('dd_session', JSON.stringify(user)); }
export function clearSession() { localStorage.removeItem('dd_session'); }
export function getCurrentUser() { return getSession(); }

// ─── Main Auth component — renders login, signup, or profile setup ────────────
export default function Auth({ onAuthComplete }) {
  const [screen, setScreen] = useState('login'); // 'login' | 'signup' | 'profile'
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'' });
  const [profile, setProfile] = useState({ age:'', height:'', weight:'', city:'', goal:'Eat Healthier' });
  const [error, setError] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  function set(field, val) { setForm(f => ({...f, [field]: val})); setError(''); }
  function setP(field, val) { setProfile(p => ({...p, [field]: val})); }

  // ── Sign Up ──
  function handleSignup(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError('Please enter your name.');
    if (!form.email.includes('@')) return setError('Enter a valid email address.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    const users = getUsers();
    if (users[form.email]) return setError('This email is already registered. Please log in.');
    users[form.email] = { name: form.name, email: form.email, password: form.password, profile: null };
    saveUsers(users);
    setPendingEmail(form.email);
    setScreen('profile');
  }

  // ── Log In ──
  function handleLogin(e) {
    e.preventDefault();
    const users = getUsers();
    const user = users[form.email];
    if (!user) return setError('No account found with this email. Please sign up.');
    if (user.password !== form.password) return setError('Incorrect password.');
    saveSession({ email: user.email, name: user.name, profile: user.profile });
    onAuthComplete({ email: user.email, name: user.name, profile: user.profile });
  }

  // ── Save Profile (first-time setup) ──
  function handleProfileSave(e) {
    e.preventDefault();
    if (!profile.age || !profile.height || !profile.weight) return setError('Please fill in age, height, and weight.');
    if (isNaN(profile.age) || isNaN(profile.height) || isNaN(profile.weight)) return setError('Age, height, and weight must be numbers.');
    const users = getUsers();
    const email = pendingEmail || form.email;
    users[email].profile = profile;
    saveUsers(users);
    const sessionUser = { email, name: users[email].name, profile };
    saveSession(sessionUser);
    onAuthComplete(sessionUser);
  }

  // ── UI ────────────────────────────────────────────────────────────────────────
  if (screen === 'profile') return <ProfileSetup profile={profile} setP={setP} error={error} setError={setError} onSave={handleProfileSave} name={getUsers()[pendingEmail]?.name} />;

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <span className="auth-float f1">🍱</span>
        <span className="auth-float f2">🥗</span>
        <span className="auth-float f3">🧾</span>
        <span className="auth-float f4">🥦</span>
        <span className="auth-float f5">🍎</span>
        <span className="auth-float f6">🌿</span>
      </div>
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-mascot">👨‍⚕️</span>
          <span className="auth-brand">Dabba<span>Doc</span></span>
        </div>
        <p className="auth-tagline">Your food. Your health. Predicted.</p>

        <div className="auth-tabs">
          <button className={screen === 'login' ? 'active' : ''} onClick={() => { setScreen('login'); setError(''); }}>Log In</button>
          <button className={screen === 'signup' ? 'active' : ''} onClick={() => { setScreen('signup'); setError(''); }}>Sign Up</button>
        </div>

        {screen === 'login' && (
          <form className="auth-form" onSubmit={handleLogin}>
            <label>Email</label>
            <input type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            <label>Password</label>
            <input type="password" placeholder="Your password" value={form.password} onChange={e => set('password', e.target.value)} required />
            {error && <div className="auth-error">⚠️ {error}</div>}
            <button type="submit" className="auth-btn">Log In →</button>
            <p className="auth-switch">Don't have an account? <span onClick={() => { setScreen('signup'); setError(''); }}>Sign up free</span></p>
          </form>
        )}

        {screen === 'signup' && (
          <form className="auth-form" onSubmit={handleSignup}>
            <label>Full Name</label>
            <input type="text" placeholder="Ananya Sharma" value={form.name} onChange={e => set('name', e.target.value)} required />
            <label>Email</label>
            <input type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            <label>Password</label>
            <input type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required />
            <label>Confirm Password</label>
            <input type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
            {error && <div className="auth-error">⚠️ {error}</div>}
            <button type="submit" className="auth-btn">Create Account →</button>
            <p className="auth-switch">Already have an account? <span onClick={() => { setScreen('login'); setError(''); }}>Log in</span></p>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Profile Setup Screen (first time only) ────────────────────────────────────
function ProfileSetup({ profile, setP, error, setError, onSave, name }) {
  const goals = ['Eat Healthier', 'Lose Weight', 'Build Muscle', 'Manage Diabetes', 'Lower BP', 'General Wellness'];
  return (
    <div className="auth-page">
      <div className="auth-bg">
        <span className="auth-float f1">🍱</span><span className="auth-float f3">🧾</span>
        <span className="auth-float f5">🍎</span><span className="auth-float f6">🌿</span>
      </div>
      <div className="auth-card profile-card">
        <div className="profile-welcome">
          <span style={{fontSize:48}}>🎉</span>
          <h2>Welcome, {name || 'there'}!</h2>
          <p>Tell us a bit about yourself so we can personalise your health insights.</p>
        </div>
        <form className="auth-form" onSubmit={onSave}>
          <div className="profile-row">
            <div>
              <label>Age (years)</label>
              <input type="number" placeholder="e.g. 24" min="10" max="100" value={profile.age} onChange={e => setP('age', e.target.value)} required />
            </div>
            <div>
              <label>Height (cm)</label>
              <input type="number" placeholder="e.g. 163" min="100" max="250" value={profile.height} onChange={e => setP('height', e.target.value)} required />
            </div>
            <div>
              <label>Weight (kg)</label>
              <input type="number" placeholder="e.g. 58" min="20" max="300" value={profile.weight} onChange={e => setP('weight', e.target.value)} required />
            </div>
          </div>
          <label>City</label>
          <input type="text" placeholder="e.g. Mumbai, Delhi, Bangalore..." value={profile.city} onChange={e => setP('city', e.target.value)} />
          <label>Your Health Goal</label>
          <div className="goal-chips">
            {goals.map(g => (
              <button type="button" key={g} className={profile.goal === g ? 'selected' : ''} onClick={() => setP('goal', g)}>{g}</button>
            ))}
          </div>
          {error && <div className="auth-error">⚠️ {error}</div>}
          <button type="submit" className="auth-btn" style={{marginTop:8}}>
            Start My Health Journey →
          </button>
        </form>
      </div>
    </div>
  );
}