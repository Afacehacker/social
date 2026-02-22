const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../utils/auth');
const multer = require('multer');
const path = require('path');

const prisma = new PrismaClient();

// Multer storage for media
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `post-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|mp4|mov|webm/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images and videos are allowed'));
    }
});

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            include: {
                author: { select: { id: true, name: true, avatar: true } },
                likes: true,
                comments: {
                    include: { user: { select: { id: true, name: true, avatar: true } } },
                },
                sharedPost: {
                    include: {
                        author: { select: { id: true, name: true, avatar: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(posts);
    } catch (error) {
        console.error('Fetch posts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create post with optional media
router.post('/', protect, upload.single('media'), async (req, res) => {
    const { content } = req.body;
    let mediaUrl = null;
    let mediaType = null;

    if (req.file) {
        mediaUrl = `/uploads/${req.file.filename}`;
        mediaType = req.file.mimetype.startsWith('video') ? 'VIDEO' : 'IMAGE';
    }

    try {
        const post = await prisma.post.create({
            data: {
                content,
                authorId: req.userId,
                mediaUrl,
                mediaType
            },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
            },
        });
        res.status(201).json(post);
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Share post
router.post('/:id/share', protect, async (req, res) => {
    const originalPostId = req.params.id;
    try {
        const post = await prisma.post.create({
            data: {
                content: "shared a post",
                authorId: req.userId,
                sharedPostId: originalPostId
            },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
                sharedPost: {
                    include: {
                        author: { select: { id: true, name: true, avatar: true } }
                    }
                }
            }
        });
        res.status(201).json(post);
    } catch (error) {
        console.error('Share post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Like/Unlike post
router.post('/:id/like', protect, async (req, res) => {
    const postId = req.params.id;
    const userId = req.userId;

    try {
        const existingLike = await prisma.like.findUnique({
            where: { userId_postId: { userId, postId } },
        });

        if (existingLike) {
            await prisma.like.delete({
                where: { id: existingLike.id },
            });
            res.json({ liked: false });
        } else {
            await prisma.like.create({
                data: { userId, postId },
            });

            // Trigger notification
            const post = await prisma.post.findUnique({ where: { id: postId } });
            if (post && post.authorId !== userId) {
                await prisma.notification.create({
                    data: {
                        userId: post.authorId,
                        type: "LIKE",
                        senderId: userId,
                        postId: postId
                    }
                });
            }

            res.json({ liked: true });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Comment on post
router.post('/:id/comment', protect, async (req, res) => {
    const postId = req.params.id;
    const userId = req.userId;
    const { content } = req.body;

    try {
        const comment = await prisma.comment.create({
            data: {
                content,
                userId,
                postId,
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                post: { select: { authorId: true } }
            },
        });

        // Trigger notification
        if (comment.post.authorId !== userId) {
            await prisma.notification.create({
                data: {
                    userId: comment.post.authorId,
                    type: "COMMENT",
                    senderId: userId,
                    postId: postId
                }
            });
        }

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete post
router.delete('/:id', protect, async (req, res) => {
    const postId = req.params.id;

    try {
        const post = await prisma.post.findUnique({ where: { id: postId } });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.authorId !== req.userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Manually delete related data (since MongoDB doesn't support cascade as needed)
        await prisma.like.deleteMany({ where: { postId } });
        await prisma.comment.deleteMany({ where: { postId } });
        await prisma.notification.deleteMany({ where: { postId } });

        // Handle shared posts (nullify the reference or delete them? Usually nullify or delete)
        // For shared posts, we'll just delete them too to avoid broken links
        await prisma.post.deleteMany({ where: { sharedPostId: postId } });

        await prisma.post.delete({ where: { id: postId } });
        res.json({ message: 'Post removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
