import asyncHandler from 'express-async-handler';
import Gig from '../models/Gig.js';

// @desc    Fetch all gigs / Search
// @route   GET /api/gigs
// @access  Public (or Protected? Requirements say browse gigs)
const getGigs = asyncHandler(async (req, res) => {
    const keyword = req.query.keyword
        ? {
            title: {
                $regex: req.query.keyword,
                $options: 'i',
            },
        }
        : {};

    const gigs = await Gig.find({ ...keyword, status: 'open' })
        .populate('user', 'name email')
        .sort({ createdAt: -1 });

    res.json(gigs);
});

// @desc    Create a gig
// @route   POST /api/gigs
// @access  Private
const createGig = asyncHandler(async (req, res) => {
    const { title, description, budget } = req.body;

    if (!title || !description || !budget) {
        res.status(400);
        throw new Error('Please fill all fields');
    }

    const gig = new Gig({
        user: req.user._id,
        title,
        description,
        budget,
    });

    const createdGig = await gig.save();
    res.status(201).json(createdGig);
});

// @desc    Get gig by ID
// @route   GET /api/gigs/:id
// @access  Public
const getGigById = asyncHandler(async (req, res) => {
    const gig = await Gig.findById(req.params.id).populate('user', 'name email');

    if (gig) {
        res.json(gig);
    } else {
        res.status(404);
        throw new Error('Gig not found');
    }
});

// @desc    Get gigs by logged in user
// @route   GET /api/gigs/my
// @access  Private
const getMyGigs = asyncHandler(async (req, res) => {
    const gigs = await Gig.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(gigs);
});

export { getGigs, createGig, getGigById, getMyGigs };
