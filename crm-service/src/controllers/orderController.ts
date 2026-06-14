import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Customer from '../models/Customer';

export const getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      Order.find()
        .populate('customerId', 'name email')
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Order.countDocuments().exec(),
    ]);

    res.json({
      success: true,
      orders,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { customerId, amount, category, orderDate } = req.body;

    if (!customerId || amount === undefined || !category) {
      res.status(400).json({ success: false, message: 'CustomerId, amount, and category are required.' });
      return;
    }

    const customer = await Customer.findById(customerId).exec();
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    const parsedOrderDate = orderDate ? new Date(orderDate) : new Date();

    const order = new Order({
      customerId,
      amount: Number(amount),
      category,
      orderDate: parsedOrderDate,
      status: 'completed',
    });

    const savedOrder = await order.save();

    // Update customer's lifetime value and last purchase date
    customer.lifetimeValue += Number(amount);
    if (!customer.lastPurchaseDate || parsedOrderDate > customer.lastPurchaseDate) {
      customer.lastPurchaseDate = parsedOrderDate;
    }
    await customer.save();

    res.status(201).json({ success: true, order: savedOrder });
  } catch (error) {
    next(error);
  }
};
