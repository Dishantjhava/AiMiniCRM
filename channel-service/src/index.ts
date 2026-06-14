import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sendRoutes from './routes/sendRoutes';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 6000;

// CORS configuration matching CRM specifications
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Bind simulator webhook route
app.use('/send', sendRoutes);

app.listen(port, () => {
  console.log(`[${new Date().toISOString()}] Channel Service simulator is running on http://localhost:${port}`);
});
