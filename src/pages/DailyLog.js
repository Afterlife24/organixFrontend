import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClipboardList, ChevronLeft, ChevronRight, MapPin, Plus, Trash2,
  AlertCircle, Eye, Edit3, Trophy, AlertOctagon, FileText,
  Phone, Linkedin, MessageCircle, Star, GitBranch, Zap,
  Globe, Brain, Users, Cpu, X, Check, Edit2, ChevronDown, ChevronUp,
  TrendingUp
} from 'lucide-react';
import { dailyLogAPI, leadsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

// ─── helpers ──────────────────────────────────────────────────────────────────
const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const formatDisplay = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
const isToday = (dateStr) => toDateStr(new Date()) === dateStr;
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// ─── meta ─────────────────────────────────────────────────────────────────────
const CHANNEL_META = {
  'cold-call': { label: 'Cold Call', icon: Phone,         bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200'   },
  'linkedin':  { label: 'LinkedIn',  icon: Linkedin,      bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  'whatsapp':  { label: 'WhatsApp',  icon: MessageCircle, bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200'  },
  'event':     { label: 'Event',     icon: Star,          bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  'referral':  { label: 'Referral',  icon: GitBranch,     bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  'other':     { label: 'Other',     icon: Zap,           bg: 'bg-gray-50',   text: 'text-gray-500',   border: 'border-gray-200'   },
};
const OUTCOME_META = {
  'interested':     { label: 'Interested',     bg: 'bg-green-100',  text: 'text-green-700'  },
  'follow-up':      { label: 'Follow-up',      bg: 'bg-blue-100',   text: 'text-blue-700'   },
  'not-interested': { label: 'Not Interested', bg: 'bg-red-100',    text: 'text-red-600'    },
  'no-response':    { label: 'No Response',    bg: 'bg-gray-100',   text: 'text-gray-500'   },
};
const STAGE_META = {
  'lead':         { label: 'Lead',         bg: 'bg-gray-100',   text: 'text-gray-600',   bar: 'bg-gray-400',    border: 'border-gray-200'   },
  'conversation': { label: 'Conversation', bg: 'bg-blue-100',   text: 'text-blue-700',   bar: 'bg-blue-500',    border: 'border-blue-200'   },
  'meeting':      { label: 'Meeting',      bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-500',  border: 'border-yellow-200' },
  'proposal':     { label: 'Proposal',     bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500',  border: 'border-orange-200' },
  'client':       { label: 'Client',       bg: 'bg-green-100',  text: 'text-green-700',  bar: 'bg-green-500',   border: 'border-green-200'  },
  'lost':         { label: 'Lost',         bg: 'bg-red-100',    text: 'text-red-600',    bar: 'bg-red-400',     border: 'border-red-200'    },
};
const SERVICE_META = {
  'website':    { label: 'Website',    icon: Globe   },
  'ai-audit':   { label: 'AI Audit',   icon: Brain   },
  'linkedin':   { label: 'LinkedIn',   icon: Users   },
  'automation': { label: 'Automation', icon: Cpu     },
  'other':      { label: 'Other',      icon: Zap     },
};
const STAGES = ['lead', 'conversation', 'meeting', 'proposal', 'client', 'lost'];
const AVATAR_COLORS = [
  'from-blue-500 to-indigo-500', 'from-violet-500 to-purple-600',
  'from-orange-500 to-red-500',  'from-green-500 to-emerald-500',
  'from-pink-500 to-rose-500',   'from-cyan-500 to-blue-500',
];

// ─── small reusables ──────────────────────────────────────────────────────────
const Pill = ({ bg, text, label }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${bg} ${text}`}>{label}</span>
);
const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick}
    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${active ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
    {children}
  </button>
);
const Spinner = () => <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />;

// ─── outreach row ─────────────────────────────────────────────────────────────
const OutreachRow = ({ entry, onDelete }) => {
  const ch = CHANNEL_META[entry.channel] || CHANNEL_META.other;
  const out = OUTCOME_META[entry.outcome] || OUTCOME_META['no-response'];
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ch.bg} border ${ch.border}`}>
          <ch.icon size={14} className={ch.text} />
        </div>
        <div className="min-w-0">
          <div className="font-medium text-gray-800 text-sm truncate">{entry.name}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs font-medium ${ch.text}`}>{ch.label}</span>
            <Pill bg={out.bg} text={out.text} label={out.label} />
          </div>
          {entry.followUpNote && <div className="text-xs text-blue-600 mt-0.5">↪ {entry.followUpNote}</div>}
        </div>
      </div>
      <button onClick={() => onDelete(entry._id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  );
};

// ─── owner color — stable per admin based on their _id ───────────────────────
// Maps each unique ownerId to one of 6 colors consistently
const OWNER_COLORS = [
  { bar: 'bg-blue-500',   border: 'border-blue-300',   badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
  { bar: 'bg-violet-500', border: 'border-violet-300', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  { bar: 'bg-orange-500', border: 'border-orange-300', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { bar: 'bg-green-500',  border: 'border-green-300',  badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  { bar: 'bg-pink-500',   border: 'border-pink-300',   badge: 'bg-pink-100 text-pink-700',   dot: 'bg-pink-500'   },
  { bar: 'bg-cyan-500',   border: 'border-cyan-300',   badge: 'bg-cyan-100 text-cyan-700',   dot: 'bg-cyan-500'   },
];

const getOwnerColor = (ownerId) => {
  if (!ownerId) return OWNER_COLORS[0];
  const id = typeof ownerId === 'object' ? (ownerId._id || '') : ownerId;
  // sum the last 4 chars of the id for a stable index
  const sum = String(id).slice(-4).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return OWNER_COLORS[sum % OWNER_COLORS.length];
};

// ─── lead card (full CRM card) ────────────────────────────────────────────────
const LeadCard = ({ lead, onUpdate, onDelete, currentUserId }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ nextStep: lead.nextStep, notes: lead.notes });
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const sm = STAGE_META[lead.stage] || STAGE_META.lead;
  const src = CHANNEL_META[lead.source] || CHANNEL_META.other;
  const svc = SERVICE_META[lead.serviceInterest] || SERVICE_META.other;
  const isOwner = true; // any admin can edit any lead
  const ownerColor = getOwnerColor(lead.ownerId?._id || lead.ownerId);
  const ownerName = lead.ownerId?.name || 'Unknown';
  const isMine = lead.ownerId?._id === currentUserId || lead.ownerId === currentUserId;

  const handleExpand = async () => {
    setExpanded(e => !e);
    if (!historyLoaded) {
      try {
        const r = await leadsAPI.getHistory(lead._id);
        setHistory(r.data.activities || []);
        setHistoryLoaded(true);
      } catch { /* silently fail */ }
    }
  };

  const handleStageChange = async (newStage) => {
    try {
      const r = await leadsAPI.update(lead._id, { stage: newStage });
      onUpdate(r.data.lead);
      setHistoryLoaded(false); // refresh history on next expand
      toast.success(`Moved to ${STAGE_META[newStage].label}`);
    } catch { toast.error('Failed to update stage'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await leadsAPI.update(lead._id, editData);
      onUpdate(r.data.lead);
      setEditing(false);
      setHistoryLoaded(false); // refresh history
      toast.success('Updated');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden ${ownerColor.border}`}>
      <div className={`h-1.5 w-full ${ownerColor.bar}`} />
      <div className="px-4 pt-3 pb-4 space-y-3">

        {/* ── name + owner + meta ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm">{lead.name}</span>
              {lead.company && <span className="text-xs text-gray-400">{lead.company}</span>}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Pill bg={sm.bg} text={sm.text} label={sm.label} />
              <span className="text-xs text-gray-400 flex items-center gap-1"><src.icon size={10} />{src.label}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1"><svc.icon size={10} />{svc.label}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ownerColor.badge}`}>
                {isMine ? 'You' : ownerName}
              </span>
            </div>
          </div>
          {/* history toggle */}
          <button onClick={handleExpand}
            className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* ── next step (always visible) ── */}
        {lead.nextStep && !editing && (
          <div className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-1.5">↪ {lead.nextStep}</div>
        )}

        {/* ── notes (always visible) ── */}
        {lead.notes && !editing && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">{lead.notes}</p>
        )}

        {/* ── stage pills (always visible) ── */}
        <div>
          <p className="text-xs text-gray-400 mb-2 font-medium">Stage</p>
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

        {/* ── edit form (inline, shown when editing) ── */}
        {editing ? (
          <div className="space-y-2">
            <input type="text" placeholder="Next step / follow-up"
              value={editData.nextStep}
              onChange={e => setEditData(d => ({ ...d, nextStep: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            <textarea placeholder="Notes..." value={editData.notes} rows={2}
              onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors">
                {saving ? <Spinner /> : <Check size={12} />} Save
              </button>
              <button onClick={() => { setEditing(false); setEditData({ nextStep: lead.nextStep, notes: lead.notes }); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl transition-colors">
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ── edit + delete buttons (always visible) ── */
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-colors">
              <Edit2 size={12} /> Edit
            </button>
            <button onClick={() => onDelete(lead._id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 text-xs font-semibold rounded-xl hover:bg-red-100 transition-colors">
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}

        {/* ── added date + contact (always visible) ── */}
        <div className="flex gap-3 text-xs text-gray-400">
          <span>Added {fmtDate(lead.firstContactDate || lead.createdAt)}</span>
          {lead.contact && <span>📞 {lead.contact}</span>}
        </div>

        {/* ── history timeline (only when chevron expanded) ── */}
        {expanded && (
          <div className="pt-2 border-t border-gray-100">
            {history.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No update history yet</p>
            ) : (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Update History</p>
                <div className="space-y-2.5">
                  {history.map((h, i) => {
                    const adminColor = getOwnerColor(h.adminId?._id || h.adminId);
                    const isStageChange = h.stageAfter && h.stageAfter !== '';
                    const sm2 = isStageChange ? STAGE_META[h.stageAfter] : null;
                    return (
                      <div key={h._id || i} className="flex items-start gap-2.5">
                        <div className="flex flex-col items-center flex-shrink-0 mt-1">
                          <div className={`w-2 h-2 rounded-full ${adminColor.dot}`} />
                          {i < history.length - 1 && <div className="w-px bg-gray-100 mt-1 min-h-[16px]" />}
                        </div>
                        <div className="min-w-0 flex-1 pb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold ${adminColor.text || 'text-gray-600'}`}>
                              {h.adminId?.name || 'Admin'}
                            </span>
                            <span className="text-xs text-gray-400">{fmtDate(h.date || h.createdAt)}</span>
                            {isStageChange && sm2 && (
                              <Pill bg={sm2.bg} text={sm2.text} label={`→ ${sm2.label}`} />
                            )}
                          </div>
                          {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

// ─── add lead form (inline) ───────────────────────────────────────────────────
const AddLeadForm = ({ onAdded, onCancel }) => {
  const [form, setForm] = useState({
    name: '', company: '', contact: '',
    stage: 'lead', source: 'cold-call', serviceInterest: 'other', nextStep: ''
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
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3 mb-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-orange-700">New Lead</p>
        <button onClick={onCancel} className="p-1 text-orange-400 hover:text-orange-600"><X size={16} /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full border border-orange-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" required />
        <div className="grid grid-cols-2 gap-2">
          <input type="text" placeholder="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
            className="border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
          <input type="text" placeholder="Contact / Phone" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
            className="border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-2 font-medium">Source</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(CHANNEL_META).map(([key, m]) => (
              <button key={key} type="button" onClick={() => setForm(f => ({ ...f, source: key }))}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${form.source === key ? `${m.bg} ${m.text} ${m.border}` : 'bg-white text-gray-400 border-gray-200'}`}>
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
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${form.serviceInterest === key ? 'bg-gray-800 text-white border-transparent' : 'bg-white text-gray-400 border-gray-200'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <input type="text" placeholder="Next step / follow-up" value={form.nextStep} onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))}
          className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
        <button type="submit" disabled={saving || !form.name.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors">
          {saving ? <Spinner /> : <Plus size={15} />} Add Lead
        </button>
      </form>
    </div>
  );
};

// ─── editable outreach row (used in team view) ───────────────────────────────
const EditableOutreachRow = ({ entry, dateStr, adminId, onUpdated, onDeleted }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ channel: entry.channel, outcome: entry.outcome, followUpNote: entry.followUpNote || '' });
  const [saving, setSaving] = useState(false);

  const ch = CHANNEL_META[form.channel] || CHANNEL_META.other;
  const out = OUTCOME_META[form.outcome] || OUTCOME_META['no-response'];

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await dailyLogAPI.updateOutreach(dateStr, adminId, entry._id, form);
      onUpdated(res.data.log);
      setEditing(false);
      toast.success('Updated');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  if (editing) {
    return (
      <div className="py-3 border-b border-gray-100 last:border-0 space-y-2.5">
        <div>
          <p className="text-xs text-gray-400 mb-1.5 font-medium">Channel</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(CHANNEL_META).map(([key, m]) => (
              <button key={key} type="button" onClick={() => setForm(f => ({ ...f, channel: key }))}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${form.channel === key ? `${m.bg} ${m.text} ${m.border}` : 'bg-white text-gray-400 border-gray-200'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1.5 font-medium">Outcome</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(OUTCOME_META).map(([key, m]) => (
              <button key={key} type="button" onClick={() => setForm(f => ({ ...f, outcome: key }))}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${form.outcome === key ? `${m.bg} ${m.text} border-transparent` : 'bg-white text-gray-400 border-gray-200'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {form.outcome === 'follow-up' && (
          <input type="text" placeholder="Follow-up note..." value={form.followUpNote}
            onChange={e => setForm(f => ({ ...f, followUpNote: e.target.value }))}
            className="w-full border border-blue-200 bg-blue-50 rounded-xl px-3 py-2 text-sm focus:outline-none"
          />
        )}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? <Spinner /> : <Check size={12} />} Save
          </button>
          <button onClick={() => { setEditing(false); setForm({ channel: entry.channel, outcome: entry.outcome, followUpNote: entry.followUpNote || '' }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl transition-colors">
            <X size={12} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ch.bg} border ${ch.border}`}>
          <ch.icon size={14} className={ch.text} />
        </div>
        <div className="min-w-0">
          <div className="font-medium text-gray-800 text-sm truncate">{entry.name}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Pill bg={ch.bg} text={ch.text} label={ch.label} />
            <Pill bg={out.bg} text={out.text} label={out.label} />
          </div>
          {entry.followUpNote && <div className="text-xs text-blue-600 mt-0.5">↪ {entry.followUpNote}</div>}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        <button onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-blue-500 transition-colors rounded">
          <Edit2 size={13} />
        </button>
        <button onClick={() => onDeleted(entry._id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors rounded">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

// ─── team view card ───────────────────────────────────────────────────────────
const TeamCard = ({ entry, colorIndex, dateStr }) => {
  const { admin, log: initialLog } = entry;
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState(initialLog);
  const color = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const outCount = log?.outreach?.length || 0;
  const hasContent = outCount > 0 || log?.wins || log?.blockers || log?.notes;

  const handleOutreachDeleted = async (entryId) => {
    try {
      const r = await dailyLogAPI.deleteOutreachForAdmin(dateStr, admin._id, entryId);
      setLog(r.data.log);
      toast.success('Removed');
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-xs font-bold">{initials(admin.name)}</span>
          </div>
          <div className="text-left min-w-0">
            <div className="font-semibold text-gray-900 text-sm">{admin.name}</div>
            {log?.station && <div className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{log.station}</div>}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {outCount > 0 && <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">{outCount} outreach</span>}
            {!hasContent && <span className="text-xs text-gray-400 italic">No log</span>}
          </div>
        </div>
        <span className={`text-gray-400 inline-block transition-transform flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4 bg-gray-50/40">

          {/* outreach — full detail, editable */}
          {outCount > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Outreach ({outCount})
              </p>
              <div className="bg-white border border-gray-200 rounded-xl px-3">
                {log.outreach.map(o => (
                  <EditableOutreachRow
                    key={o._id}
                    entry={o}
                    dateStr={dateStr}
                    adminId={admin._id}
                    onUpdated={setLog}
                    onDeleted={handleOutreachDeleted}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No outreach logged</p>
          )}

          {/* wins & blockers */}
          {(log?.wins || log?.blockers) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {log.wins && (
                <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1"><Trophy size={12} className="text-green-600" /><span className="text-xs font-semibold text-green-700">Wins</span></div>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{log.wins}</p>
                </div>
              )}
              {log.blockers && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1"><AlertOctagon size={12} className="text-red-500" /><span className="text-xs font-semibold text-red-600">Blockers</span></div>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{log.blockers}</p>
                </div>
              )}
            </div>
          )}

          {log?.notes && (
            <p className="text-xs text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2.5 whitespace-pre-wrap">{log.notes}</p>
          )}

          {!hasContent && <p className="text-center text-xs text-gray-400 italic py-2">Nothing logged</p>}
        </div>
      )}
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────
const DailyLog = () => {
  const { user } = useAuth();
  const [dateStr, setDateStr] = useState(toDateStr(new Date()));
  const [log, setLog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // leads — persistent, not date-specific
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [leadStageFilter, setLeadStageFilter] = useState('all');

  const [viewMode, setViewMode] = useState('mine');
  const [teamLogs, setTeamLogs] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [tab, setTab] = useState('outreach');
  const [teamTab, setTeamTab] = useState('logs'); // 'logs' | 'leads'

  const [stationInput, setStationInput] = useState('');
  const [stationEditing, setStationEditing] = useState(false);

  const [outForm, setOutForm] = useState({ name: '', channel: 'cold-call', outcome: 'no-response', followUpNote: '' });
  const [addingOut, setAddingOut] = useState(false);

  const [wins, setWins] = useState('');
  const [blockers, setBlockers] = useState('');
  const [notes, setNotes] = useState('');
  const summaryTimer = useRef(null);

  // ── fetch log (date-specific) ──────────────────────────────────────────────
  const fetchLog = useCallback(async (date) => {
    setIsLoading(true);
    try {
      const r = await dailyLogAPI.getLog(date);
      setLog(r.data.log);
      setStationInput(r.data.log.station || '');
      setWins(r.data.log.wins || '');
      setBlockers(r.data.log.blockers || '');
      setNotes(r.data.log.notes || '');
    } catch { toast.error('Failed to load log'); }
    finally { setIsLoading(false); }
  }, []);

  // ── fetch leads (all admins, persistent) ──────────────────────────────────
  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const r = await leadsAPI.getAllAdmins();
      setLeads(r.data.leads || []);
    } catch { toast.error('Failed to load leads'); }
    finally { setLeadsLoading(false); }
  }, []);

  const fetchTeam = useCallback(async (date) => {
    setTeamLoading(true);
    try {
      const r = await dailyLogAPI.getTeamLogs(date);
      setTeamLogs(r.data.teamLogs || []);
    } catch { toast.error('Failed to load team logs'); }
    finally { setTeamLoading(false); }
  }, []);

  useEffect(() => { fetchLog(dateStr); }, [dateStr, fetchLog]);
  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { if (viewMode === 'team') fetchTeam(dateStr); }, [viewMode, dateStr, fetchTeam]);

  const changeDate = (delta) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    setDateStr(toDateStr(new Date(y, m - 1, d + delta)));
  };

  const saveStation = async (val) => {
    try { const r = await dailyLogAPI.updateStation(dateStr, val); setLog(r.data.log); }
    catch { toast.error('Failed to save station'); }
  };

  const handleSummaryChange = (field, val) => {
    if (field === 'wins') setWins(val);
    if (field === 'blockers') setBlockers(val);
    if (field === 'notes') setNotes(val);
    clearTimeout(summaryTimer.current);
    summaryTimer.current = setTimeout(async () => {
      try {
        const payload = {
          wins:     field === 'wins'     ? val : wins,
          blockers: field === 'blockers' ? val : blockers,
          notes:    field === 'notes'    ? val : notes,
        };
        const r = await dailyLogAPI.updateSummary(dateStr, payload);
        setLog(r.data.log);
      } catch { toast.error('Failed to save'); }
    }, 800);
  };

  const handleAddOutreach = async (e) => {
    e.preventDefault();
    if (!outForm.name.trim()) return;
    setAddingOut(true);
    try {
      const r = await dailyLogAPI.addOutreach(dateStr, outForm);
      setLog(r.data.log);
      setOutForm({ name: '', channel: 'cold-call', outcome: 'no-response', followUpNote: '' });
      toast.success('Added');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setAddingOut(false); }
  };

  const handleDeleteOutreach = async (id) => {
    try { const r = await dailyLogAPI.deleteOutreach(dateStr, id); setLog(r.data.log); toast.success('Removed'); }
    catch { toast.error('Failed to remove'); }
  };

  const handleLeadAdded = (lead) => {
    setLeads(prev => [lead, ...prev]);
    setShowAddLead(false);
  };

  const handleLeadUpdate = (updated) => {
    setLeads(prev => prev.map(l => l._id === updated._id ? updated : l));
  };

  const handleLeadDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await leadsAPI.remove(id);
      setLeads(prev => prev.filter(l => l._id !== id));
      toast.success('Lead deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const filteredLeads = leadStageFilter === 'all' ? leads : leads.filter(l => l.stage === leadStageFilter);

  // pipeline counts
  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.stage === s).length;
    return acc;
  }, {});

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

      {/* header */}
      <div className="flex items-center gap-3 mb-4 pt-1">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <ClipboardList size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daily Log</h1>
          <p className="text-xs text-gray-400">Sales & outreach activity</p>
        </div>
      </div>

      {/* date bar — only shown in My Log mode, hidden when on Leads tab */}
      {!(viewMode === 'mine' && tab === 'leads') && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-3 shadow-sm">
          <button onClick={() => changeDate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <div className="font-semibold text-gray-900 text-sm">{formatDisplay(dateStr)}</div>
            {isToday(dateStr) && <div className="text-xs text-blue-500 font-medium">Today</div>}
          </div>
          <button onClick={() => changeDate(1)} disabled={isToday(dateStr)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* station — only for outreach/summary */}
      {viewMode === 'mine' && tab !== 'leads' && (
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-2.5 mb-3">
          <MapPin size={14} className="text-violet-400 flex-shrink-0" />
          {stationEditing ? (
            <input autoFocus value={stationInput}
              onChange={e => setStationInput(e.target.value)}
              onBlur={() => { setStationEditing(false); saveStation(stationInput); }}
              onKeyDown={e => { if (e.key === 'Enter') { setStationEditing(false); saveStation(stationInput); } }}
              placeholder="Where are you today?"
              className="flex-1 text-sm text-gray-700 outline-none bg-transparent border-b border-violet-300"
            />
          ) : (
            <button onClick={() => setStationEditing(true)} className="flex-1 text-left text-sm text-gray-700 hover:text-violet-600 transition-colors">
              {stationInput || <span className="text-gray-400 italic text-xs">Set location...</span>}
            </button>
          )}
          {stationInput && !stationEditing && (
            <button onClick={() => setStationEditing(true)} className="text-xs text-gray-400 hover:text-violet-500">edit</button>
          )}
        </div>
      )}

      {/* my/team toggle */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-4">
        <TabBtn active={viewMode === 'mine'} onClick={() => setViewMode('mine')}>
          <Edit3 size={13} className="inline mr-1.5" />My Log
        </TabBtn>
        <TabBtn active={viewMode === 'team'} onClick={() => setViewMode('team')}>
          <Eye size={13} className="inline mr-1.5" />Team View
        </TabBtn>
      </div>

      {/* ══════════ MY LOG ══════════ */}
      {viewMode === 'mine' && (
        <>
          {/* section tabs */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-4">
            {[
              { key: 'outreach', label: 'Outreach' },
              { key: 'leads',    label: `Leads${leads.length ? ` (${leads.length})` : ''}` },
              { key: 'summary',  label: 'Summary'  },
            ].map(t => (
              <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</TabBtn>
            ))}
          </div>

          {isLoading && tab !== 'leads' ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="large" /></div>
          ) : (
            <>
              {/* ── OUTREACH TAB ── */}
              {tab === 'outreach' && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <form onSubmit={handleAddOutreach} className="p-4 border-b border-gray-100 space-y-3">
                    <input type="text" placeholder="Name / Company *" value={outForm.name}
                      onChange={e => setOutForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" required />
                    <div>
                      <p className="text-xs text-gray-400 mb-2 font-medium">Channel</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(CHANNEL_META).map(([key, m]) => (
                          <button key={key} type="button" onClick={() => setOutForm(f => ({ ...f, channel: key }))}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${outForm.channel === key ? `${m.bg} ${m.text} ${m.border}` : 'bg-white text-gray-400 border-gray-200'}`}>
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-2 font-medium">Outcome</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(OUTCOME_META).map(([key, m]) => (
                          <button key={key} type="button" onClick={() => setOutForm(f => ({ ...f, outcome: key }))}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${outForm.outcome === key ? `${m.bg} ${m.text} border-transparent` : 'bg-white text-gray-400 border-gray-200'}`}>
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {outForm.outcome === 'follow-up' && (
                      <input type="text" placeholder="Follow-up note..." value={outForm.followUpNote}
                        onChange={e => setOutForm(f => ({ ...f, followUpNote: e.target.value }))}
                        className="w-full border border-blue-200 bg-blue-50 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                    )}
                    <button type="submit" disabled={addingOut || !outForm.name.trim()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {addingOut ? <Spinner /> : <Plus size={15} />} Add Outreach
                    </button>
                  </form>
                  <div className="px-4">
                    {log?.outreach?.length > 0
                      ? log.outreach.map(o => <OutreachRow key={o._id} entry={o} onDelete={handleDeleteOutreach} />)
                      : <p className="text-center text-gray-400 text-xs py-6">No outreach logged yet for this date</p>
                    }
                  </div>
                </div>
              )}

              {/* ── LEADS TAB — full persistent CRM ── */}
              {tab === 'leads' && (
                <div>
                  {/* pipeline summary strip */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                    {STAGES.filter(s => s !== 'lost').map(s => {
                      const m = STAGE_META[s];
                      return (
                        <button key={s} onClick={() => setLeadStageFilter(leadStageFilter === s ? 'all' : s)}
                          className={`rounded-2xl py-2 text-center border transition-all ${leadStageFilter === s ? `${m.bg} ${m.border}` : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                          <div className={`text-base font-bold ${m.text}`}>{stageCounts[s] || 0}</div>
                          <div className="text-xs text-gray-400 leading-tight">{m.label}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* admin color legend */}
                  {leads.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[...new Map(leads.map(l => {
                        const id = l.ownerId?._id || l.ownerId;
                        return [String(id), { id, name: l.ownerId?.name || 'Unknown' }];
                      })).values()].map(owner => {
                        const oc = getOwnerColor(owner.id);
                        return (
                          <span key={String(owner.id)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${oc.badge}`}>
                            <span className={`w-2 h-2 rounded-full ${oc.dot}`}></span>
                            {owner.name}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* add button */}
                  {!showAddLead && (
                    <button onClick={() => setShowAddLead(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-orange-300 text-orange-500 text-sm font-semibold rounded-2xl hover:bg-orange-50 transition-colors mb-3">
                      <Plus size={16} /> Add New Lead
                    </button>
                  )}

                  {/* add form inline */}
                  {showAddLead && <AddLeadForm onAdded={handleLeadAdded} onCancel={() => setShowAddLead(false)} />}

                  {/* filter bar */}
                  {leads.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                      <button onClick={() => setLeadStageFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border flex-shrink-0 transition-all ${leadStageFilter === 'all' ? 'bg-gray-900 text-white border-transparent' : 'bg-white text-gray-500 border-gray-200'}`}>
                        All ({leads.length})
                      </button>
                      {STAGES.map(s => {
                        const m = STAGE_META[s];
                        const c = stageCounts[s] || 0;
                        if (c === 0) return null;
                        return (
                          <button key={s} onClick={() => setLeadStageFilter(leadStageFilter === s ? 'all' : s)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border flex-shrink-0 transition-all ${leadStageFilter === s ? `${m.bg} ${m.text} border-transparent` : 'bg-white text-gray-500 border-gray-200'}`}>
                            {m.label} ({c})
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* leads list */}
                  {leadsLoading ? (
                    <div className="flex justify-center py-12"><LoadingSpinner size="large" /></div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp size={36} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-gray-400 text-sm">{leads.length === 0 ? 'No leads yet — add your first one' : 'No leads in this stage'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredLeads.map(lead => (
                        <LeadCard key={lead._id} lead={lead} currentUserId={user._id} onUpdate={handleLeadUpdate} onDelete={handleLeadDelete} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── SUMMARY TAB ── */}
              {tab === 'summary' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy size={14} className="text-green-500" />
                      <label className="text-sm font-semibold text-gray-700">Wins today</label>
                    </div>
                    <textarea value={wins} onChange={e => handleSummaryChange('wins', e.target.value)}
                      placeholder="What went well? Any breakthroughs?" rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 resize-none" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertOctagon size={14} className="text-red-400" />
                      <label className="text-sm font-semibold text-gray-700">Blockers</label>
                    </div>
                    <textarea value={blockers} onChange={e => handleSummaryChange('blockers', e.target.value)}
                      placeholder="What slowed you down?" rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={14} className="text-gray-400" />
                      <label className="text-sm font-semibold text-gray-700">Other notes</label>
                    </div>
                    <textarea value={notes} onChange={e => handleSummaryChange('notes', e.target.value)}
                      placeholder="Anything else for the night meet..." rows={4}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none" />
                  </div>
                  <p className="text-xs text-gray-400 text-right">Auto-saves as you type</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══════════ TEAM VIEW ══════════ */}
      {viewMode === 'team' && (
        <>
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-4">
            <TabBtn active={teamTab === 'logs'} onClick={() => setTeamTab('logs')}>
              Outreach & Summary
            </TabBtn>
            <TabBtn active={teamTab === 'leads'} onClick={() => setTeamTab('leads')}>
              {`All Leads${leads.length ? ` (${leads.length})` : ''}`}
            </TabBtn>
          </div>

          {/* outreach + summary per admin */}
          {teamTab === 'logs' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 text-center mb-1">
                Team logs for <span className="font-semibold text-gray-600">{formatDisplay(dateStr)}</span>
              </p>
              {teamLoading
                ? <div className="flex justify-center py-16"><LoadingSpinner size="large" /></div>
                : teamLogs.map((entry, i) => <TeamCard key={entry.admin._id} entry={entry} colorIndex={i} dateStr={dateStr} />)
              }
            </div>
          )}

          {/* all leads across team */}
          {teamTab === 'leads' && (
            <div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                {STAGES.filter(s => s !== 'lost').map(s => {
                  const m = STAGE_META[s];
                  return (
                    <div key={s} className={`rounded-2xl py-2 text-center border ${m.bg} ${m.border}`}>
                      <div className={`text-base font-bold ${m.text}`}>{stageCounts[s] || 0}</div>
                      <div className="text-xs text-gray-400 leading-tight">{m.label}</div>
                    </div>
                  );
                })}
              </div>
              {/* admin color legend */}
              {leads.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {[...new Map(leads.map(l => {
                    const id = l.ownerId?._id || l.ownerId;
                    return [String(id), { id, name: l.ownerId?.name || 'Unknown' }];
                  })).values()].map(owner => {
                    const oc = getOwnerColor(owner.id);
                    return (
                      <span key={String(owner.id)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${oc.badge}`}>
                        <span className={`w-2 h-2 rounded-full ${oc.dot}`}></span>
                        {owner.name}
                      </span>
                    );
                  })}
                </div>
              )}
              {leadsLoading ? (
                <div className="flex justify-center py-12"><LoadingSpinner size="large" /></div>
              ) : leads.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp size={36} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm">No leads across the team yet</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {leads.map(lead => (
                    <LeadCard key={lead._id} lead={lead} currentUserId={user._id} onUpdate={handleLeadUpdate} onDelete={handleLeadDelete} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DailyLog;
