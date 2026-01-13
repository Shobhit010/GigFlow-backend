import mongoose from 'mongoose';

const bidSchema = mongoose.Schema(
    {
        gig: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Gig',
            required: true,
        },
        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'hired', 'rejected'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

// Prent multiple bids from same user on same gig
bidSchema.index({ gig: 1, freelancer: 1 }, { unique: true });

const Bid = mongoose.model('Bid', bidSchema);

export default Bid;
