import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Heart, MessageSquare, UserPlus, CheckCircle } from 'lucide-react';
import { getImageUrl } from '../utils/images';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

const Notifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Fetch notifications error:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/ notifications / ${id}/read`);
            setNotifications(notifs => notifs.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) {
            addToast('Failed to mark as read', 'error');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'LIKE': return <Heart size={20} className="text-pink-500" fill="currentColor" />;
            case 'COMMENT': return <MessageSquare size={20} className="text-blue-500" fill="currentColor" />;
            case 'FOLLOW': return <UserPlus size={20} className="text-green-500" />;
            default: return <Bell size={20} />;
        }
    };

    const getMessage = (notif) => {
        switch (notif.type) {
            case 'LIKE': return `liked your post`;
            case 'COMMENT': return `commented on your post`;
            case 'FOLLOW': return `started following you`;
            default: return `sent you a notification`;
        }
    };

    if (loading) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="container" style={{ maxWidth: '800px', padding: '2rem' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Bell size={32} className="text-primary" />
                    Notifications
                </h1>

                {notifications.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No notifications yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {notifications.map(notif => (
                            <motion.div
                                key={notif.id}
                                className="glass-card"
                                whileHover={{ scale: 1.01 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    background: notif.read ? 'rgba(255,255,255,0.02)' : 'rgba(99, 102, 241, 0.05)',
                                    borderColor: notif.read ? 'var(--glass-border)' : 'var(--primary)',
                                    padding: '1.25rem'
                                }}
                            >
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    overflow: 'hidden',
                                    flexShrink: 0
                                }}>
                                    {notif.sender.avatar ? (
                                        <img src={getImageUrl(notif.sender.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : notif.sender.name.charAt(0).toUpperCase()}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0 }}>
                                        <Link to={`/profile/${notif.sender.id}`} style={{ fontWeight: 'bold', color: 'inherit', textDecoration: 'none' }}>
                                            {notif.sender.name}
                                        </Link>
                                        {' '}{getMessage(notif)}
                                    </p>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(notif.createdAt).toLocaleString()}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {getIcon(notif.type)}
                                    {!notif.read && (
                                        <button
                                            onClick={() => markAsRead(notif.id)}
                                            style={{ background: 'none', color: 'var(--primary)' }}
                                            title="Mark as read"
                                        >
                                            <CheckCircle size={20} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Notifications;
