import { Schema, model, Document } from 'mongoose';

export interface ICampaign extends Document {
  name: string;
  goal?: string;
  audienceDescription?: string;
  audienceFilters: Record<string, any>;
  generatedMessage?: string;
  recommendedChannel?: 'WhatsApp' | 'SMS' | 'Email' | 'RCS';
  status: 'draft' | 'sending' | 'sent';
  audienceSize: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  readCount: number;
  clickedCount: number;
  convertedCount: number;
  failedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true },
    goal: { type: String },
    audienceDescription: { type: String },
    audienceFilters: { type: Schema.Types.Mixed, default: {} },
    generatedMessage: { type: String },
    recommendedChannel: {
      type: String,
      enum: ['WhatsApp', 'SMS', 'Email', 'RCS'],
    },
    status: {
      type: String,
      enum: ['draft', 'sending', 'sent'],
      default: 'draft',
    },
    audienceSize: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    openedCount: { type: Number, default: 0 },
    readCount: { type: Number, default: 0 },
    clickedCount: { type: Number, default: 0 },
    convertedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default model<ICampaign>('Campaign', CampaignSchema);
