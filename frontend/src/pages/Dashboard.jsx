import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [topics, setTopics] = useState([]);
    const [weakAreas, setWeakAreas] = useState([]);
    const [recommendedTopics, setRecommendedTopics] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = () => {
        setLoading(true);
        const baseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');
        fetch(`${baseUrl}/api/learning/dashboard`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => {
                if (res.status === 401) {
                    localStorage.removeItem('token');
                    window.location.reload();
                    throw new Error('Unauthorized');
                }
                return res.json();
            })
            .then(data => {
                setTopics(data.topics || []);
                setWeakAreas(data.weak_areas || []);
                setRecommendedTopics(data.recommended_topics || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (e, topicTitle) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete all progress for "${topicTitle}"?`)) return;

        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');
            await fetch(`${baseUrl}/api/learning/delete-topic?topic=${encodeURIComponent(topicTitle)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            fetchData();
        } catch (err) {
            console.error('Failed to delete topic', err);
        }
    };

    const [expandedTopic, setExpandedTopic] = useState(null);
    const [actionModalBaseTopic, setActionModalBaseTopic] = useState(null);
    const [actionModalTopic, setActionModalTopic] = useState(null);
    const [recommendationChoices, setRecommendationChoices] = useState([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);

    const handleWhatsNext = async (topic) => {
        setActionModalTopic(null);
        setActionModalBaseTopic(topic);
        setLoadingRecommendations(true);
        setRecommendationChoices([]);
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');
            const res = await fetch(`${baseUrl}/api/learning/recommendations?topic=${encodeURIComponent(topic)}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setRecommendationChoices(data.recommendations || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingRecommendations(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="delay-1">Your Knowledge Hub</h1>
            <p className="delay-2" style={{ marginBottom: '2rem' }}>Welcome back. Here is your recent learning progress.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel delay-3" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(16,185,129,0.1))' }}>
                    <h3>Focus Areas (Lagging Topics)</h3>
                    {loading ? <p>Analyzing your progress...</p> : 
                        weakAreas.length === 0 ? (
                        <p style={{marginTop: '1rem', color: 'var(--text-main)'}}>Great job! No lagging topics detected so far. Keep taking quizzes to populate this area.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {weakAreas.map((w, i) => (
                                <li key={i} onClick={() => setActionModalTopic(w.title)} style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', borderLeft: '3px solid rgb(239, 68, 68)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                                    <strong style={{color: 'white'}}>{w.title}</strong>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Average Scoring: {w.averageScore}% - Needs Review</div>
                                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${w.averageScore}%`, height: '100%', background: 'rgb(239, 68, 68)', borderRadius: '4px', transition: 'width 1s ease-in-out' }}></div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="glass-panel delay-3">
                    <h3>Recent Topics</h3>
                    <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Click on a topic to view sub-topic performance.</p>
                    <ul style={{ listStyle: 'none', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {loading ? <p>Loading data...</p> :
                            topics.length === 0 ? <p>No completed topics yet. Go to AI Tutor!</p> :
                                topics.map((t, i) => {
                                    const progressColor = t.averageScore >= 80 ? 'rgb(16, 185, 129)' : t.averageScore >= 50 ? 'rgb(245, 158, 11)' : 'rgb(239, 68, 68)';
                                    const isExpanded = expandedTopic === i;
                                    
                                    return (
                                        <li 
                                            key={i} 
                                            style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `3px solid ${progressColor}`, transition: 'all 0.2s' }}
                                        >
                                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '1rem'}} onClick={() => setExpandedTopic(isExpanded ? null : i)}>
                                                <div style={{flex: 1}}>
                                                    <strong>{t.title}</strong>
                                                </div>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '0.8rem'}}>
                                                    <button 
                                                        onClick={(e) => handleDelete(e, t.title)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.6, transition: 'opacity 0.2s' }}
                                                        onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                                                        onMouseOut={(e) => e.currentTarget.style.opacity = 0.6}
                                                        title="Delete topic history"
                                                    >
                                                        🗑️
                                                    </button>
                                                    <span style={{fontSize: '0.8rem'}}>{isExpanded ? '▲' : '▼'}</span>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Difficulty: {t.difficulty}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Overall Score: {t.averageScore}%</div>
                                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${t.averageScore}%`, height: '100%', background: progressColor, borderRadius: '3px', transition: 'width 1s ease-in-out' }}></div>
                                            </div>
                                            
                                            <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
                                                <button className="btn btn-secondary" style={{flex: 1, padding: '0.4rem', fontSize: '0.8rem'}} onClick={() => handleWhatsNext(t.title)}>What's Next?</button>
                                            </div>
                                            
                                            {isExpanded && t.subtopics && t.subtopics.length > 0 && (
                                                <div className="animate-fade-in" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <h4 style={{fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', color: 'var(--text-muted)'}}>Sub-topics Mastered</h4>
                                                    <ul style={{listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
                                                        {t.subtopics.map((st, stIdx) => {
                                                            const stColor = st.averageScore >= 80 ? 'rgb(16, 185, 129)' : st.averageScore >= 50 ? 'rgb(245, 158, 11)' : 'rgb(239, 68, 68)';
                                                            return (
                                                                <li key={stIdx} style={{background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '6px'}}>
                                                                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem'}}>
                                                                        <span style={{color: 'white'}}>{st.name}</span>
                                                                        <span style={{color: stColor, fontWeight: 'bold'}}>{st.averageScore}%</span>
                                                                    </div>
                                                                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                                                        <div style={{ width: `${st.averageScore}%`, height: '100%', background: stColor, borderRadius: '2px', transition: 'width 1s ease-in-out' }}></div>
                                                                    </div>
                                                                </li>
                                                            )
                                                        })}
                                                    </ul>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                    </ul>
                </div>

                <div className="glass-panel delay-3" style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(99, 102, 241, 0.15))' }}>
                    <h3>Suggested Topics to Explore</h3>
                    <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Scraped from the web based on your recent activity.</p>
                    <ul style={{ listStyle: 'none', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {loading ? <p>Finding recommendations...</p> : 
                            recommendedTopics.length === 0 ? <p style={{marginTop: '1rem', color: 'var(--text-muted)'}}>Complete topics to get recommendations.</p> :
                            recommendedTopics.map((rec, i) => (
                                <li key={i} onClick={() => setActionModalTopic(rec.recommendation)} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                                    <strong style={{color: 'white'}}>{rec.recommendation}</strong>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Related to: {rec.sourceTopic}</div>
                                </li>
                            ))
                        }
                    </ul>
                </div>
            </div>

            {(actionModalBaseTopic || actionModalTopic) && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, WebkitBackdropFilter: 'blur(5px)', backdropFilter: 'blur(5px)' }}>
                    <div className="glass-panel animate-fade-in" style={{ width: '450px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                        {actionModalBaseTopic && !actionModalTopic ? (
                            <>
                                <h2 style={{ marginBottom: '1rem' }}>Next steps for <span style={{ color: 'var(--accent)' }}>{actionModalBaseTopic}</span></h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Select a related topic automatically scraped from Wikipedia to continue your journey:</p>
                                
                                {loadingRecommendations ? (
                                    <p>Gathering intelligent recommendations...</p>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem', marginTop: '1rem' }}>
                                        {recommendationChoices.map((rec, i) => (
                                            <button key={i} className="btn btn-secondary" style={{ padding: '1rem', whiteSpace: 'normal', height: 'auto', lineHeight: '1.4' }} onClick={() => setActionModalTopic(rec)}>
                                                {rec}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <h2 style={{ marginBottom: '1rem' }}>Topic: <span style={{ color: 'var(--accent)' }}>{actionModalTopic}</span></h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>How would you like to proceed with this topic?</p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <button className="btn btn-secondary" style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} onClick={() => window.open(`/learn?topic=${encodeURIComponent(actionModalTopic)}`, '_blank')}>
                                        <span style={{ fontSize: '1.5rem' }}>📺</span>
                                        <span>Learn Topic</span>
                                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Watch scraped videos</span>
                                    </button>
                                    <button className="btn btn-primary" style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} onClick={() => navigate(`/tutor?topic=${encodeURIComponent(actionModalTopic)}`)}>
                                        <span style={{ fontSize: '1.5rem' }}>📝</span>
                                        <span>Take a Test</span>
                                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Continue evaluation</span>
                                    </button>
                                </div>
                            </>
                        )}
                        
                        <button className="btn" style={{ marginTop: '2rem', background: 'transparent', color: 'var(--text-muted)', padding: '0.5rem 2rem' }} onClick={() => { setActionModalTopic(null); setActionModalBaseTopic(null); }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
