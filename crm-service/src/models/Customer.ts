import { Schema, model, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone?: string;
  city?: 'Delhi' | 'Mumbai' | 'Bangalore' | 'Chandigarh' | 'Pune';
  gender?: 'Male' | 'Female';
  lastPurchaseDate?: Date;
  lifetimeValue: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String },
    city: {
      type: String,
      enum: ['Delhi', 'Mumbai', 'Bangalore', 'Chandigarh', 'Pune'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
    },
    lastPurchaseDate: { type: Date },
    lifetimeValue: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default model<ICustomer>('Customer', CustomerSchema);
