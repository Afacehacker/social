const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../utils/auth');

const prisma = new PrismaClient();

// Get or start a conversation
router.post('/conversations', protect, async (req, res) => {
    const { participantId } = req.body;
    const userId = req.userId;

    if (userId === participantId) {
        return res.status(400).json({ message: "Cannot start chat with yourself" });
    }

    try {
        // Find existing conversation with these exact participants
        let conversation = await prisma.conversation.findFirst({
            where: {
                participantIds: {
                    hasEvery: [userId, participantId]
                }
            },
            include: {
                participants: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });

        // Ensure it only has these 2 participants (not a larger group chat if we add those later)
        // For now, simple check is enough since we only have 1:1
        if (conversation && conversation.participantIds.length !== 2) {
            conversation = null;
        }

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    participantIds: [userId, participantId],
                    participants: {
                        connect: [{ id: userId }, { id: participantId }]
                    }
                },
                include: {
                    participants: {
                        select: { id: true, name: true, avatar: true }
                    },
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
        }

        res.json(conversation);
    } catch (error) {
        console.error('Conversation error:', error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get user's conversations
router.get('/conversations', protect, async (req, res) => {
    try {
        const conversations = await prisma.conversation.findMany({
            where: {
                participantIds: {
                    has: req.userId
                }
            },
            include: {
                participants: {
                    select: { id: true, name: true, avatar: true }
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(conversations);
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get messages in a conversation
router.get('/messages/:conversationId', protect, async (req, res) => {
    try {
        const messages = await prisma.message.findMany({
            where: { conversationId: req.params.conversationId },
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: "Server error" });
    }
});

// Send a message
router.post('/messages', protect, async (req, res) => {
    const { conversationId, content } = req.body;
    try {
        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId: req.userId,
                content
            },
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });

        // Update conversation's updatedAt
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        res.json(message);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
