import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getImageUrl } from '../utils/images';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Users, UserPlus, UserMinus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PostCard from '../components/PostCard';
import { useToast } from '../context/ToastContext';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { addToast } = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const [followers, setFollowers] = useState([]);
    const [followingList, setFollowingList] = useState([]);
    const [formData, setFormData] = useState({ name: '', bio: '', avatar: '' });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');

    const userId = id || (currentUser ? currentUser.id : null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get(`/users/${userId}`);
                setUser(res.data);

                // Check if current user follows this user
                if (currentUser && currentUser.id !== userId) {
                    const followsRes = await api.get(`/follows/following/${currentUser.id}`);
                    setIsFollowing(followsRes.data.some(f => f.id === userId));
                }

                setFormData({ name: res.data.name, bio: res.data.bio || '', avatar: res.data.avatar || '' });
                if (res.data.avatar) {
                    const avatarUrl = res.data.avatar.startsWith('http')
                        ? res.data.avatar
                        : getImageUrl(res.data.avatar); // Use getImageUrl
                    setAvatarPreview(avatarUrl);
                }
                setLoading(false);
            } catch (err) {
                setError('User not found');
                setLoading(false);
            }
        };

        if (userId) fetchUser();
    }, [userId, currentUser]);

    const handleFollow = async () => {
        try {
            const res = await api.post(`/follows/${userId}`);
            setIsFollowing(res.data.followed);
            // Refresh user counts
            const userRes = await api.get(`/users/${userId}`);
            setUser(userRes.data);
            addToast(res.data.message);
        } catch (err) {
            addToast('Failed to follow', 'error');
        }
    };

    const handleMessage = async () => {
        try {
            const res = await api.post('/chat/conversations', { participantId: userId });
            navigate('/messages');
        } catch (err) {
            addToast('Failed to start chat', 'error');
        }
    };

    const fetchFollowersList = async () => {
        try {
            const res = await api.get(`/follows/followers/${userId}`);
            setFollowers(res.data);
            setShowFollowers(true);
        } catch (err) {
            addToast('Failed to fetch followers', 'error');
        }
    };

    const fetchFollowingList = async () => {
        try {
            const res = await api.get(`/follows/following/${userId}`);
            setFollowingList(res.data);
            setShowFollowing(true);
        } catch (err) {
            addToast('Failed to fetch following', 'error');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const data = new FormData();
        data.append('name', formData.name);
        data.append('bio', formData.bio);
        if (avatarFile) {
            data.append('avatar', avatarFile);
        }

        try {
            const res = await api.put('/users/profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUser({ ...user, ...res.data });
            setIsEditing(false);
            addToast('Profile updated');

            // Update localStorage user if it's the current user
            if (isOwnProfile) {
                const storedUser = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({ ...storedUser, ...res.data }));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed');
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    if (error) return <div className="container error-msg">{error}</div>;

    const isOwnProfile = currentUser && currentUser.id === user.id;

    // Removed getAvatarUrl as getImageUrl is now used directly

    return (
        <div className="container">
            <div className="glass-card mb-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        {(avatarPreview || user.avatar) ? (
                            <img
                                src={avatarPreview || getImageUrl(user.avatar)} // Use getImageUrl
                                alt={user.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : user.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{user.name}</h1>
                        <p style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                    </div>
                    {isOwnProfile ? (
                        <button className="btn-primary" onClick={() => setIsEditing(!isEditing)}>
                            {isEditing ? 'Cancel' : 'Edit Profile'}
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className={isFollowing ? "btn-secondary" : "btn-primary"} onClick={handleFollow}>
                                {isFollowing ? <><UserMinus size={18} /> Unfollow</> : <><UserPlus size={18} /> Follow</>}
                            </button>
                            <button className="btn-secondary" onClick={handleMessage}>
                                <MessageSquare size={18} /> Message
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
                    <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={fetchFollowersList}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{user._count?.followers || 0}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Followers</div>
                    </div>
                    <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={fetchFollowingList}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{user._count?.following || 0}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Following</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{user._count?.posts || 0}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Posts</div>
                    </div>
                </div>

                {isEditing ? (
                    <form onSubmit={handleUpdate} encType="multipart/form-data">
                        <div className="mb-4">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Profile Picture</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ padding: '0.5rem', marginBottom: '0.5rem' }}
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <textarea
                            placeholder="Bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        />
                        <button type="submit" className="btn-primary">Save Changes</button>
                    </form>
                ) : (
                    <p style={{ fontStyle: user.bio ? 'normal' : 'italic' }}>{user.bio || 'No bio yet.'}</p>
                )}
            </div>

            {/* Followers/Following Modal (Simple version using conditional rendering) */}
            {(showFollowers || showFollowing) && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }} onClick={() => { setShowFollowers(false); setShowFollowing(false); }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '400px', maxHeight: '500px', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{showFollowers ? 'Followers' : 'Following'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {(showFollowers ? followers : followingList).map(u => (
                                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', overflow: 'hidden' }}>
                                        {u.avatar ? (
                                            <img src={getImageUrl(u.avatar)} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.bio?.substring(0, 50)}...</div>
                                    </div>
                                    <button
                                        className="btn-primary"
                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                                        onClick={() => {
                                            navigate(`/profile/${u.id}`);
                                            setShowFollowers(false);
                                            setShowFollowing(false);
                                        }}
                                    >
                                        View
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Posts</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {user.posts && user.posts.length > 0 ? (
                    user.posts.map(post => <PostCard key={post.id} post={post} />)
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No posts yet.</p>
                )}
            </div>
        </div>
    );
};

export default Profile;
