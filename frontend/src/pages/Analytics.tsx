import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Percent,
  CheckCircle,
  Eye,
  BookOpen,
  MousePointerClick,
  Sparkles,
  Flame,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CampaignMetrics {
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  read: number;
  clicked: number;
  converted: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

interface CampaignDetail {
  _id: string;
  name: string;
  goal?: string;
  audienceDescription?: string;
  recommendedChannel?: string;
  status: string;
  audienceSize: number;
  createdAt: string;
}

interface AIInsights {
  summary: string;
  insights: string[];
  recommendations: string[];
}

interface CampaignAnalyticsResponse {
  campaign: CampaignDetail;
  metrics: CampaignMetrics;
  aiInsights: AIInsights;
}

const Analytics: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [campaignsList, setCampaignsList] = useState<Array<{ _id: string; name: string; status: string }>>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch campaigns drop list and load initial campaign
  useEffect(() => {
    const loadInitialCampaign = async () => {
      try {
        setLoadingList(true);
        const res = await api.get('/campaigns');
        const campaigns = res.data.campaigns || res.data;
        setCampaignsList(campaigns);
        
        if (id) {
          setSelectedCampaignId(id);
        } else if (campaigns.length > 0) {
          // prefer sent campaigns, fallback to first
          const sent = campaigns.find((c: any) => c.status === 'sent');
          const target = sent || campaigns[0];
          setSelectedCampaignId(target._id);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to load campaigns list for analytics', err);
        setError(err.response?.data?.message || 'Failed to load campaigns list.');
        setLoading(false);
      } finally {
        setLoadingList(false);
      }
    };
    loadInitialCampaign();
  }, [id]);

  // Sync selectedCampaignId with route parameter changes
  useEffect(() => {
    if (id) {
      setSelectedCampaignId(id);
    }
  }, [id]);

  const fetchCampaignAnalytics = async () => {
    if (!selectedCampaignId) return;
    try {
      setError(null);
      const res = await api.get(`/analytics/${selectedCampaignId}`);
      if (res.data && res.data.success) {
        setAnalytics(res.data.data);
      } else {
        setError('Failed to fetch metrics for the selected campaign.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch specific campaign analytics and poll every 5 seconds
  useEffect(() => {
    if (!selectedCampaignId) return;

    fetchCampaignAnalytics(); // immediate fetch

    const interval = setInterval(() => {
      fetchCampaignAnalytics();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedCampaignId]);

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      setSelectedCampaignId(val);
      navigate(`/analytics/${val}`);
    }
  };

  if (loading && !analytics) {
    return <LoadingSpinner message="Retrieving telemetry records and querying AI strategist..." />;
  }

  // Conversion rates card
  const metricsData = analytics
    ? [
        { label: 'Delivery Rate', value: `${analytics.metrics.deliveryRate}%`, desc: 'Sent to Delivered' },
        { label: 'Open Rate', value: `${analytics.metrics.openRate}%`, desc: 'Delivered to Opened' },
        { label: 'Click Rate', value: `${analytics.metrics.clickRate}%`, desc: 'Opened to Clicked' },
        { label: 'Conversion Rate', value: `${analytics.metrics.conversionRate}%`, desc: 'Clicked to Converted' },
      ]
    : [];

  // Recharts Chart dataset mapping
  const chartData = analytics
    ? [
        { stage: 'Sent', count: analytics.metrics.sent, percent: 100 },
        {
          stage: 'Delivered',
          count: analytics.metrics.delivered,
          percent: analytics.metrics.sent > 0 ? Math.round((analytics.metrics.delivered / analytics.metrics.sent) * 100) : 0,
        },
        {
          stage: 'Opened',
          count: analytics.metrics.opened,
          percent: analytics.metrics.sent > 0 ? Math.round((analytics.metrics.opened / analytics.metrics.sent) * 100) : 0,
        },
        {
          stage: 'Read',
          count: analytics.metrics.read,
          percent: analytics.metrics.sent > 0 ? Math.round((analytics.metrics.read / analytics.metrics.sent) * 100) : 0,
        },
        {
          stage: 'Clicked',
          count: analytics.metrics.clicked,
          percent: analytics.metrics.sent > 0 ? Math.round((analytics.metrics.clicked / analytics.metrics.sent) * 100) : 0,
        },
        {
          stage: 'Converted',
          count: analytics.metrics.converted,
          percent: analytics.metrics.sent > 0 ? Math.round((analytics.metrics.converted / analytics.metrics.sent) * 100) : 0,
        },
      ]
    : [];

  // Funnel bar chart colors (shades of mint green)
  const BAR_COLORS = ['#3FB68B', '#359B76', '#2B8061', '#21654C', '#174A37', '#0E3022'];

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            <span>Campaign Metrics & Insights</span>
          </h2>
          <p className="text-textsecondary text-sm">
            AI-driven campaign funnel evaluations and recommendations.
          </p>
        </div>

        {/* Dropdown Selector */}
        {campaignsList.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-textsecondary font-semibold uppercase tracking-wider">Select Campaign:</span>
            <select
              value={selectedCampaignId || ''}
              onChange={handleDropdownChange}
              className="bg-cardbg border border-borderbg rounded-lg px-4 py-2 text-sm text-textprimary focus:outline-none focus:border-primary transition"
            >
              {campaignsList.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} ({item.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/25 text-danger rounded-xl flex items-center justify-between">
          <span className="font-semibold text-sm">{error}</span>
          <button
            onClick={fetchCampaignAnalytics}
            className="flex items-center space-x-1.5 px-3 py-1 bg-danger/15 rounded hover:bg-danger/25 transition text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main metrics display */}
      {analytics ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Campaign details summary header */}
          <div className="bg-cardbg border border-borderbg rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <h3 className="text-xl font-bold text-textprimary">{analytics.campaign.name}</h3>
            <p className="text-xs text-textsecondary mt-1">Goal: {analytics.campaign.goal || 'General engagement'}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-textsecondary">
              <span className="px-2.5 py-1 bg-borderbg rounded border border-borderbg text-textprimary">
                Channel: {analytics.campaign.recommendedChannel}
              </span>
              <span className="px-2.5 py-1 bg-borderbg rounded border border-borderbg text-textprimary">
                Target Audience Size: {analytics.campaign.audienceSize} customers
              </span>
              <span className="px-2.5 py-1 bg-borderbg rounded border border-borderbg text-textprimary">
                Dispatched Date: {new Date(analytics.campaign.createdAt).toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>

          {/* Stat Cards 1: Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <StatCard title="Sent" value={analytics.metrics.sent} icon={TrendingUp} />
            <StatCard title="Delivered" value={analytics.metrics.delivered} icon={CheckCircle} />
            <StatCard title="Opened" value={analytics.metrics.opened} icon={Eye} />
            <StatCard title="Read" value={analytics.metrics.read} icon={BookOpen} />
            <StatCard title="Clicked" value={analytics.metrics.clicked} icon={MousePointerClick} />
            <StatCard title="Converted" value={analytics.metrics.converted} icon={Percent} />
            <StatCard title="Failed" value={analytics.metrics.failed} icon={XCircle} />
          </div>

          {/* Rates conversion metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {metricsData.map((item, idx) => (
              <div key={idx} className="bg-cardbg border border-borderbg/50 rounded-xl p-5 text-center">
                <span className="text-xs text-textsecondary uppercase tracking-wider font-semibold block">{item.label}</span>
                <strong className="text-3xl text-success font-extrabold block mt-2">{item.value}</strong>
                <span className="text-[10px] text-textsecondary block mt-1">{item.desc}</span>
              </div>
            ))}
          </div>

          {/* Charts & AI Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Conversion chart */}
            <div className="lg:col-span-3 bg-cardbg border border-borderbg rounded-xl p-6">
              <h4 className="text-sm font-bold text-textsecondary uppercase tracking-wider mb-6">
                Cohort Funnel Performance
              </h4>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="stage" tick={{ fill: '#8B949E', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#8B949E', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(63, 182, 139, 0.05)' }}
                      contentStyle={{
                        backgroundColor: '#1C2128',
                        borderColor: '#30363D',
                        color: '#F0F6FC',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={26}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Generated Insights Cards */}
            <div className="lg:col-span-2 gradient-border-purple p-6 space-y-6">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <h4 className="text-md font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                  AI-Generated Insights
                </h4>
              </div>

              {/* Summary paragraph */}
              <div className="space-y-4">
                <p className="text-sm text-textprimary leading-relaxed bg-darkbg/40 p-3.5 border border-borderbg/40 rounded-lg">
                  {analytics.aiInsights.summary}
                </p>

                {/* Bullet insights */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-textsecondary uppercase tracking-wider block">Key Findings</span>
                  {analytics.aiInsights.insights.map((insight, i) => (
                    <div key={i} className="flex items-start space-x-2 text-xs">
                      <Flame className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                      <span className="text-textsecondary">{insight}</span>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-semibold text-textsecondary uppercase tracking-wider block">Action Items</span>
                  {analytics.aiInsights.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start space-x-2 text-xs">
                      <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-textprimary font-medium">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-cardbg border border-borderbg rounded-xl p-12 text-center text-xs text-textsecondary italic">
          {campaignsList.length === 0 ? "No campaigns yet" : "No metrics available. Please select or deploy a sent campaign first."}
        </div>
      )}
    </div>
  );
};

export default Analytics;
