import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Direct API call
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const url = `${baseUrl}/api/auth/${isLogin ? 'login' : 'signup'}`;
            const payload = isLogin ? { username: email, password } : { name, email, password };

            const config = {
                method: 'POST',
                headers: { 'Content-Type': isLogin ? 'application/x-www-form-urlencoded' : 'application/json' },
            };

            if (isLogin) {
                config.body = new URLSearchParams(payload);
            } else {
                config.body = JSON.stringify(payload);
            }

            const res = await fetch(url, config);
            const data = await res.json();

            if (!res.ok) throw new Error(data.detail || data.error || 'Auth failed');

            if (!isLogin && !data.access_token && !data.token) {
                alert('Account created! Please log in.');
                setIsLogin(true);
                return;
            }

            if (data.access_token || data.token) {
                onLogin(data.access_token || data.token);
            } else {
                throw new Error('No access token received from server');
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel animate-fade-in" style={{ width: '400px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>AI Lecture</h1>
                <p style={{ marginBottom: '2rem' }}>AI Personalized Learning Platform</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!isLogin && (
                        <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                    )}
                    <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <p style={{ marginTop: '2rem', fontSize: '0.9rem' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </span>
                </p>
            </div>
        </div>
    );
}
