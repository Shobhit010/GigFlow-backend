import express from 'express';
import { getGigs, createGig, getGigById, getMyGigs } from '../controllers/gigController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getGigs)
    .post(protect, createGig);

router.route('/my').get(protect, getMyGigs);

router.route('/:id').get(getGigById);


export default router;
