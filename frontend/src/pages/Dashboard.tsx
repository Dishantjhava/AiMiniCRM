import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ShoppingBag,
  IndianRupee,
  Megaphone,
  Database,
  PlusCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface GeneralStats {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  totalCampaigns: number;
  recentCampaigns: Array<{
    _id: string;
    name: string;
    status: 'draft' | 'sending' | 'sent';
    audienceSize: number;
    sentCount: number;
    deliveredCount: number;
  }>;
  funnelData: Array<{
    stage: string;
    count: number;
  }>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<GeneralStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/analytics');
      if (response.data && response.data.success) {
        setStats(response.data.data);
      } else {
        setError('Failed to load dashboard metrics.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      const response = await api.get('/seed');
      if (response.data && response.data.success) {
        alert(`Database seeded successfully!\nCustomers: ${response.data.customers}\nOrders: ${response.data.orders}`);
        fetchStats();
      } else {
        alert('Failed to seed database.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Seeding failed: ' + (err.message || err));
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Assembling metrics pipeline..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-danger font-semibold">{error}</p>
        <button
          onClick={fetchStats}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Funnel bar chart colors (shades of mint green)
  const COLORS = ['#3FB68B', '#359B76', '#2B8061', '#21654C', '#174A37', '#0E3022'];

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Header Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-4xl font-normal tracking-tight text-white">Executive Dashboard</h1>
          <p className="text-textsecondary text-sm">
            Real-time analytics and shopper engagement funnels.
          </p>
        </div>

        {/* Quick action buttons row */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="flex items-center space-x-2 px-4 py-2 border border-border bg-surface hover:bg-border text-textPrimary rounded-lg transition text-sm font-semibold disabled:opacity-50"
          >
            <Database className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Seeding...' : 'Seed Sample Data'}</span>
          </button>
          
          <button
            onClick={() => navigate('/audience')}
            className="flex items-center space-x-2 px-4 py-2 border border-primary bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition text-sm font-semibold"
          >
            <Sparkles className="w-4 h-4" />
            <span>Build Audience</span>
          </button>

          <button
            onClick={() => navigate('/campaigns')}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-[#111418] hover:bg-primary/95 rounded-lg transition text-sm font-semibold shadow-lg shadow-primary/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={Users}
            description="Active retail subscribers"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={ShoppingBag}
            description="Successful transactions completed"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={IndianRupee}
            description="Gross fashion shopper spend"
          />
          <StatCard
            title="Active Campaigns"
            value={stats.totalCampaigns}
            icon={Megaphone}
            description="Drafts and outbox campaigns"
          />
        </div>
      )}

      {/* Main Charts & Tables section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Funnel chart container */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-textPrimary mb-1">Communication Funnel</h3>
            <p className="text-xs text-textSecondary mb-6">
              Aggregated conversion lifecycle stages across campaigns.
            </p>
          </div>

          <div className="h-64 w-full">
            {stats && stats.funnelData && stats.funnelData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.funnelData}
                  layout="vertical"
                  margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="stage"
                    type="category"
                    tick={{ fill: '#8B949E', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
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
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                    {stats.funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-textSecondary italic">
                No campaigns dispatched yet. Seeding data is recommended.
              </div>
            )}
          </div>
        </div>

        {/* Recent Campaigns lists */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-textPrimary mb-1">Recent Shopper Campaigns</h3>
          <p className="text-xs text-textSecondary mb-6">
            Summary of newly deployed segments and status.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-textSecondary text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Campaign Name</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Cohort Size</th>
                  <th className="pb-3 font-semibold text-right">Sent</th>
                  <th className="pb-3 font-semibold text-right">Delivered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {stats && stats.recentCampaigns && stats.recentCampaigns.length > 0 ? (
                  stats.recentCampaigns.map((camp) => (
                    <tr
                      key={camp._id}
                      onClick={() => navigate(`/analytics/${camp._id}`)}
                      className="hover:bg-border/20 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 font-semibold text-textPrimary">{camp.name}</td>
                      <td className="py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            camp.status === 'sent'
                              ? 'bg-success/15 text-success border-success/30'
                              : camp.status === 'sending'
                              ? 'bg-warning/15 text-warning border-warning/30'
                              : 'bg-border text-textSecondary border-border'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-medium text-textPrimary">
                        {camp.audienceSize}
                      </td>
                      <td className="py-3.5 text-right text-textSecondary font-semibold">
                        {camp.sentCount}
                      </td>
                      <td className="py-3.5 text-right text-textSecondary font-semibold">
                        {camp.deliveredCount}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-textSecondary italic">
                      No campaigns found. Use the buttons above to create your first draft!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
