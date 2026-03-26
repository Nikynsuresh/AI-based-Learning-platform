import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function LearningPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const topic = queryParams.get('topic') || '';

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!topic) {
            setLoading(false);
            return;
        }

        fetch(`${import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')}/api/learning/resources?topic=${encodeURIComponent(topic)}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch youtube resources");
            return res.json();
        })
        .then(data => {
            setVideos(data.videos || []);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setError('Could not dynamically scrape. Web scraping API might be blocking the request.');
            setLoading(false);
        });
    }, [topic]);

    if (!topic) {
        return (
            <div className="animate-fade-in">
                <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginBottom: '2rem' }}>&larr; Back to Dashboard</button>
                <div className="glass-panel text-center">
                    <p>No topic provided for learning mode.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-fade-in">
            <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginBottom: '2rem' }}>&larr; Back to Dashboard</button>
            <h1 className="delay-1">Deep Dive: {topic}</h1>
            <p className="delay-2" style={{ marginBottom: '2rem' }}>Here are some highly recommended YouTube resources dynamically scraped from the web to expand your understanding.</p>

            {loading ? (
                <div className="glass-panel text-center delay-3">
                    <p>Scraping web data to find the best videos on {topic}...</p>
                </div>
            ) : error ? (
                <div className="glass-panel text-center">
                    <p style={{color: 'rgb(239, 68, 68)'}}>{error}</p>
                </div>
            ) : videos.length === 0 ? (
                <div className="glass-panel text-center">
                    <p>No suitable video recommendations could be securely scraped right now. Try taking a practice test instead!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {videos.map((vid, idx) => (
                        <a key={idx} href={vid.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <img src={vid.thumbnail} alt={vid.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                                <div style={{ padding: '1rem', flex: 1 }}>
                                    <h4 style={{ color: 'white', marginBottom: '0.8rem' }}>{vid.title}</h4>
                                    <div style={{ display: 'inline-block', background: 'rgba(239, 68, 68, 0.2)', color: 'rgb(248, 113, 113)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                        ► Watch on YouTube
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
