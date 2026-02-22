import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { Send, Image as ImageIcon, Film, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getImageUrl } from '../utils/images';

const Feed = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaType, setMediaType] = useState(null);
    const { addToast } = useToast();

    const fetchPosts = async () => {
        try {
            const res = await api.get('/posts');
            setPosts(res.data);
        } catch (err) {
            console.error('Fetch posts error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
            setMediaType(file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');
        }
    };

    const removeMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && !mediaFile) return;

        const formData = new FormData();
        formData.append('content', content);
        if (mediaFile) {
            formData.append('media', mediaFile);
        }

        try {
            await api.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setContent('');
            removeMedia();
            fetchPosts();
            addToast('Post created!');
        } catch (err) {
            addToast('Failed to create post', 'error');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '700px' }}>
            {user && (
                <form onSubmit={handleSubmit} className="glass-card" style={{ marginBottom: '2rem' }}>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind?"
                        style={{
                            minHeight: '120px',
                            marginBottom: '1.25rem',
                            resize: 'none',
                            fontSize: '1.1rem',
                            background: 'transparent',
                            border: 'none',
                            padding: '0.5rem'
                        }}
                    />

                    {mediaPreview && (
                        <div style={{ position: 'relative', marginBottom: '1rem', borderRadius: '0.75rem', overflow: 'hidden' }}>
                            {mediaType === 'IMAGE' ? (
                                <img src={mediaPreview} alt="Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />
                            ) : (
                                <video src={mediaPreview} controls style={{ width: '100%', maxHeight: '300px' }} />
                            )}
                            <button
                                type="button"
                                onClick={removeMedia}
                                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '50%', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={16} color="white" />
                            </button>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                <ImageIcon size={20} /> <span style={{ fontSize: '0.875rem' }}>Image</span>
                            </label>
                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                <input type="file" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                <Film size={20} /> <span style={{ fontSize: '0.875rem' }}>Video</span>
                            </label>
                        </div>
                        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Post <Send size={18} />
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading posts...</p>
            ) : (
                <div>
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
                    ))}
                    {posts.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No posts yet. Be the first!</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Feed;
