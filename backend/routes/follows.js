const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../utils/auth');

const prisma = new PrismaClient();

// Follow or unfollow a user
router.post('/:userId', protect, async (req, res) => {
    const { userId: followingId } = req.params;
    const followerId = req.userId;

    if (followerId === followingId) {
        return res.status(400).json({ message: "You cannot follow yourself" });
    }

    try {
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId
                }
            }
        });

        if (existingFollow) {
            // Unfollow
            await prisma.follow.delete({
                where: {
                    id: existingFollow.id
                }
            });
            return res.json({ message: "Unfollowed successfully", followed: false });
        } else {
            // Follow
            await prisma.follow.create({
                data: {
                    followerId,
                    followingId
                }
            });

            // Create notification
            await prisma.notification.create({
                data: {
                    userId: followingId,
                    type: "FOLLOW",
                    senderId: followerId
                }
            });

            return res.json({ message: "Followed successfully", followed: true });
        }
    } catch (error) {
        console.error('Follow toggle error:', error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get followers of a user
router.get('/followers/:userId', async (req, res) => {
    try {
        const followers = await prisma.follow.findMany({
            where: { followingId: req.params.userId },
            include: {
                follower: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        bio: true
                    }
                }
            }
        });
        res.json(followers.map(f => f.follower));
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get following of a user
router.get('/following/:userId', async (req, res) => {
    try {
        const following = await prisma.follow.findMany({
            where: { followerId: req.params.userId },
            include: {
                following: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        bio: true
                    }
                }
            }
        });
        res.json(following.map(f => f.following));
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
