import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, User, Search, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getImageUrl } from '../utils/images';

const Messages = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showChatMobile, setShowChatMobile] = useState(false);
    const messagesEndRef = useRef(null);
    const { addToast } = useToast();

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
            const interval = setInterval(() => fetchMessages(activeConversation.id), 3000);
            return () => clearInterval(interval);
        }
    }, [activeConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const res = await api.get('/chat/conversations');
            setConversations(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Fetch chats error:', err);
        }
    };

    const fetchMessages = async (convId) => {
        try {
            const res = await api.get(`/chat/messages/${convId}`);
            setMessages(res.data);
        } catch (err) {
            console.error('Fetch messages error:', err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        try {
            const res = await api.post('/chat/messages', {
                conversationId: activeConversation.id,
                content: newMessage
            });
            setMessages([...messages, res.data]);
            setNewMessage('');
            fetchConversations();
        } catch (err) {
            addToast('Failed to send message', 'error');
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            try {
                const res = await api.get(`/users/search/${query}`);
                setSearchResults(res.data);
            } catch (err) {
                console.error('Search error:', err);
            }
        } else {
            setSearchResults([]);
        }
    };

    const startNewChat = async (participant) => {
        try {
            const res = await api.post('/chat/conversations', { participantId: participant.id });
            setActiveConversation(res.data);
            setShowChatMobile(true);
            setSearchQuery('');
            setSearchResults([]);
            fetchConversations();
        } catch (err) {
            addToast('Failed to start chat', 'error');
        }
    };

    const getOtherParticipant = (conv) => {
        return conv.participants.find(p => p.id !== user?.id);
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="container" style={{ height: 'calc(100vh - 120px)', padding: '1rem', display: 'flex', gap: '1rem', position: 'relative', overflow: 'hidden' }}>

            {/* Conversations Sidebar / List */}
            <div className={`glass-card chat-sidebar ${showChatMobile ? 'mobile-hide' : ''}`} style={{
                width: '350px',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.25rem',
                transition: 'all 0.3s ease'
            }}>
                <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={handleSearch}
                            style={{ paddingLeft: '2.5rem', marginBottom: 0, borderRadius: '1rem' }}
                        />
                    </div>

                    <AnimatePresence>
                        {searchResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="glass-card"
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    zIndex: 10,
                                    marginTop: '0.5rem',
                                    padding: '0.5rem'
                                }}
                            >
                                {searchResults.map(result => (
                                    <div
                                        key={result.id}
                                        onClick={() => startNewChat(result)}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            borderRadius: '0.5rem'
                                        }}
                                        className="hover-bg"
                                    >
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', overflow: 'hidden' }}>
                                            {result.avatar ? <img src={getImageUrl(result.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : result.name.charAt(0)}
                                        </div>
                                        <span>{result.name}</span>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', paddingLeft: '0.5rem' }}>Conversations</h3>
                    {conversations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No chats yet.
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const otherUser = getOtherParticipant(conv);
                            const isActive = activeConversation?.id === conv.id;
                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => {
                                        setActiveConversation(conv);
                                        setShowChatMobile(true);
                                    }}
                                    className="hover-bg"
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        marginBottom: '0.75rem',
                                        background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                                        border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
                                        {otherUser.avatar ? <img src={getImageUrl(otherUser.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : otherUser.name.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{otherUser.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {conv.messages[0]?.content || 'Start a conversation'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`glass-card chat-main ${!showChatMobile ? 'mobile-hide' : ''}`} style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: 0,
                transition: 'all 0.3s ease'
            }}>
                {activeConversation ? (
                    <>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={() => setShowChatMobile(false)}
                                className="mobile-only"
                                style={{ background: 'none', color: 'var(--text-muted)', padding: '0.5rem' }}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
                                {getOtherParticipant(activeConversation).avatar ? (
                                    <img src={getImageUrl(getOtherParticipant(activeConversation).avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : getOtherParticipant(activeConversation).name.charAt(0)}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{getOtherParticipant(activeConversation).name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Online</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    style={{
                                        maxWidth: '80%',
                                        alignSelf: msg.senderId === user?.id ? 'flex-end' : 'flex-start',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.35rem'
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '0.85rem 1.15rem',
                                            borderRadius: '1.25rem',
                                            background: msg.senderId === user?.id ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                                            color: 'white',
                                            borderBottomRightRadius: msg.senderId === user?.id ? '0.25rem' : '1.25rem',
                                            borderBottomLeftRadius: msg.senderId === user?.id ? '1.25rem' : '0.25rem',
                                            boxShadow: msg.senderId === user?.id ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.4'
                                        }}
                                    >
                                        {msg.content}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: msg.senderId === user?.id ? 'flex-end' : 'flex-start', padding: '0 0.25rem' }}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} style={{ padding: '1.25rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.75rem', background: 'rgba(0,0,0,0.1)' }}>
                            <input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                style={{ marginBottom: 0, borderRadius: '1.5rem', background: 'rgba(255,255,255,0.04)', height: '48px' }}
                            />
                            <button className="btn-primary" style={{ height: '48px', width: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
                                <Send size={20} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}
                        >
                            <MessageSquare size={40} />
                        </motion.div>
                        <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Your Messages</h3>
                        <p>Select a conversation to start chatting and stay connected.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
