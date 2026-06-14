import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analyticsService';

export const getGeneralStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await analyticsService.getGeneralAnalytics();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getCampaignStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campaignId } = req.params;
    const campaignStats = await analyticsService.getCampaignAnalytics(campaignId);
    res.json({ success: true, data: campaignStats });
  } catch (error) {
    next(error);
  }
};
