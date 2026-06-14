import { Router } from 'express';
import { getGeneralStats, getCampaignStats } from '../controllers/analyticsController';

const router = Router();

router.get('/', getGeneralStats);
router.get('/:campaignId', getCampaignStats);

export default router;
