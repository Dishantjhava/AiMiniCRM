import { Router } from 'express';
import {
  generateCampaignDraft,
  createCampaign,
  sendCampaignController,
  getCampaigns,
  getCampaignById,
} from '../controllers/campaignController';

const router = Router();

// This handles:
// - POST /api/campaign/generate (when mounted at /api/campaign)
// - POST /api/campaigns/generate (when mounted at /api/campaigns)
router.post('/generate', generateCampaignDraft);

// This handles:
// - POST /api/campaigns (when mounted at /api/campaigns)
// - GET /api/campaigns (when mounted at /api/campaigns)
router.post('/', createCampaign);
router.get('/', getCampaigns);

// This handles:
// - POST /api/campaigns/:id/send (when mounted at /api/campaigns)
// - GET /api/campaigns/:id (when mounted at /api/campaigns)
router.post('/:id/send', sendCampaignController);
router.get('/:id', getCampaignById);

export default router;
