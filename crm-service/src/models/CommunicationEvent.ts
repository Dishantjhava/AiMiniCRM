import { Schema, model, Document, Types } from 'mongoose';

export interface ICommunicationEvent extends Document {
  communicationId: Types.ObjectId;
  campaignId: Types.ObjectId;
  eventType: 'sent' | 'delivered' | 'failed' | 'opened' | 'read' | 'clicked' | 'converted';
  timestamp: Date;
  metadata?: Record<string, any>;
}

const CommunicationEventSchema = new Schema<ICommunicationEvent>({
  communicationId: { type: Schema.Types.ObjectId, ref: 'Communication', required: true, index: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  eventType: {
    type: String,
    enum: ['sent', 'delivered', 'failed', 'opened', 'read', 'clicked', 'converted'],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed, default: {} },
});

export default model<ICommunicationEvent>('CommunicationEvent', CommunicationEventSchema);
