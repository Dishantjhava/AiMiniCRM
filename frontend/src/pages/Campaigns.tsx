import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Megaphone,
  Save,
  Send,
  MessageSquare,
  RefreshCw,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import CampaignCard from '../components/CampaignCard';

interface ICampaignDraft {
  name: string;
  channel: 'WhatsApp' | 'SMS' | 'Email' | 'RCS';
  message: string;
  audienceFilters: Record<string, any>;
  audienceDescription: string;
  audienceSize: number;
}

interface ICampaign {
  _id: string;
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
  createdAt: string;
}

const Campaigns: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Active Draft state (if any)
  const [goal, setGoal] = useState<string>('');
  const [audienceDesc, setAudienceDesc] = useState<string>('');
  const [loadingDraft, setLoadingDraft] = useState<boolean>(false);
  const [draft, setDraft] = useState<ICampaignDraft | null>(null);

  // Saved Draft state
  const [savedCampaign, setSavedCampaign] = useState<ICampaign | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Send & Live-Tracking state
  const [sending, setSending] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [trackingCampaignId, setTrackingCampaignId] = useState<string | null>(null);

  // Campaign List state
  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);

  // Check router state for autofills from AudienceBuilder
  useEffect(() => {
    if (location.state) {
      const state = location.state as {
        audienceDescription?: string;
        audienceFilters?: Record<string, any>;
        audienceSize?: number;
      };
      if (state.audienceDescription) {
        setAudienceDesc(state.audienceDescription);
        // Pre-fill a starter goal
        setGoal('Engage with this cohort using an exclusive collection discount');
      }
    }
  }, [location.state]);

  const fetchCampaigns = async () => {
    try {
      setLoadingList(true);
      setListError(null);
      const res = await api.get('/campaigns');
      if (res.data && res.data.success) {
        setCampaigns(res.data.campaigns);
      } else {
        setListError('Failed to fetch campaigns.');
      }
    } catch (err: any) {
      console.error(err);
      setListError(err.response?.data?.message || 'Server connection failed.');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Poll active campaign details after sending
  useEffect(() => {
    if (!trackingCampaignId) return;

    let secondsElapsed = 0;
    const interval = setInterval(async () => {
      secondsElapsed += 5;
      if (secondsElapsed > 60) {
        clearInterval(interval);
        setTrackingCampaignId(null);
        setLogs((prev) => [...prev, 'Live simulation window complete. Click view analytics.']);
        return;
      }

      try {
        const res = await api.get(`/campaigns/${trackingCampaignId}`);
        if (res.data && res.data.success) {
          const camp = res.data.campaign;
          
          // Update campaigns list to reflect newest counts
          setCampaigns((prevList) =>
            prevList.map((item) => (item._id === camp._id ? camp : item))
          );

          // Append live events log info
          setLogs((prev) => [
            ...prev,
            `[t+${secondsElapsed}s] Dispatched: ${camp.sentCount} | Delivered: ${camp.deliveredCount} | Opened: ${camp.openedCount} | Converted: ${camp.convertedCount}`,
          ]);
        }
      } catch (err) {
        console.error('Error polling campaign status:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [trackingCampaignId]);

  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || !audienceDesc.trim()) return;

    try {
      setLoadingDraft(true);
      setDraft(null);
      setSavedCampaign(null);
      setLogs([]);

      const response = await api.post('/campaign/generate', {
        goal,
        audienceDescription: audienceDesc,
      });

      if (response.data && response.data.success) {
        setDraft({
          name: response.data.name,
          channel: response.data.channel,
          message: response.data.message,
          audienceFilters: response.data.audienceFilters,
          audienceDescription: response.data.audienceDescription,
          audienceSize: response.data.audienceSize,
        });
      } else {
        alert('Could not draft campaign via AI.');
      }
    } catch (err: any) {
      console.error(err);
      alert('AI Generation error: ' + (err.message || err));
    } finally {
      setLoadingDraft(false);
    }
  };

  const handleSaveCampaign = async () => {
    if (!draft) return;

    try {
      setSaving(true);
      const response = await api.post('/campaigns', {
        name: draft.name,
        goal,
        audienceDescription: draft.audienceDescription,
        audienceFilters: draft.audienceFilters,
        generatedMessage: draft.message,
        recommendedChannel: draft.channel,
      });

      if (response.data && response.data.success) {
        setSavedCampaign(response.data.campaign);
        alert('Campaign draft saved to outbox!');
        fetchCampaigns();
      } else {
        alert('Failed to save campaign draft.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to save campaign: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!savedCampaign) return;

    try {
      setSending(true);
      setLogs([
        `Initiating transmission to ${savedCampaign.audienceSize} customers...`,
        `Draft message resolved: "${savedCampaign.generatedMessage?.substring(0, 40)}..."`,
      ]);

      const response = await api.post(`/campaigns/${savedCampaign._id}/send`);
      if (response.data && response.data.success) {
        setLogs((prev) => [
          ...prev,
          `Bulk queue processed. Dispatched: ${response.data.sentCount} message(s).`,
          `Live telemetry active (refreshing every 5s)...`,
        ]);
        
        // Debug requirement: wait 30 seconds then call GET /api/campaigns/:id and log the response
        const campaignId = savedCampaign._id;
        setTimeout(async () => {
          try {
            const debugRes = await api.get(`/campaigns/${campaignId}`);
            console.log("DEBUG campaign counters after 30s:", debugRes.data);
          } catch (err) {
            console.error("DEBUG campaign counters fetch failed:", err);
          }
        }, 30000);

        // Start live tracking interval
        setTrackingCampaignId(savedCampaign._id);
        setSavedCampaign(null); // Clear active panel
        setDraft(null); // Clear draft preview
        fetchCampaigns();
      }
    } catch (err: any) {
      console.error(err);
      setLogs((prev) => [...prev, 'Transmission failed: ' + (err.message || err)]);
    } finally {
      setSending(false);
    }
  };

  // Helper to colorize {{name}} placeholder inside message previews
  const renderMessagePreview = (message: string) => {
    const parts = message.split(/({{name}})/g);
    return (
      <p className="text-sm text-textprimary whitespace-pre-wrap leading-relaxed">
        {parts.map((part, i) =>
          part === '{{name}}' ? (
            <span key={i} className="px-1.5 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded font-semibold text-xs">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </p>
    );
  };

  return (
    <div className="space-y-10 p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight flex items-center space-x-2">
          <Megaphone className="w-8 h-8 text-primary" />
          <span>Campaigns Orchestration</span>
        </h2>
        <p className="text-textsecondary text-sm">
          Draft and deploy personalized AI-assisted shopper outreach segments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Section A: Generator & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-cardbg border border-borderbg rounded-xl p-6 shadow-xl relative overflow-hidden">
            <h3 className="text-lg font-bold text-textprimary mb-4 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>AI Campaign Generator</span>
            </h3>

            <form onSubmit={handleGenerateDraft} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-textsecondary font-semibold uppercase tracking-wider block">
                  Campaign Goal / Intent
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Offer 20% off on winter accessories for Delhi customers"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-darkbg border border-borderbg rounded-lg px-4 py-2.5 text-sm text-textprimary focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-textsecondary font-semibold uppercase tracking-wider block">
                  Audience Target Description
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe target customer traits or parameters..."
                  value={audienceDesc}
                  onChange={(e) => setAudienceDesc(e.target.value)}
                  className="w-full bg-darkbg border border-borderbg rounded-lg px-4 py-2.5 text-sm text-textprimary focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loadingDraft || !goal.trim() || !audienceDesc.trim()}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-lg transition font-semibold text-sm disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loadingDraft ? 'Crafting copy...' : 'Generate Campaign'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* AI CRAFTED DRAFT PANEL */}
          {loadingDraft && (
            <div className="bg-cardbg border border-borderbg rounded-xl p-10 flex justify-center items-center">
              <LoadingSpinner message="AI strategist is choosing templates and editing message..." />
            </div>
          )}

          {draft && (
            <div className="bg-cardbg border border-borderbg rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center pb-3 border-b border-borderbg">
                <h4 className="font-bold text-textprimary">AI Crafted Campaign Preview</h4>
                <span className="text-xs font-semibold px-2 py-0.5 bg-success/10 border border-success/25 text-success rounded-full">
                  Ready to review
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-textsecondary font-semibold uppercase tracking-wider block">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="w-full bg-darkbg border border-borderbg rounded-lg px-3 py-2 text-sm text-textprimary focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-textsecondary font-semibold uppercase tracking-wider block">
                    Outbound Channel
                  </label>
                  <select
                    value={draft.channel}
                    onChange={(e) => setDraft({ ...draft, channel: e.target.value as any })}
                    className="w-full bg-darkbg border border-borderbg rounded-lg px-3 py-2 text-sm text-textprimary focus:outline-none focus:border-primary"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="SMS">SMS</option>
                    <option value="Email">Email</option>
                    <option value="RCS">RCS</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-textsecondary font-semibold uppercase tracking-wider block">
                  Copywriter Message Template
                </label>
                <textarea
                  rows={3}
                  value={draft.message}
                  onChange={(e) => setDraft({ ...draft, message: e.target.value })}
                  className="w-full bg-darkbg border border-borderbg rounded-lg px-3 py-2 text-sm text-textprimary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="bg-darkbg/50 rounded-lg p-3 border border-borderbg/50 flex justify-between items-center text-xs text-textsecondary">
                <span>Matching cohort size: <strong>{draft.audienceSize}</strong> shoppers</span>
                <span className="font-semibold text-primary uppercase">Calculated Filters matched</span>
              </div>

              {!savedCampaign && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveCampaign}
                    disabled={saving}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Campaign'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DELIVER DRAWS */}
          {savedCampaign && (
            <div className="bg-cardbg border border-success/30 rounded-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center pb-2 border-b border-borderbg">
                <h4 className="font-bold text-success">Campaign Saved Successfully</h4>
                <Clock className="w-4 h-4 text-warning" />
              </div>
              
              <div className="bg-darkbg/50 p-4 rounded-lg border border-borderbg">
                <h5 className="font-semibold text-textprimary text-sm mb-1">{savedCampaign.name}</h5>
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider block mb-3">
                  Channel: {savedCampaign.recommendedChannel}
                </span>
                {renderMessagePreview(savedCampaign.generatedMessage || '')}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleSendCampaign}
                  disabled={sending}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-success hover:bg-success/90 text-white rounded-lg text-sm font-semibold transition"
                >
                  <Send className="w-4 h-4" />
                  <span>{sending ? 'Queueing outbound...' : 'Send Campaign'}</span>
                </button>
              </div>
            </div>
          )}

          {/* REALTIME TERMINAL EVENT LOGS */}
          {logs.length > 0 && (
            <div className="bg-[#0A0A14] border border-borderbg rounded-xl p-6 font-mono text-xs text-textsecondary space-y-2">
              <h5 className="text-textprimary font-semibold text-xs border-b border-borderbg pb-2 uppercase tracking-widest flex items-center justify-between">
                <span>Outbound Telemetry Log</span>
                {trackingCampaignId && <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />}
              </h5>
              <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                {logs.map((log, i) => (
                  <p key={i} className="text-success/90">
                    <span className="text-textsecondary">{`>`}</span> {log}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section B: Campaign Catalog */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-textprimary flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-primary" />
            <span>Campaigns Registry</span>
          </h3>

          {loadingList ? (
            <div className="py-10">
              <LoadingSpinner message="Searching campaign logs..." />
            </div>
          ) : listError ? (
            <p className="text-sm text-danger">{listError}</p>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {campaigns.length > 0 ? (
                campaigns.map((camp) => (
                  <CampaignCard key={camp._id} campaign={camp} />
                ))
              ) : (
                <div className="bg-cardbg border border-borderbg rounded-xl p-8 text-center text-xs text-textsecondary italic">
                  No active or draft campaigns registered yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
