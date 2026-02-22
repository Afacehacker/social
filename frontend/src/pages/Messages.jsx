import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, User, Search } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Messages = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const messagesEndRef = useRef(null);
    const { addToast } = useToast();

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000); // Poll for new messages every 10s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
            const interval = setInterval(() => fetchMessages(activeConversation.id), 3000); // Poll active chat every 3s
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
            fetchConversations(); // Update conversion list (last message/order)
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

    const getAvatarUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${api.defaults.baseURL.replace('/api', '')}${path}`;
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="container" style={{ height: 'calc(100vh - 120px)', padding: '1rem', display: 'flex', gap: '1rem' }}>
            {/* Conversations Sidebar */}
            <div className="glass-card" style={{ width: '350px', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
                <div style={{ marginBottom: '1rem', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search users to chat..."
                            value={searchQuery}
                            onChange={handleSearch}
                            style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
                        />
                    </div>

                    <AnimatePresence>
                        {searchResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    zIndex: 10,
                                    background: 'var(--bg-dark)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '0.5rem',
                                    marginTop: '0.5rem',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
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
                                            borderBottom: '1px solid var(--glass-border)'
                                        }}
                                        className="hover-bg"
                                    >
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', overflow: 'hidden' }}>
                                            {result.avatar ? <img src={getAvatarUrl(result.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : result.name.charAt(0)}
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
                            No chats yet. Search for a user to start chatting!
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const otherUser = getOtherParticipant(conv);
                            const isActive = activeConversation?.id === conv.id;
                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => setActiveConversation(conv)}
                                    className="hover-bg"
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '0.75rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginBottom: '0.5rem',
                                        background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                        border: isActive ? '1px solid var(--primary)' : '1px solid transparent'
                                    }}
                                >
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
                                        {otherUser.avatar ? <img src={getAvatarUrl(otherUser.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : otherUser.name.charAt(0)}
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
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                {activeConversation ? (
                    <>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
                                {getOtherParticipant(activeConversation).avatar ? (
                                    <img src={getAvatarUrl(getOtherParticipant(activeConversation).avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : getOtherParticipant(activeConversation).name.charAt(0)}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{getOtherParticipant(activeConversation).name}</h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Online</span>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    style={{
                                        maxWidth: '70%',
                                        alignSelf: msg.senderId === user?.id ? 'flex-end' : 'flex-start',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.25rem'
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '0.75rem 1rem',
                                            borderRadius: '1rem',
                                            background: msg.senderId === user?.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            borderBottomRightRadius: msg.senderId === user?.id ? '0.25rem' : '1rem',
                                            borderBottomLeftRadius: msg.senderId === user?.id ? '1rem' : '0.25rem'
                                        }}
                                    >
                                        {msg.content}
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', alignSelf: msg.senderId === user?.id ? 'flex-end' : 'flex-start' }}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem' }}>
                            <input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                style={{ marginBottom: 0 }}
                            />
                            <button className="btn-primary" style={{ height: '48px', width: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                <Send size={20} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <MessageSquare size={40} />
                        </div>
                        <h3>Select a conversation to start chatting</h3>
                        <p>Stay connected with your friends on SocialLink</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
