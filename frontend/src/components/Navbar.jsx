import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, User, Bell, MessageSquare } from 'lucide-react';
import api from '../services/api';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [unreadCount, setUnreadCount] = React.useState(0);

    React.useEffect(() => {
        if (user) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchUnreadCount = async () => {
        try {
            const { data } = await api.get('/notifications');
            const unread = data.filter(n => !n.read).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length > 2) {
            try {
                const { data } = await api.get(`/users/search/${query}`);
                setSearchResults(data);
            } catch (err) {
                console.error(err);
            }
        } else {
            setSearchResults([]);
        }
    };

    const getAvatarUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${api.defaults.baseURL.replace('/api', '')}${path}`;
    };

    return (
        <nav className="glass-nav" style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            padding: '1rem 0'
        }}>
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 1rem'
            }}>
                <Link to="/" style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(to right, #6366f1, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    SocialLink
                </Link>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    {user ? (
                        <>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    style={{
                                        width: '200px',
                                        height: '36px',
                                        padding: '0 1rem',
                                        marginBottom: 0,
                                        borderRadius: '18px',
                                        fontSize: '0.875rem'
                                    }}
                                />
                                {searchResults.length > 0 && (
                                    <div className="glass-card" style={{
                                        position: 'absolute',
                                        top: '40px',
                                        left: 0,
                                        width: '250px',
                                        padding: '0.5rem',
                                        zIndex: 101,
                                        maxHeight: '300px',
                                        overflowY: 'auto'
                                    }}>
                                        {searchResults.map(result => (
                                            <Link
                                                key={result.id}
                                                to={`/profile/${result.id}`}
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    setSearchResults([]);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    padding: '0.5rem',
                                                    borderRadius: '0.5rem',
                                                    color: 'var(--text-main)',
                                                    textDecoration: 'none'
                                                }}
                                                className="search-result-item"
                                            >
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: 'var(--primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    overflow: 'hidden'
                                                }}>
                                                    {result.avatar ? (
                                                        <img src={getAvatarUrl(result.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : result.name[0]}
                                                </div>
                                                <span>{result.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Link to="/feed" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                                <Home size={20} /> <span style={{ display: 'none', md: 'inline' }}>Feed</span>
                            </Link>
                            <Link to="/notifications" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', position: 'relative' }}>
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-5px',
                                        right: '-5px',
                                        background: 'var(--error)',
                                        color: 'white',
                                        fontSize: '0.65rem',
                                        padding: '2px 5px',
                                        borderRadius: '10px',
                                        fontWeight: 'bold'
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                                <span style={{ display: 'none', md: 'inline' }}>Notifications</span>
                            </Link>
                            <Link to="/messages" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                                <MessageSquare size={20} /> <span style={{ display: 'none', md: 'inline' }}>Messages</span>
                            </Link>
                            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                                <User size={20} /> <span style={{ display: 'none', md: 'inline' }}>Profile</span>
                            </Link>
                            <button onClick={logout} style={{
                                background: 'none',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <LogOut size={20} /> <span style={{ display: 'none', '@media (minWidth: 768px)': { display: 'inline' } }}>Logout</span>
                            </button>
                            <Link to="/profile" style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                color: 'white',
                                overflow: 'hidden'
                            }}>
                                {user.avatar ? (
                                    <img src={getAvatarUrl(user.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : user.name.charAt(0).toUpperCase()}
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>Login</Link>
                            <Link to="/signup" className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Sign Up</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
