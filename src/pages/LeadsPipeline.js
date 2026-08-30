import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Plus, Trash2, AlertCircle, ChevronDown, ChevronUp,
  Phone, Linkedin, MessageCircle, Star, GitBranch, Zap,
  Globe, Brain, Users, Cpu, X, Check, Edit2
} from 'lucide-react';
import { leadsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

// ─── meta ─────────────────────────────────────────────────────────────────────

const STAGE_META = {
  lead:         { label: 'Lead',         bg: 'bg-gray-100',    text: 'text-gray-600',   bar: 'bg-gray-400',   border: 'border-gray-200'   },
  conversation: { label: 'Conversation', bg: 'bg-blue-100',    text: 'text-blue-700',   bar: 'bg-blue-500',   border: 'border-blue-200'   },
  meeting:      { label: 'Meeting',      bg: 'bg-yellow-100',  text: 'text-yellow-700', bar: 'bg-yellow-500', border: 'border-yellow-200' },
  proposal:     { label: 'Proposal',     bg: 'bg-orange-100',  text: 'text-orange-700', bar: 'bg-orange-500', border: 'border-orange-200' },
  client:       { label: 'Client',       bg: 'bg-green-100',   text: 'text-green-700',  bar: 'bg-green-500',  border: 'border-green-200'  },
  lost:         { label: 'Lost',         bg: 'bg-red-100',     text: 'text-red-600',    bar: 'bg-red-400',    border: 'border-red-200'    },
};

const SOURCE_META = {
  'cold-call': { label: 'Cold Call', icon: Phone        },
  'linkedin':  { label: 'LinkedIn',  icon: Linkedin     },
  'whatsapp':  { label: 'WhatsApp',  icon: MessageCircle},
  'event':     { label: 'Event',     icon: Star         },
  'referral':  { label: 'Referral',  icon: GitBranch    },
  'other':     { label: 'Other',     icon: Zap          },
};

const SERVICE_META = {
  'website':    { label: 'Website',    icon: Globe  },
  'ai-audit':   { label: 'AI Audit',   icon: Brain  },
  'linkedin':   { label: 'LinkedIn',   icon: Users  },
  'automation': { label: 'Automation', icon: Cpu    },
  'other':      { label: 'Other',      icon: Zap    },
};

const STAGES = ['lead', 'conversation', 'meeting', 'proposal', 'client', 'lost'];

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// ─── lead card ────────────────────────────────────────────────────────────────

const LeadCard = ({ lead, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ nextStep: lead.nextStep, notes: lead.notes, stage: lead.stage });
  const [saving, setSaving] = useState(false);

  const sm = STAGE_META[lead.stage] || STAGE_META.lead;
  const src = SOURCE_META[lead.source] || SOURCE_META.other;
  const svc = SERVICE_META[lead.serviceInterest] || SERVICE_META.other;

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await leadsAPI.update(lead._id, editData);
      onUpdate(r.data.lead);
      setEditing(false);
      toast.success('Updated');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleStageChange = async (newStage) => {
    try {
      const r = await leadsAPI.update(lead._id, { stage: newStage });
      onUpdate(r.data.lead);
      toast.success(`Moved to ${STAGE_META[newStage].label}`);
    } catch { toast.error('Failed to update stage'); }
  };

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all ${sm.border}`}>
      {/* top color strip */}
      <div className={`h-1 w-full ${sm.bar}`} />

      <div className="px-4 pt-3 pb-3">
        {/* main row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm">{lead.name}</span>
              {lead.company && <span className="text-xs text-gray-400">{lead.company}</span>}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${sm.bg} ${sm.text}`}>{sm.label}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1"><src.icon size={11} />{src.label}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1"><svc.icon size={11} />{svc.label}</span>
            </div>
            {lead.nextStep && !editing && (
              <div className="mt-1.5 text-xs text-orange-600 bg-orange-50 rounded-lg px-2 py-1">
                ↪ {lead.nextStep}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setExpanded(e => !e)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>

        {/* expanded section */}
        {expanded && (
          <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">

            {/* stage changer */}
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">Move stage</p>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map(s => {
                  const m = STAGE_META[s];
                  return (
                    <button key={s} onClick={() => handleStageChange(s)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                        lead.stage === s ? `${m.bg} ${m.text} border-transparent` : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                      }`}>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* edit fields */}
            {editing ? (
              <div className="space-y-2">
                <input
                  type="text" placeholder="Next step / follow-up"
                  value={editData.nextStep}
                  onChange={e => setEditData(d => ({ ...d, nextStep: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                <textarea
                  placeholder="Notes..."
                  value={editData.notes}
                  onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors">
                    {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={12} />}
                    Save
                  </button>
                  <button onClick={() => { setEditing(false); setEditData({ nextStep: lead.nextStep, notes: lead.notes, stage: lead.stage }); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                    <X size={12} />Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                  <Edit2 size={12} />Edit
                </button>
                <button onClick={() => onDelete(lead._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 text-xs font-semibold rounded-xl hover:bg-red-100 transition-colors">
                  <Trash2 size={12} />Delete
                </button>
              </div>
            )}

            {/* metadata */}
            <div className="flex gap-3 text-xs text-gray-400">
              <span>Added {fmtDate(lead.firstContactDate || lead.createdAt)}</span>
              {lead.contact && <span>📞 {lead.contact}</span>}
            </div>
            {lead.notes && !editing && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">{lead.notes}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── add lead modal ───────────────────────────────────────────────────────────

const AddLeadModal = ({ onClose, onAdded }) => {
  const [form, setForm] = useState({
    name: '', company: '', contact: '',
    stage: 'lead', source: 'cold-call',
    serviceInterest: 'other', nextStep: '', notes: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const r = await leadsAPI.create(form);
      onAdded(r.data.lead);
      toast.success('Lead added');
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">New Lead</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <input type="text" placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" required />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
            <input type="text" placeholder="Contact / Phone" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2 font-medium">Source</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(SOURCE_META).map(([key, m]) => (
                <button key={key} type="button" onClick={() => setForm(f => ({ ...f, source: key }))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${form.source === key ? 'bg-gray-800 text-white border-transparent' : 'bg-white text-gray-400 border-gray-200'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2 font-medium">Service Interest</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(SERVICE_META).map(([key, m]) => (
                <button key={key} type="button" onClick={() => setForm(f => ({ ...f, serviceInterest: key }))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${form.serviceInterest === key ? 'bg-gray-800 text-white border-transparent' : 'bg-white text-gray-400 border-gray-200'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <input type="text" placeholder="Next step / follow-up" value={form.nextStep} onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
          <textarea placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none" />

          <button type="submit" disabled={saving || !form.name.trim()}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors">
            {saving ? 'Adding...' : 'Add Lead'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── main ─────────────────────────────────────────────────────────────────────

const LeadsPipeline = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({ lead: 0, conversation: 0, meeting: 0, proposal: 0, client: 0, lost: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leadsRes, countsRes] = await Promise.all([
        leadsAPI.getAll({ archived: showArchived }),
        leadsAPI.getPipelineCounts(),
      ]);
      setLeads(leadsRes.data.leads || []);
      setCounts(countsRes.data.counts || {});
    } catch { toast.error('Failed to load leads'); }
    finally { setIsLoading(false); }
  }, [showArchived]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleUpdate = (updated) => {
    setLeads(prev => prev.map(l => l._id === updated._id ? updated : l));
    // refresh counts
    leadsAPI.getPipelineCounts().then(r => setCounts(r.data.counts || {})).catch(() => {});
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead and all its activity history?')) return;
    try {
      await leadsAPI.remove(id);
      setLeads(prev => prev.filter(l => l._id !== id));
      leadsAPI.getPipelineCounts().then(r => setCounts(r.data.counts || {})).catch(() => {});
      toast.success('Lead deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleAdded = (lead) => {
    setLeads(prev => [lead, ...prev]);
    leadsAPI.getPipelineCounts().then(r => setCounts(r.data.counts || {})).catch(() => {});
  };

  const filtered = activeStage === 'all' ? leads : leads.filter(l => l.stage === activeStage);
  const totalActive = Object.entries(counts).filter(([k]) => k !== 'lost').reduce((a, b) => a + b[1], 0);

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-1">Access Denied</h2>
          <p className="text-gray-500 text-sm">Admins only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-4 pb-28">

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />}

      {/* ── header ── */}
      <div className="flex items-center justify-between mb-4 pt-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pipeline</h1>
            <p className="text-xs text-gray-400">{totalActive} active leads</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-sm">
          <Plus size={16} />New Lead
        </button>
      </div>

      {/* ── pipeline counts strip ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
        {STAGES.filter(s => s !== 'lost').map(s => {
          const m = STAGE_META[s];
          return (
            <button key={s} onClick={() => setActiveStage(activeStage === s ? 'all' : s)}
              className={`rounded-2xl py-2.5 text-center border transition-all ${
                activeStage === s ? `${m.bg} ${m.border}` : 'bg-white border-gray-100 hover:border-gray-200'
              }`}>
              <div className={`text-lg font-bold ${m.text}`}>{counts[s] || 0}</div>
              <div className="text-xs text-gray-400 leading-tight">{m.label}</div>
            </button>
          );
        })}
      </div>

      {/* ── filter bar ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          <button onClick={() => setActiveStage('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${activeStage === 'all' ? 'bg-gray-900 text-white border-transparent' : 'bg-white text-gray-500 border-gray-200'}`}>
            All ({leads.length})
          </button>
          {STAGES.map(s => {
            const m = STAGE_META[s];
            const c = counts[s] || 0;
            if (c === 0 && activeStage !== s) return null;
            return (
              <button key={s} onClick={() => setActiveStage(activeStage === s ? 'all' : s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                  activeStage === s ? `${m.bg} ${m.text} border-transparent` : 'bg-white text-gray-500 border-gray-200'
                }`}>
                {m.label} ({c})
              </button>
            );
          })}
        </div>
        <button onClick={() => setShowArchived(a => !a)}
          className="text-xs text-gray-400 hover:text-gray-600 ml-2 whitespace-nowrap flex-shrink-0">
          {showArchived ? 'Hide archived' : 'Archived'}
        </button>
      </div>

      {/* ── leads list ── */}
      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="large" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">No leads yet</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors">
            + Add First Lead
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(lead => (
            <LeadCard key={lead._id} lead={lead} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadsPipeline;
