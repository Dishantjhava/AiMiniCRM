import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [Error Handler] Error occurred on ${req.method} ${req.url}:`, error);

  res.status(500).json({
    success: false,
    message: error.message || 'An unexpected server error occurred.',
  });
};
