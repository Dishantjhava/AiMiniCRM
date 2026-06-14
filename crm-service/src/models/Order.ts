import { Schema, model, Document, Types } from 'mongoose';

export interface IOrder extends Document {
  customerId: Types.ObjectId;
  amount: number;
  category: 'Shoes' | 'T-Shirts' | 'Jeans' | 'Accessories' | 'Beauty';
  orderDate: Date;
  status: 'completed' | 'pending' | 'returned';
}

const OrderSchema = new Schema<IOrder>({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  amount: { type: Number, required: true },
  category: {
    type: String,
    enum: ['Shoes', 'T-Shirts', 'Jeans', 'Accessories', 'Beauty'],
    required: true,
  },
  orderDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['completed', 'pending', 'returned'],
    default: 'completed',
  },
});

export default model<IOrder>('Order', OrderSchema);
