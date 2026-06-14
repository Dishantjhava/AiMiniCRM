import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, UserCheck, HelpCircle } from 'lucide-react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

interface ICustomerPreview {
  _id: string;
  name: string;
  city?: string;
  lifetimeValue: number;
  lastPurchaseDate?: string;
}

interface IGeneratedAudienceResponse {
  filters: Record<string, any>;
  customers: ICustomerPreview[];
  totalCount: number;
}

const AudienceBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<IGeneratedAudienceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAudience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await api.post('/audience/generate', { description });
      if (response.data && response.data.success) {
        setResult({
          filters: response.data.filters,
          customers: response.data.customers,
          totalCount: response.data.totalCount,
        });
      } else {
        setError('Could not translate description into an audience cohort.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'AI engine failed to connect.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseAudience = () => {
    if (!result) return;
    // Redirect to campaigns drafting, sending description and filters in router state
    navigate('/campaigns', {
      state: {
        audienceDescription: description,
        audienceFilters: result.filters,
        audienceSize: result.totalCount,
      },
    });
  };

  const renderFilterTags = (filters: Record<string, any>) => {
    const tags: string[] = [];
    if (filters.minSpend !== undefined) tags.push(`Min Spend: ₹${filters.minSpend}`);
    if (filters.maxSpend !== undefined) tags.push(`Max Spend: ₹${filters.maxSpend}`);
    if (filters.inactiveDays !== undefined) tags.push(`Inactive: ${filters.inactiveDays} days`);
    if (filters.activeDays !== undefined) tags.push(`Active: last ${filters.activeDays} days`);
    if (filters.city) tags.push(`City: ${filters.city}`);
    if (filters.gender) tags.push(`Gender: ${filters.gender}`);
    if (filters.minOrders !== undefined) tags.push(`Min Orders: ${filters.minOrders}`);
    if (filters.category) tags.push(`Category: ${filters.category}`);

    if (tags.length === 0) {
      return <span className="text-xs text-textSecondary italic">No structured filters extracted. General audience.</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="text-xs font-semibold px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8 p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight flex items-center space-x-2">
          <Sparkles className="w-8 h-8 text-primary" />
          <span>AI Audience Builder</span>
        </h2>
        <p className="text-textSecondary text-sm">
          Define customer cohorts dynamically using natural language prompts.
        </p>
      </div>

      {/* Input Prompt Card */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-xl relative overflow-hidden">
        {/* Glow behind input */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-success/5 pointer-events-none"></div>

        <form onSubmit={handleGenerateAudience} className="space-y-4 relative z-10">
          <label className="text-sm font-semibold text-textPrimary block">
            Cohort Prompt Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your audience... e.g. 'Customers from Delhi who spent over ₹5000 and haven't shopped in 60 days'"
            className="w-full bg-background border border-border rounded-xl p-4 text-sm text-textPrimary placeholder-textSecondary focus:outline-none focus:border-primary transition"
          />

          <div className="flex justify-between items-center">
            <span className="text-xs text-textSecondary flex items-center space-x-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>AI will parse values, cities, spent categories, and active filters.</span>
            </span>
            <button
              type="submit"
              disabled={loading || !description.trim()}
              className="flex items-center space-x-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-[#111418] rounded-lg transition font-semibold text-sm disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'AI is analyzing...' : 'Generate Cohort'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="bg-surface border border-border rounded-xl p-10 flex justify-center items-center">
          <LoadingSpinner message="AI is parsing text prompts and resolving customer query logic..." />
        </div>
      )}

      {/* Errors */}
      {error && (
        <div className="p-4 bg-danger/10 text-danger border border-danger/25 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Generation Results */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Extracted filters tags card */}
            <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">
                  Extracted Filters
                </h4>
                {renderFilterTags(result.filters)}
              </div>
            </div>

            {/* Total Cohort Size Card */}
            <div className="bg-surface border border-border rounded-xl p-6 md:col-span-2 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">
                  Target Cohort Size
                </h4>
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-extrabold text-success tracking-tight">
                    {result.totalCount}
                  </span>
                  <span className="text-sm text-textSecondary font-medium">
                    customers match your prompt description
                  </span>
                </div>
              </div>

              {result.totalCount > 0 && (
                <div className="mt-4 pt-3 border-t border-border/50">
                  <button
                    onClick={handleUseAudience}
                    className="flex items-center justify-between w-full text-xs font-bold text-primary hover:text-white transition group"
                  >
                    <span>Use this cohort for campaign drafting</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Customers cohort previews subset */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <h4 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-4 flex items-center space-x-1">
              <UserCheck className="w-4 h-4 text-primary" />
              <span>Cohort Preview (First 10 Customers)</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-textSecondary text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Name</th>
                    <th className="pb-3 font-semibold">City</th>
                    <th className="pb-3 font-semibold text-right">LTV</th>
                    <th className="pb-3 font-semibold">Last Purchase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {result.customers.length > 0 ? (
                    result.customers.map((c) => (
                      <tr key={c._id}>
                        <td className="py-3 font-semibold text-textPrimary">{c.name}</td>
                        <td className="py-3 text-textSecondary">{c.city || '—'}</td>
                        <td className="py-3 text-right font-bold text-success">
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0,
                          }).format(c.lifetimeValue)}
                        </td>
                        <td className="py-3 text-textSecondary">{formatDate(c.lastPurchaseDate)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-textSecondary italic">
                        No customer previews available. Adjust cohort requirements.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudienceBuilder;
