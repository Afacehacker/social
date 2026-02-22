const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../utils/auth');

const prisma = new PrismaClient();

// Get current user's notifications
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            include: {
                // We'll need to manually fetch sender details or add an explicit relation in schema
                // For now, let's assume we fetch basic sender info
            }
        });

        // Enhancing notifications with sender info
        const enhancedNotifications = await Promise.all(notifications.map(async (notif) => {
            const sender = await prisma.user.findUnique({
                where: { id: notif.senderId },
                select: { id: true, name: true, avatar: true }
            });
            return { ...notif, sender };
        }));

        res.json(enhancedNotifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: "Server error" });
    }
});

// Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await prisma.notification.update({
            where: { id: req.params.id, userId: req.userId },
            data: { read: true }
        });
        res.json(notification);
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
