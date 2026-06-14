import axios from 'axios';
import Campaign from '../models/Campaign';
import Customer from '../models/Customer';
import Communication from '../models/Communication';
import { buildMongoQuery } from './audienceService';

export const sendCampaign = async (campaignId: string) => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Build query and find target customers
  const query = await buildMongoQuery(campaign.audienceFilters);
  const customers = await Customer.find(query).exec();
  const audienceSize = customers.length;

  // Update campaign status to sending and store size
  campaign.status = 'sending';
  campaign.audienceSize = audienceSize;
  campaign.sentCount = 0;
  campaign.failedCount = 0;
  await campaign.save();

  const channelServiceUrl = process.env.CHANNEL_SERVICE_URL || 'http://localhost:6000';
  const communicationsToInsert = customers.map((customer) => {
    const personalizedMessage = (campaign.generatedMessage || '')
      .replace(/{{name}}/g, customer.name);

    return {
      campaignId: campaign._id,
      customerId: customer._id,
      channel: campaign.recommendedChannel || 'SMS',
      message: personalizedMessage,
      status: 'pending' as const,
    };
  });

  // Bulk insert communication logs
  const createdCommunications = await Communication.insertMany(communicationsToInsert);

  // Trigger async sending to channel service
  // Note: We run this in the background, or sequentially but asynchronously, so we don't block.
  // Wait, let's process them and call the channel-service.
  let sentSuccessCount = 0;
  let sentFailedCount = 0;

  const sendPromises = createdCommunications.map(async (communication, index) => {
    const customer = customers[index];
    const personalizedMessage = communication.message;
    try {
      console.log(`[CAMPAIGN SEND] Dispatching comm ${communication._id} to channel service`)
      await axios.post(`${process.env.CHANNEL_SERVICE_URL || channelServiceUrl}/send`, {
        campaignId: campaign._id.toString(),
        communicationId: communication._id.toString(),
        recipient: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        },
        channel: communication.channel,
        message: personalizedMessage
      })
      console.log(`[CAMPAIGN SEND] Successfully dispatched to channel service`)

      await Communication.findByIdAndUpdate(communication._id, {
        status: 'sent',
        sentAt: new Date(),
      });
      sentSuccessCount++;
    } catch (err: any) {
      console.error(`[CAMPAIGN SEND ERROR] Failed to dispatch ${communication._id}:`, err?.message || err)
      await Communication.findByIdAndUpdate(communication._id, { status: 'failed' });
      sentFailedCount++;
    }
  });

  // Execute all channel service sending requests in parallel
  await Promise.all(sendPromises);

  // Update campaign counts and mark status as sent
  campaign.sentCount = sentSuccessCount;
  campaign.failedCount = sentFailedCount;
  campaign.status = 'sent';
  await campaign.save();

  return {
    success: true,
    audienceSize,
    sentCount: sentSuccessCount,
    failedCount: sentFailedCount,
  };
};
