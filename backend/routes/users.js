const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../utils/auth');
const multer = require('multer');
const path = require('path');

const prisma = new PrismaClient();

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${req.userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed (jpeg, jpg, png, webp)'));
    }
});

// Get user profile
router.get('/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
                email: true,
                bio: true,
                avatar: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true
                    }
                },
                posts: {
                    include: {
                        author: { select: { id: true, name: true, avatar: true } },
                        likes: true,
                        comments: {
                            include: { user: { select: { id: true, name: true, avatar: true } } },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/profile', protect, upload.single('avatar'), async (req, res) => {
    const { name, bio } = req.body;
    let avatar = req.body.avatar;

    if (req.file) {
        avatar = `/uploads/${req.file.filename}`;
    }

    try {
        const user = await prisma.user.update({
            where: { id: req.userId },
            data: { name, bio, avatar },
            select: {
                id: true,
                name: true,
                email: true,
                bio: true,
                avatar: true,
            },
        });

        res.json(user);
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search users
router.get('/search/:query', async (req, res) => {
    const { query } = req.params;

    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                name: true,
                avatar: true,
            },
            take: 10,
        });

        res.json(users);
    } catch (error) {
        console.error('Search Users Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
