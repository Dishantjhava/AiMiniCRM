import { Request, Response, NextFunction } from 'express';
import Campaign from '../models/Campaign';
import * as aiService from '../services/aiService';
import * as audienceService from '../services/audienceService';
import * as campaignService from '../services/campaignService';

export const generateCampaignDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { goal, audienceDescription } = req.body;

    if (!goal || !audienceDescription) {
      res.status(400).json({ success: false, message: 'Goal and audienceDescription are required.' });
      return;
    }

    const [campaignDraft, audienceFilters] = await Promise.all([
      aiService.generateCampaign(goal, audienceDescription),
      aiService.parseAudienceFilters(audienceDescription),
    ]);

    const preview = await audienceService.getAudiencePreview(audienceFilters);

    res.json({
      success: true,
      name: campaignDraft.name,
      channel: campaignDraft.channel,
      message: campaignDraft.message,
      audienceFilters,
      audienceDescription,
      audienceSize: preview.totalCount,
    });
  } catch (error) {
    next(error);
  }
};

export const createCampaign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, goal, audienceDescription, audienceFilters, generatedMessage, recommendedChannel } = req.body;

    if (!name || !recommendedChannel || !generatedMessage) {
      res.status(400).json({ success: false, message: 'Name, recommendedChannel, and generatedMessage are required.' });
      return;
    }

    const preview = await audienceService.getAudiencePreview(audienceFilters || {});

    const campaign = new Campaign({
      name,
      goal,
      audienceDescription,
      audienceFilters: audienceFilters || {},
      generatedMessage,
      recommendedChannel,
      status: 'draft',
      audienceSize: preview.totalCount,
    });

    const savedCampaign = await campaign.save();
    res.status(201).json({ success: true, campaign: savedCampaign });
  } catch (error) {
    next(error);
  }
};

export const sendCampaignController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await campaignService.sendCampaign(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getCampaigns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).exec();
    res.json({ success: true, campaigns });
  } catch (error) {
    next(error);
  }
};

export const getCampaignById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id).exec();

    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }

    res.json({ success: true, campaign });
  } catch (error) {
    next(error);
  }
};
