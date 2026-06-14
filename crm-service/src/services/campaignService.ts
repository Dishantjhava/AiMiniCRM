import axios from 'axios';
import Campaign from '../models/Campaign';
import Customer from '../models/Customer';
import Communication from '../models/Communication';
import CommunicationEvent from '../models/CommunicationEvent';
import { buildMongoQuery } from './audienceService';

// ─── Inline Simulation Helpers ───────────────────────────────────────────────
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (percent: number) => Math.random() * 100 < percent;

/**
 * Runs a local delivery simulation when the channel service is unavailable.
 * Directly writes events + increments campaign counters in MongoDB.
 */
async function runInlineSimulation(
  communicationId: string,
  campaignId: string
): Promise<void> {
  try {
    const recordEvent = async (eventType: string) => {
      await CommunicationEvent.create({
        communicationId,
        campaignId,
        eventType,
        timestamp: new Date(),
        metadata: {},
      });

      // Map event to campaign counter field
      const counterMap: Record<string, string> = {
        delivered: 'deliveredCount',
        failed: 'failedCount',
        opened: 'openedCount',
        read: 'readCount',
        clicked: 'clickedCount',
        converted: 'convertedCount',
      };
      const field = counterMap[eventType];
      if (field) {
        await Campaign.findByIdAndUpdate(campaignId, { $inc: { [field]: 1 } });
      }
      await Communication.findByIdAndUpdate(communicationId, { status: eventType });
      console.log(`[INLINE SIM] ${eventType} — comm ${communicationId}`);
    };

    // Step 1: Delivered (90%) or Failed (10%)
    await delay(randomBetween(500, 2000));
    const isDelivered = chance(90);
    if (!isDelivered) {
      await recordEvent('failed');
      return;
    }
    await recordEvent('delivered');

    // Step 2: Opened (70%)
    await delay(randomBetween(1000, 4000));
    if (!chance(70)) return;
    await recordEvent('opened');

    // Step 3: Read (50%)
    await delay(randomBetween(1000, 3000));
    if (!chance(50)) return;
    await recordEvent('read');

    // Step 4: Clicked (35%)
    await delay(randomBetween(2000, 5000));
    if (!chance(35)) return;
    await recordEvent('clicked');

    // Step 5: Converted (25%)
    await delay(randomBetween(2000, 5000));
    if (!chance(25)) return;
    await recordEvent('converted');

  } catch (err: any) {
    console.error(`[INLINE SIM FATAL] Crashed for comm ${communicationId}:`, err?.message || err);
  }
}

// ─── Main sendCampaign ────────────────────────────────────────────────────────
export const sendCampaign = async (campaignId: string) => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Build audience
  const query = await buildMongoQuery(campaign.audienceFilters);
  const customers = await Customer.find(query).exec();
  const audienceSize = customers.length;

  // Reset campaign to sending state
  campaign.status = 'sending';
  campaign.audienceSize = audienceSize;
  campaign.sentCount = 0;
  campaign.failedCount = 0;
  campaign.deliveredCount = 0;
  campaign.openedCount = 0;
  campaign.readCount = 0;
  campaign.clickedCount = 0;
  campaign.convertedCount = 0;
  await campaign.save();

  const channelServiceUrl = process.env.CHANNEL_SERVICE_URL || 'http://localhost:6000';

  // Build communication records
  const communicationsToInsert = customers.map((customer) => ({
    campaignId: campaign._id,
    customerId: customer._id,
    channel: campaign.recommendedChannel || 'SMS',
    message: (campaign.generatedMessage || '').replace(/{{name}}/g, customer.name),
    status: 'pending' as const,
  }));

  // Bulk insert communication logs
  const createdCommunications = await Communication.insertMany(communicationsToInsert);

  let sentSuccessCount = 0;
  let sentFailedCount = 0;
  let useInlineFallback = false;

  // ── Probe channel service availability first ────────────────────────────
  try {
    await axios.get(`${channelServiceUrl}/health`, { timeout: 2000 });
    console.log(`[CAMPAIGN SEND] Channel service is reachable at ${channelServiceUrl}`);
  } catch {
    console.warn(`[CAMPAIGN SEND] Channel service unreachable at ${channelServiceUrl}. Switching to inline simulation.`);
    useInlineFallback = true;
  }

  // ── Send to channel service OR run inline simulation ────────────────────
  const sendPromises = createdCommunications.map(async (communication, index) => {
    const customer = customers[index];

    if (!useInlineFallback) {
      try {
        await axios.post(`${channelServiceUrl}/send`, {
          campaignId: campaign._id.toString(),
          communicationId: communication._id.toString(),
          recipient: {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
          },
          channel: communication.channel,
          message: communication.message,
        }, { timeout: 5000 });

        await Communication.findByIdAndUpdate(communication._id, {
          status: 'sent',
          sentAt: new Date(),
        });
        sentSuccessCount++;
        console.log(`[CAMPAIGN SEND] Dispatched comm ${communication._id} → channel service`);
      } catch (err: any) {
        console.error(`[CAMPAIGN SEND ERROR] Failed to dispatch ${communication._id}:`, err?.message || err);
        console.warn(`[CAMPAIGN SEND] Falling back to inline simulation for comm ${communication._id}`);
        // Single message fallback
        await Communication.findByIdAndUpdate(communication._id, { status: 'sent', sentAt: new Date() });
        sentSuccessCount++;
        setImmediate(() => runInlineSimulation(communication._id.toString(), campaign._id.toString()));
      }
    } else {
      // Inline mode: mark as sent, fire async simulation
      await Communication.findByIdAndUpdate(communication._id, { status: 'sent', sentAt: new Date() });
      sentSuccessCount++;
      setImmediate(() => runInlineSimulation(communication._id.toString(), campaign._id.toString()));
    }
  });

  await Promise.all(sendPromises);

  // Update campaign counts
  campaign.sentCount = sentSuccessCount;
  campaign.failedCount = sentFailedCount;
  campaign.status = 'sent';
  await campaign.save();

  console.log(`[CAMPAIGN SEND] Done. Sent=${sentSuccessCount} Failed=${sentFailedCount} Mode=${useInlineFallback ? 'INLINE' : 'CHANNEL_SERVICE'}`);

  return {
    success: true,
    audienceSize,
    sentCount: sentSuccessCount,
    failedCount: sentFailedCount,
  };
};
