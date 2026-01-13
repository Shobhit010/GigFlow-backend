import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Bid from '../models/Bid.js';
import Gig from '../models/Gig.js';

// @desc    Place a bid
// @route   POST /api/bids
// @access  Private
const placeBid = asyncHandler(async (req, res) => {
    const { gigId, amount, message } = req.body;

    const gig = await Gig.findById(gigId);

    if (!gig) {
        res.status(404);
        throw new Error('Gig not found');
    }

    if (gig.user.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error('You cannot bid on your own gig');
    }

    if (gig.status !== 'open') {
        res.status(400);
        throw new Error('Gig is no longer open');
    }

    const bidExists = await Bid.findOne({ gig: gigId, freelancer: req.user._id });

    if (bidExists) {
        res.status(400);
        throw new Error('You have already placed a bid on this gig');
    }

    const bid = await Bid.create({
        gig: gigId,
        freelancer: req.user._id,
        amount,
        message,
    });

    res.status(201).json(bid);
});

// @desc    Get bids for a gig (Owner only)
// @route   GET /api/bids/:gigId
// @access  Private
const getBidsByGig = asyncHandler(async (req, res) => {
    const gig = await Gig.findById(req.params.gigId);

    if (!gig) {
        res.status(404);
        throw new Error('Gig not found');
    }

    // Check if user is owner
    if (gig.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to view bids for this gig');
    }

    const bids = await Bid.find({ gig: req.params.gigId }).populate('freelancer', 'name email');
    res.json(bids);
});

// @desc    Hire a freelancer (Atomic)
// @route   PATCH /api/bids/:ageId/hire
// @access  Private
const hireFreelancer = asyncHandler(async (req, res) => {
    const { bidId } = req.params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const bid = await Bid.findById(bidId).session(session);
        if (!bid) {
            throw new Error('Bid not found');
        }

        const gig = await Gig.findById(bid.gig).session(session);
        if (!gig) {
            throw new Error('Gig not found');
        }

        if (gig.user.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to hire for this gig');
        }

        if (gig.status !== 'open') {
            res.status(400);
            throw new Error('Gig is already assigned or closed');
        }

        // 1. Update Gig Status
        gig.status = 'assigned';
        await gig.save({ session });

        // 2. Update Selected Bid Status
        bid.status = 'hired';
        await bid.save({ session });

        // 3. Reject all other bids for this gig
        await Bid.updateMany(
            { gig: gig._id, _id: { $ne: bid._id } },
            { status: 'rejected' },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        // 4. Emit Real-time Notification
        const io = req.app.get('io');
        const userSocketMap = req.app.get('userSocketMap');
        const freelancerId = bid.freelancer.toString();

        if (io && userSocketMap) {
            const socketId = userSocketMap[freelancerId];
            if (socketId) {
                io.to(socketId).emit('notification', {
                    message: `Congratulations! You have been hired for "${gig.title}"!`,
                    type: 'success',
                    gigId: gig._id
                });
                console.log(`Notification sent to freelancer ${freelancerId} at socket ${socketId}`);
            } else {
                console.log(`Freelancer ${freelancerId} is not online.`);
            }
        }

        res.json({ message: 'Freelancer hired successfully', bid });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500); // Or keep original status code if set
        throw new Error(error.message || 'Hiring failed');
    }
});

// @desc    Get bids placed by logged in user
// @route   GET /api/bids/my
// @access  Private
const getMyBids = asyncHandler(async (req, res) => {
    const bids = await Bid.find({ freelancer: req.user._id })
        .populate('gig', 'title status user')
        .sort({ createdAt: -1 });
    res.json(bids);
});

export { placeBid, getBidsByGig, hireFreelancer, getMyBids };
