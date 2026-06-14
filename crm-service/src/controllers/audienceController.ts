import { Request, Response, NextFunction } from 'express';
import * as aiService from '../services/aiService';
import * as audienceService from '../services/audienceService';

export const generateAudience = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { description } = req.body;

    if (!description) {
      res.status(400).json({ success: false, message: 'Description is required.' });
      return;
    }

    const filters = await aiService.parseAudienceFilters(description);
    const preview = await audienceService.getAudiencePreview(filters);

    res.json({
      success: true,
      filters: preview.filters,
      customers: preview.customers,
      totalCount: preview.totalCount,
    });
  } catch (error) {
    next(error);
  }
};
