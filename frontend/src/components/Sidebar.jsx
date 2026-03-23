import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BrainCircuit, LogOut } from 'lucide-react';

export default function Sidebar({ onLogout }) {
    const [user, setUser] = useState(null);
    const [topicsCount, setTopicsCount] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch user info
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        fetch(`${baseUrl}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setUser(data))
        .catch(err => console.error(err));

        // Fetch dashboard to get topics count
        fetch(`${baseUrl}/api/learning/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setTopicsCount(data.topics?.length || 0))
        .catch(err => console.error(err));
    }, []);

    return (
        <div className="sidebar">
            <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    AI Lecture
                </h2>
                <p style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Learning OS</p>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <NavLink to="/" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }}>
                    <LayoutDashboard size={18} /> Dashboard
                </NavLink>
                <NavLink to="/tutor" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start' }}>
                    <BrainCircuit size={18} /> AI Tutor
                </NavLink>
            </nav>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white' }}>{user?.name || 'User'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.role || 'Student'}</div>
                    </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                    {topicsCount} Topics Covered
                </div>
            </div>

            <button onClick={onLogout} className="btn btn-secondary" style={{ justifyContent: 'flex-start', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <LogOut size={18} /> Logout
            </button>
        </div>
    );
}
