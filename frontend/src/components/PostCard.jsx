import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Trash2, Repeat } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PostCard = ({ post, onUpdate }) => {
    const { user } = useAuth();
    const [commentContent, setCommentContent] = useState('');
    const [showComments, setShowComments] = useState(false);

    const { addToast } = useToast();

    const handleLike = async () => {
        if (!user) {
            addToast('Please login to like posts', 'error');
            return;
        }
        try {
            await api.post(`/posts/${post.id}/like`);
            onUpdate();
        } catch (err) {
            addToast('Like failed', 'error');
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentContent.trim()) return;
        try {
            await api.post(`/posts/${post.id}/comment`, { content: commentContent });
            setCommentContent('');
            onUpdate();
            addToast('Comment added');
        } catch (err) {
            addToast('Comment failed', 'error');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await api.delete(`/posts/${post.id}`);
                addToast('Post deleted');
                onUpdate();
            } catch (err) {
                addToast('Delete failed', 'error');
            }
        }
    };

    const isLiked = post.likes.some(like => like.userId === user?.id);

    const handleShare = async () => {
        try {
            await api.post(`/posts/${post.id}/share`);
            addToast('Shared successfully!');
            onUpdate();
        } catch (err) {
            addToast('Share failed', 'error');
        }
    };

    const getAvatarUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${api.defaults.baseURL.replace('/api', '')}${path}`;
    };

    return (
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    overflow: 'hidden'
                }}>
                    {post.author.avatar ? (
                        <img src={getAvatarUrl(post.author.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : post.author.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0 }}>{post.author.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                </div>
                {user && user.id === post.author.id && (
                    <button onClick={handleDelete} style={{ background: 'none', color: 'var(--text-muted)' }} title="Delete Post">
                        <Trash2 size={18} />
                    </button>
                )}
            </div>

            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>{post.content}</p>

            {post.mediaUrl && (
                <div style={{ marginBottom: '1.5rem', borderRadius: '0.75rem', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                    {post.mediaType === 'VIDEO' ? (
                        <video src={getAvatarUrl(post.mediaUrl)} controls style={{ width: '100%', display: 'block' }} />
                    ) : (
                        <img src={getAvatarUrl(post.mediaUrl)} alt="" style={{ width: '100%', display: 'block' }} />
                    )}
                </div>
            )}

            {post.sharedPost && (
                <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', overflow: 'hidden' }}>
                            {post.sharedPost.author.avatar ? (
                                <img src={getAvatarUrl(post.sharedPost.author.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : post.sharedPost.author.name[0]}
                        </div>
                        <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{post.sharedPost.author.name}</span>
                    </div>
                    <p style={{ fontSize: '0.95rem', margin: 0 }}>{post.sharedPost.content}</p>
                    {post.sharedPost.mediaUrl && (
                        <div style={{ marginTop: '0.75rem', borderRadius: '0.5rem', overflow: 'hidden' }}>
                            {post.sharedPost.mediaType === 'VIDEO' ? (
                                <video src={getAvatarUrl(post.sharedPost.mediaUrl)} controls style={{ width: '100%', display: 'block' }} />
                            ) : (
                                <img src={getAvatarUrl(post.sharedPost.mediaUrl)} alt="" style={{ width: '100%', display: 'block' }} />
                            )}
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                <button
                    onClick={handleLike}
                    style={{
                        background: 'none',
                        color: isLiked ? 'var(--error)' : 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                    <span>{post.likes.length}</span>
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    style={{ background: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <MessageCircle size={20} />
                    <span>{post.comments.length}</span>
                </button>
                <button
                    onClick={handleShare}
                    style={{ background: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Repeat size={20} />
                    <span>{post.sharingPosts?.length || 0}</span>
                </button>
            </div>

            {showComments && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                    {post.comments.map(comment => (
                        <div key={comment.id} style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    overflow: 'hidden'
                                }}>
                                    {comment.user.avatar ? (
                                        <img src={getAvatarUrl(comment.user.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : comment.user.name.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{comment.user.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p style={{ fontSize: '0.875rem', paddingLeft: '1.75rem' }}>{comment.content}</p>
                        </div>
                    ))}

                    {user && (
                        <form onSubmit={handleComment} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <input
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                placeholder="Write a comment..."
                                style={{ marginBottom: 0 }}
                            />
                            <button className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Post</button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

export default PostCard;
