import { Schema, model, Document, Types } from 'mongoose';

export interface ICommunication extends Document {
  campaignId: Types.ObjectId;
  customerId: Types.ObjectId;
  channel?: string;
  message?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'opened' | 'read' | 'clicked' | 'converted';
  sentAt?: Date;
}

const CommunicationSchema = new Schema<ICommunication>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  channel: { type: String },
  message: { type: String },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'opened', 'read', 'clicked', 'converted'],
    default: 'pending',
  },
  sentAt: { type: Date },
});

export default model<ICommunication>('Communication', CommunicationSchema);
