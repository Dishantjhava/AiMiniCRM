import { Request, Response, NextFunction } from 'express';
import Customer from '../models/Customer';

export const getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const [customers, totalCount] = await Promise.all([
      Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Customer.countDocuments(query).exec(),
    ]);

    res.json({
      success: true,
      customers,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, phone, city, gender } = req.body;

    if (!name || !email) {
      res.status(400).json({ success: false, message: 'Name and email are required fields.' });
      return;
    }

    // Check if customer email already exists
    const existing = await Customer.findOne({ email }).exec();
    if (existing) {
      res.status(409).json({ success: false, message: 'A customer with this email already exists.' });
      return;
    }

    const customer = new Customer({
      name,
      email,
      phone,
      city,
      gender,
      lifetimeValue: 0,
    });

    const savedCustomer = await customer.save();
    res.status(201).json({ success: true, customer: savedCustomer });
  } catch (error) {
    next(error);
  }
};
