import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Calendar, Users, Percent, ArrowRight } from 'lucide-react';

interface CampaignCardProps {
  campaign: {
    _id: string;
    name: string;
    recommendedChannel?: string;
    status: 'draft' | 'sending' | 'sent';
    audienceSize: number;
    sentCount: number;
    deliveredCount: number;
    openedCount: number;
    readCount: number;
    clickedCount: number;
    convertedCount: number;
    failedCount: number;
    createdAt: string;
  };
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => {
  const navigate = useNavigate();

  // Status styling map
  const statusStyles = {
    draft: 'bg-border text-textSecondary border-border',
    sending: 'bg-warning/10 text-warning border-warning/30 animate-pulse',
    sent: 'bg-success/10 text-success border-success/30',
  };

  const formattedDate = new Date(campaign.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Calculate delivery & conversion rates
  const sent = campaign.sentCount;
  const delivered = campaign.deliveredCount;
  const opened = campaign.openedCount;
  const clicked = campaign.clickedCount;
  const converted = campaign.convertedCount;

  const deliveryRate = sent > 0 ? ((delivered / sent) * 100).toFixed(0) : '0';
  const openRate = delivered > 0 ? ((opened / delivered) * 100).toFixed(0) : '0';
  const conversionRate = clicked > 0 ? ((converted / clicked) * 100).toFixed(0) : '0';

  const handleCardClick = () => {
    navigate(`/analytics/${campaign._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-surface border border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group flex flex-col justify-between"
    >
      <div>
        {/* Card Header */}
        <div className="flex justify-between items-start">
          <span className="text-xs text-textSecondary flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </span>
          <span
            className={`text-xs px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wider ${
              statusStyles[campaign.status]
            }`}
          >
            {campaign.status}
          </span>
        </div>

        {/* Campaign Title & Channel */}
        <h4 className="text-lg font-bold text-textPrimary mt-3 group-hover:text-primary transition-colors flex items-center justify-between">
          <span>{campaign.name}</span>
          <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
            {campaign.recommendedChannel || 'SMS'}
          </span>
        </h4>

        {/* Campaign Cohort Size */}
        <div className="mt-4 flex items-center space-x-2 text-sm text-textSecondary">
          <Users className="w-4 h-4 text-primary" />
          <span>Cohort: <strong className="text-textPrimary">{campaign.audienceSize}</strong> customers</span>
        </div>

        {/* Metrics Bar Grid (Only show if campaign was sent or is sending) */}
        {campaign.status !== 'draft' ? (
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-border">
            <div className="bg-background/50 rounded-lg p-2 text-center border border-border/50">
              <span className="text-[10px] text-textSecondary uppercase tracking-wider block">Delivered</span>
              <strong className="text-sm text-textPrimary">{campaign.deliveredCount}</strong>
              <span className="text-[10px] text-success block mt-0.5">{deliveryRate}% rate</span>
            </div>

            <div className="bg-background/50 rounded-lg p-2 text-center border border-border/50">
              <span className="text-[10px] text-textSecondary uppercase tracking-wider block">Opened</span>
              <strong className="text-sm text-textPrimary">{campaign.openedCount}</strong>
              <span className="text-[10px] text-warning block mt-0.5">{openRate}% rate</span>
            </div>

            <div className="bg-background/50 rounded-lg p-2 text-center border border-border/50">
              <span className="text-[10px] text-textSecondary uppercase tracking-wider block">Converted</span>
              <strong className="text-sm text-textPrimary">{campaign.convertedCount}</strong>
              <span className="text-[10px] text-primary block mt-0.5">{conversionRate}% rate</span>
            </div>
          </div>
        ) : (
          <div className="bg-background/50 rounded-lg p-4 text-center border border-border/50 mt-5 text-xs text-textSecondary italic">
            Draft Campaign. Ready to deliver messages.
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-border/35 flex items-center justify-between text-xs text-primary font-semibold group-hover:translate-x-1 transition-transform">
        <span>View Analytics</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
};

export default CampaignCard;
