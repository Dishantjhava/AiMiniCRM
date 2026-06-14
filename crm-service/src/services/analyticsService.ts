import Customer from '../models/Customer';
import Order from '../models/Order';
import Campaign from '../models/Campaign';
import { generateInsights } from './aiService';

export const getGeneralAnalytics = async () => {
  const [totalCustomers, totalOrders, totalCampaigns] = await Promise.all([
    Customer.countDocuments().exec(),
    Order.countDocuments().exec(),
    Campaign.countDocuments().exec(),
  ]);

  const revenueAgg = await Order.aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;

  const recentCampaigns = await Campaign.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .exec();

  const allCampaigns = await Campaign.find().exec();
  const campaignPerformance = allCampaigns.map((c) => ({
    _id: c._id,
    name: c.name,
    sent: c.sentCount,
    delivered: c.deliveredCount,
    opened: c.openedCount,
    read: c.readCount,
    clicked: c.clickedCount,
    converted: c.convertedCount,
    failed: c.failedCount,
  }));

  // Aggregate funnel counts across all campaigns
  let totalSent = 0;
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalRead = 0;
  let totalClicked = 0;
  let totalConverted = 0;

  allCampaigns.forEach((c) => {
    totalSent += c.sentCount;
    totalDelivered += c.deliveredCount;
    totalOpened += c.openedCount;
    totalRead += c.readCount;
    totalClicked += c.clickedCount;
    totalConverted += c.convertedCount;
  });

  const funnelData = [
    { stage: 'Sent', count: totalSent },
    { stage: 'Delivered', count: totalDelivered },
    { stage: 'Opened', count: totalOpened },
    { stage: 'Read', count: totalRead },
    { stage: 'Clicked', count: totalClicked },
    { stage: 'Converted', count: totalConverted },
  ];

  return {
    totalCustomers,
    totalOrders,
    totalRevenue,
    totalCampaigns,
    recentCampaigns,
    campaignPerformance,
    funnelData,
  };
};

export const getCampaignAnalytics = async (campaignId: string) => {
  const campaign = await Campaign.findById(campaignId).exec();
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  const sent = campaign.sentCount;
  const delivered = campaign.deliveredCount;
  const failed = campaign.failedCount;
  const opened = campaign.openedCount;
  const read = campaign.readCount;
  const clicked = campaign.clickedCount;
  const converted = campaign.convertedCount;

  // Calculate rates
  const deliveryRate = sent > 0 ? parseFloat(((delivered / sent) * 100).toFixed(1)) : 0;
  const openRate = delivered > 0 ? parseFloat(((opened / delivered) * 100).toFixed(1)) : 0;
  const clickRate = opened > 0 ? parseFloat(((clicked / opened) * 100).toFixed(1)) : 0;
  const conversionRate = clicked > 0 ? parseFloat(((converted / clicked) * 100).toFixed(1)) : 0;

  const metrics = {
    sent,
    delivered,
    failed,
    opened,
    read,
    clicked,
    converted,
    deliveryRate,
    openRate,
    clickRate,
    conversionRate,
  };

  // Generate AI insights based on these metrics
  const aiInsights = await generateInsights(metrics);

  return {
    campaign,
    metrics,
    aiInsights,
  };
};
