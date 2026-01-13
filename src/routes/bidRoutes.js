import express from 'express';
import { placeBid, getBidsByGig, hireFreelancer, getMyBids } from '../controllers/bidController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, placeBid);
router.get('/my', protect, getMyBids);
router.get('/:gigId', protect, getBidsByGig);
router.patch('/:bidId/hire', protect, hireFreelancer);

export default router;
