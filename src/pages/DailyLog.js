import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClipboardList, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Plus, Trash2, AlertCircle, MapPin, Users, Zap, FileText, Check, Eye, Edit3
} from 'lucide-react';
import { dailyLogAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

// ─── helpers ────────────────────────────────────────────────────────────────

const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDisplay = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });
};

const isToday = (dateStr) => toDateStr(new Date()) === dateStr;

const initials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const STATUS_META = {
  new:  { label: 'New',  bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  warm: { label: 'Warm', bg: 'bg-yellow-100',  text: 'text-yellow-700', dot: 'bg-yellow-500' },
  hot:  { label: 'Hot',  bg: 'bg-red-100',     text: 'text-red-700',    dot: 'bg-red-500'    },
};

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-500',
  'from-violet-500 to-purple-600',
  'from-orange-500 to-red-500',
  'from-green-500 to-emerald-500',
  'from-pink-500 to-rose-500',
  'from-cyan-500 to-blue-500',
];

// ─── tiny sub-components ─────────────────────────────────────────────────────

const StatusPill = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.new;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`}></span>
      {m.label}
    </span>
  );
};

const SectionHeader = ({ icon: Icon, color, title, count, isOpen, onToggle }) => (
  <button
    onClick={onToggle}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
      ${isOpen ? 'bg-white shadow-sm border border-gray-200' : 'bg-white/70 hover:bg-white border border-gray-100'}`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${color} shadow-sm`}>
        <Icon size={17} className="text-white" />
      </div>
      <span className="font-semibold text-gray-800 text-sm md:text-base">{title}</span>
      {count > 0 && (
        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
    {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
  </button>
);

// ─── Team View: read-only card per admin ─────────────────────────────────────

const AdminLogCard = ({ entry, colorIndex }) => {
  const { admin, log } = entry;
  const [open, setOpen] = useState(false);
  const color = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const hasContent = log && (
    log.peopleMet?.length > 0 || log.leads?.length > 0 || log.notes?.trim()
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Admin header row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm flex-shrink-0`}>
            <span className="text-white text-xs font-bold">{initials(admin.name)}</span>
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900 text-sm">{admin.name}</div>
            <div className="text-xs text-gray-400">{admin.email}</div>
          </div>
          {hasContent && (
            <div className="flex gap-1.5 ml-2 flex-wrap">
              {log.peopleMet?.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {log.peopleMet.length} met
                </span>
              )}
              {log.leads?.length > 0 && (
                <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {log.leads.length} leads
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!hasContent && <span className="text-xs text-gray-400 italic">No log yet</span>}
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Expanded content */}
      {open && hasContent && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4 bg-gray-50/50">

          {/* Station */}
          {log.station && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={14} className="text-violet-400 flex-shrink-0" />
              <span className="font-medium">{log.station}</span>
            </div>
          )}

          {/* People Met */}
          {log.peopleMet?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users size={13} className="text-blue-500" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">People Met</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-500">
                      <th className="text-left px-3 py-2 font-semibold">Name</th>
                      <th className="text-left px-3 py-2 font-semibold hidden sm:table-cell">Role</th>
                      <th className="text-left px-3 py-2 font-semibold">Follow-up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {log.peopleMet.map(p => (
                      <tr key={p._id}>
                        <td className="px-3 py-2 font-medium text-gray-800">{p.name}</td>
                        <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">{p.role || '—'}</td>
                        <td className="px-3 py-2 text-gray-600">
                          {p.hasFollowUp
                            ? <span className="flex items-center gap-1"><Check size={11} className="text-blue-400" />{p.followUpNote || 'Yes'}</span>
                            : <span className="text-gray-300">—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Leads */}
          {log.leads?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={13} className="text-orange-500" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Leads</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-500">
                      <th className="text-left px-3 py-2 font-semibold">Name</th>
                      <th className="text-left px-3 py-2 font-semibold">Status</th>
                      <th className="text-left px-3 py-2 font-semibold hidden sm:table-cell">Follow-up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {log.leads.map(l => (
                      <tr key={l._id}>
                        <td className="px-3 py-2 font-medium text-gray-800">{l.name}</td>
                        <td className="px-3 py-2"><StatusPill status={l.status} /></td>
                        <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">{l.followUp || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {log.notes?.trim() && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={13} className="text-green-500" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notes</span>
              </div>
              <p className="text-xs text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2.5 whitespace-pre-wrap leading-relaxed">
                {log.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {open && !hasContent && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 text-center text-xs text-gray-400 italic">
          Nothing logged for this date
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

  // 'mine' | 'team'
  const [viewMode, setViewMode] = useState('mine');
  const [teamLogs, setTeamLogs] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);

  // which section is open: 'people' | 'leads' | 'notes' | null
  const [openSection, setOpenSection] = useState('people');

  // station edit state
  const [stationInput, setStationInput] = useState('');
  const [stationEditing, setStationEditing] = useState(false);

  // people form
  const [personForm, setPersonForm] = useState({ name: '', role: '', hasFollowUp: false, followUpNote: '' });
  const [addingPerson, setAddingPerson] = useState(false);

  // leads form
  const [leadForm, setLeadForm] = useState({ name: '', status: 'new', followUp: '' });
  const [addingLead, setAddingLead] = useState(false);

  // notes
  const [notesValue, setNotesValue] = useState('');
  const notesSaveTimer = useRef(null);

  // ── fetch my log ───────────────────────────────────────────────────────────
  const fetchLog = useCallback(async (date) => {
    setIsLoading(true);
    try {
      const res = await dailyLogAPI.getLog(date);
      setLog(res.data.log);
      setStationInput(res.data.log.station || '');
      setNotesValue(res.data.log.notes || '');
    } catch {
      toast.error('Failed to load daily log');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── fetch team logs ────────────────────────────────────────────────────────
  const fetchTeamLogs = useCallback(async (date) => {
    setTeamLoading(true);
    try {
      const res = await dailyLogAPI.getTeamLogs(date);
      setTeamLogs(res.data.teamLogs || []);
    } catch {
      toast.error('Failed to load team logs');
    } finally {
      setTeamLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLog(dateStr);
    if (viewMode === 'team') fetchTeamLogs(dateStr);
  }, [dateStr, fetchLog]);

  useEffect(() => {
    if (viewMode === 'team') fetchTeamLogs(dateStr);
  }, [viewMode, dateStr, fetchTeamLogs]);

  // ── date navigation ────────────────────────────────────────────────────────
  const changeDate = (delta) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const next = new Date(y, m - 1, d + delta);
    setDateStr(toDateStr(next));
  };

  // ── station save ───────────────────────────────────────────────────────────
  const saveStation = async (val) => {
    if (!log) return;
    try {
      const res = await dailyLogAPI.updateStation(dateStr, val);
      setLog(res.data.log);
    } catch {
      toast.error('Failed to save station');
    }
  };

  // ── notes auto-save ────────────────────────────────────────────────────────
  const handleNotesChange = (val) => {
    setNotesValue(val);
    clearTimeout(notesSaveTimer.current);
    notesSaveTimer.current = setTimeout(async () => {
      try {
        const res = await dailyLogAPI.updateNotes(dateStr, val);
        setLog(res.data.log);
      } catch {
        toast.error('Failed to save notes');
      }
    }, 800);
  };

  // ── toggle section ─────────────────────────────────────────────────────────
  const toggleSection = (name) => setOpenSection(prev => prev === name ? null : name);

  // ── add person ─────────────────────────────────────────────────────────────
  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!personForm.name.trim()) return;
    setAddingPerson(true);
    try {
      const res = await dailyLogAPI.addPerson(dateStr, personForm);
      setLog(res.data.log);
      setPersonForm({ name: '', role: '', hasFollowUp: false, followUpNote: '' });
      toast.success('Person added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add person');
    } finally {
      setAddingPerson(false);
    }
  };

  const handleDeletePerson = async (personId) => {
    try {
      const res = await dailyLogAPI.deletePerson(dateStr, personId);
      setLog(res.data.log);
      toast.success('Removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  // ── add lead ───────────────────────────────────────────────────────────────
  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!leadForm.name.trim()) return;
    setAddingLead(true);
    try {
      const res = await dailyLogAPI.addLead(dateStr, leadForm);
      setLog(res.data.log);
      setLeadForm({ name: '', status: 'new', followUp: '' });
      toast.success('Lead added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add lead');
    } finally {
      setAddingLead(false);
    }
  };

  const handleDeleteLead = async (leadId) => {
    try {
      const res = await dailyLogAPI.deleteLead(dateStr, leadId);
      setLog(res.data.log);
      toast.success('Removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  // ── access guard ───────────────────────────────────────────────────────────
  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle size={56} className="mx-auto text-red-400 mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-1">Access Denied</h2>
          <p className="text-gray-500 text-sm">This page is for admins only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 pb-24">

      {/* ── Page header ── */}
      <div className="flex items-center gap-3 mb-5 pt-1">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <ClipboardList size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Daily Log</h1>
          <p className="text-xs text-gray-500">Field activity notes</p>
        </div>
      </div>

      {/* ── Date navigation ── */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 shadow-sm">
        <button
          onClick={() => changeDate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <div className="font-semibold text-gray-900 text-sm sm:text-base">{formatDisplay(dateStr)}</div>
          {isToday(dateStr) && (
            <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">Today</span>
          )}
        </div>
        <button
          onClick={() => changeDate(1)}
          disabled={isToday(dateStr)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* ── View toggle: My Log / Team View ── */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        <button
          onClick={() => setViewMode('mine')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
            viewMode === 'mine'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Edit3 size={15} />
          My Log
        </button>
        <button
          onClick={() => setViewMode('team')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
            viewMode === 'team'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Eye size={15} />
          Team View
        </button>
      </div>

      {/* ══════════════ MY LOG VIEW ══════════════ */}
      {viewMode === 'mine' && (
        <>
          {/* Station row */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 mb-5 shadow-sm">
            <MapPin size={16} className="text-violet-500 flex-shrink-0" />
            {stationEditing ? (
              <input
                autoFocus
                value={stationInput}
                onChange={e => setStationInput(e.target.value)}
                onBlur={() => { setStationEditing(false); saveStation(stationInput); }}
                onKeyDown={e => { if (e.key === 'Enter') { setStationEditing(false); saveStation(stationInput); } }}
                placeholder="Enter station name..."
                className="flex-1 text-sm font-medium text-gray-800 outline-none bg-transparent border-b border-violet-400"
              />
            ) : (
              <button
                onClick={() => setStationEditing(true)}
                className="flex-1 text-left text-sm font-medium text-gray-800 hover:text-violet-600 transition-colors"
              >
                {stationInput || <span className="text-gray-400 italic">Tap to set station...</span>}
              </button>
            )}
            {stationInput && !stationEditing && (
              <button onClick={() => setStationEditing(true)} className="text-xs text-gray-400 hover:text-violet-500">edit</button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="large" /></div>
          ) : (
            <div className="space-y-3">

              {/* ── PEOPLE MET ── */}
              <div>
                <SectionHeader
                  icon={Users}
                  color="from-blue-500 to-indigo-500"
                  title="People Met"
                  count={log?.peopleMet?.length || 0}
                  isOpen={openSection === 'people'}
                  onToggle={() => toggleSection('people')}
                />
                {openSection === 'people' && (
                  <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl px-4 pt-4 pb-4 space-y-4">
                    <form onSubmit={handleAddPerson} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Name *"
                          value={personForm.name}
                          onChange={e => setPersonForm(p => ({ ...p, name: e.target.value }))}
                          className="col-span-2 sm:col-span-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Role / Designation"
                          value={personForm.role}
                          onChange={e => setPersonForm(p => ({ ...p, role: e.target.value }))}
                          className="col-span-2 sm:col-span-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <div
                          onClick={() => setPersonForm(p => ({ ...p, hasFollowUp: !p.hasFollowUp, followUpNote: '' }))}
                          className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${personForm.hasFollowUp ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${personForm.hasFollowUp ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-xs font-medium text-gray-600">Follow-up needed</span>
                      </label>
                      {personForm.hasFollowUp && (
                        <input
                          type="text"
                          placeholder="What's the follow-up?"
                          value={personForm.followUpNote}
                          onChange={e => setPersonForm(p => ({ ...p, followUpNote: e.target.value }))}
                          className="w-full border border-blue-200 bg-blue-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      )}
                      <button
                        type="submit"
                        disabled={addingPerson || !personForm.name.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {addingPerson ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={15} />}
                        Add
                      </button>
                    </form>
                    {log?.peopleMet?.length > 0 && (
                      <div className="overflow-x-auto rounded-lg border border-gray-100">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                              <th className="text-left px-3 py-2 font-semibold">Name</th>
                              <th className="text-left px-3 py-2 font-semibold hidden sm:table-cell">Role</th>
                              <th className="text-left px-3 py-2 font-semibold">Follow-up</th>
                              <th className="px-2 py-2"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {log.peopleMet.map(person => (
                              <tr key={person._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-3 py-2.5 font-medium text-gray-800">{person.name}</td>
                                <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">{person.role || '—'}</td>
                                <td className="px-3 py-2.5">
                                  {person.hasFollowUp ? (
                                    <div className="flex items-start gap-1.5">
                                      <Check size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                      <span className="text-gray-700 text-xs leading-snug">{person.followUpNote || 'Yes'}</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-300 text-xs">—</span>
                                  )}
                                </td>
                                <td className="px-2 py-2.5 text-right">
                                  <button onClick={() => handleDeletePerson(person._id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors rounded">
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {log?.peopleMet?.length === 0 && <p className="text-center text-gray-400 text-xs py-2">No entries yet</p>}
                  </div>
                )}
              </div>

              {/* ── LEADS ── */}
              <div>
                <SectionHeader
                  icon={Zap}
                  color="from-orange-500 to-red-500"
                  title="Leads"
                  count={log?.leads?.length || 0}
                  isOpen={openSection === 'leads'}
                  onToggle={() => toggleSection('leads')}
                />
                {openSection === 'leads' && (
                  <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl px-4 pt-4 pb-4 space-y-4">
                    <form onSubmit={handleAddLead} className="space-y-3">
                      <input
                        type="text"
                        placeholder="Lead name / company *"
                        value={leadForm.name}
                        onChange={e => setLeadForm(l => ({ ...l, name: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        required
                      />
                      <div className="flex gap-2">
                        {['new', 'warm', 'hot'].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setLeadForm(l => ({ ...l, status: s }))}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              leadForm.status === s
                                ? `${STATUS_META[s].bg} ${STATUS_META[s].text} border-transparent`
                                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {STATUS_META[s].label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Follow-up / next step"
                        value={leadForm.followUp}
                        onChange={e => setLeadForm(l => ({ ...l, followUp: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      />
                      <button
                        type="submit"
                        disabled={addingLead || !leadForm.name.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {addingLead ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={15} />}
                        Add
                      </button>
                    </form>
                    {log?.leads?.length > 0 && (
                      <>
                        <div className="overflow-x-auto rounded-lg border border-gray-100">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <th className="text-left px-3 py-2 font-semibold">Name</th>
                                <th className="text-left px-3 py-2 font-semibold">Status</th>
                                <th className="text-left px-3 py-2 font-semibold hidden sm:table-cell">Follow-up</th>
                                <th className="px-2 py-2"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {log.leads.map(lead => (
                                <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-3 py-2.5 font-medium text-gray-800">{lead.name}</td>
                                  <td className="px-3 py-2.5"><StatusPill status={lead.status} /></td>
                                  <td className="px-3 py-2.5 text-gray-500 text-xs hidden sm:table-cell">{lead.followUp || '—'}</td>
                                  <td className="px-2 py-2.5 text-right">
                                    <button onClick={() => handleDeleteLead(lead._id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors rounded">
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {/* Mobile follow-up rows */}
                        <div className="sm:hidden space-y-1">
                          {log.leads.filter(l => l.followUp).map(lead => (
                            <div key={lead._id} className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-1.5">
                              <span className="font-medium text-gray-700">{lead.name}:</span> {lead.followUp}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {log?.leads?.length === 0 && <p className="text-center text-gray-400 text-xs py-2">No leads yet</p>}
                  </div>
                )}
              </div>

              {/* ── NOTES ── */}
              <div>
                <SectionHeader
                  icon={FileText}
                  color="from-green-500 to-emerald-500"
                  title="Notes"
                  count={notesValue.trim() ? 1 : 0}
                  isOpen={openSection === 'notes'}
                  onToggle={() => toggleSection('notes')}
                />
                {openSection === 'notes' && (
                  <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl px-4 pt-4 pb-4">
                    <textarea
                      value={notesValue}
                      onChange={e => handleNotesChange(e.target.value)}
                      placeholder="Any other notes — delays, observations, anything worth mentioning for the night meet..."
                      rows={6}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">Auto-saves as you type</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </>
      )}

      {/* ══════════════ TEAM VIEW ══════════════ */}
      {viewMode === 'team' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 text-center mb-4">
            All admins' logs for <span className="font-semibold text-gray-700">{formatDisplay(dateStr)}</span>
          </p>

          {teamLoading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="large" /></div>
          ) : teamLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No admin logs found</div>
          ) : (
            teamLogs.map((entry, i) => (
              <AdminLogCard key={entry.admin._id} entry={entry} colorIndex={i} />
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default DailyLog;
