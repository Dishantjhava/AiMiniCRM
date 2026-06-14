import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/xeno-crm';
  
  try {
    mongoose.connection.on('connected', () => {
      console.log(`[${new Date().toISOString()}] MongoDB connected successfully to ${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error(`[${new Date().toISOString()}] MongoDB connection error:`, err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log(`[${new Date().toISOString()}] MongoDB disconnected`);
    });

    await mongoose.connect(uri);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error initializing MongoDB connection:`, error);
    process.exit(1);
  }
};
