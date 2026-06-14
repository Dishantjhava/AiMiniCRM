import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './utils/db';
import { errorHandler } from './middlewares/errorHandler';

import customerRoutes from './routes/customerRoutes'
import orderRoutes from './routes/orderRoutes'
import audienceRoutes from './routes/audienceRoutes'
import campaignRoutes from './routes/campaignRoutes'
import analyticsRoutes from './routes/analyticsRoutes'
import receiptRoutes from './routes/receiptRoutes'

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Body parser middleware
app.use(express.json());

app.use('/api/customers', customerRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/audience', audienceRoutes)
app.use('/api/campaign', campaignRoutes)
app.use('/api/campaigns', campaignRoutes) 
app.use('/api/analytics', analyticsRoutes)
app.use('/api/receipts', receiptRoutes)

import { seedDatabase } from './utils/seedData'
app.get('/api/seed', async (req, res) => {
  try {
    const result = await seedDatabase()
    res.json({ success: true, ...result })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Global Error Handler Middleware
app.use(errorHandler);

// Start server after connecting to database
const startServer = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`[${new Date().toISOString()}] CRM Service is running on http://localhost:${port}`);
  });
};

startServer();
