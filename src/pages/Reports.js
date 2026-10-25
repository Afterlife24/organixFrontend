import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, ChevronLeft, ChevronRight, AlertCircle,
  TrendingUp, Users, Zap, Trophy, AlertOctagon, FileText,
  Phone, Linkedin, MessageCircle, Star, GitBranch, Calendar
} from 'lucide-react';
import { reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

// ─── helpers ──────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Get Monday of the week containing a date
const getMondayOf = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // adjust for Sunday
  d.setDate(d.getDate() + diff);
  return d;
};

const fmtDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const CHANNEL_ICON = {
  'cold-call': Phone, 'linkedin': Linkedin, 'whatsapp': MessageCircle,
  'event': Star, 'referral': GitBranch, 'other': Zap,
};
const CHANNEL_LABEL = {
  'cold-call': 'Cold Call', 'linkedin': 'LinkedIn', 'whatsapp': 'WhatsApp',
  'event': 'Event', 'referral': 'Referral', 'other': 'Other',
};
const STAGE_META = {
  'lead':         { label: 'Lead',         color: 'text-gray-500'   },
  'conversation': { label: 'Conversation', color: 'text-blue-600'   },
  'meeting':      { label: 'Meeting',      color: 'text-yellow-600' },
  'proposal':     { label: 'Proposal',     color: 'text-orange-600' },
  'client':       { label: 'Client',       color: 'text-green-600'  },
  'lost':         { label: 'Lost',         color: 'text-red-500'    },
};

// ─── stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color = 'text-gray-900', bg = 'bg-white' }) => (
  <div className={`${bg} border border-gray-100 rounded-2xl py-3 px-4 text-center`}>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-gray-400 mt-0.5">{label}</div>
  </div>
);

// ─── day card ─────────────────────────────────────────────────────────────────
const DayCard = ({ day, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const hasActivity = day.outreachTotal > 0 || day.wins || day.blockers || day.notes || day.taskNotes;

  return (
    <div className={`border rounded-2xl overflow-hidden ${hasActivity ? 'border-gray-200' : 'border-dashed border-gray-200 opacity-60'}`}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="text-left">
            <div className="font-semibold text-gray-900 text-sm">{day.dayName} — {fmtDate(day.date)}</div>
            {day.station && <div className="text-xs text-gray-400">📍 {day.station}</div>}
          </div>
          {day.outreachTotal > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {day.outreachTotal} outreach
            </span>
          )}
          {!hasActivity && <span className="text-xs text-gray-400 italic">No activity</span>}
        </div>
        <span className={`text-gray-400 transition-transform inline-block ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && hasActivity && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/40 space-y-3">

          {/* outreach breakdown */}
          {day.outreachTotal > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Outreach</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {[
                  { label: 'Interested',     val: day.outreachByOutcome?.interested || 0,       color: 'text-green-600',  bg: 'bg-green-50'  },
                  { label: 'Follow-up',      val: day.outreachByOutcome?.['follow-up'] || 0,    color: 'text-blue-600',   bg: 'bg-blue-50'   },
                  { label: 'Not Interested', val: day.outreachByOutcome?.['not-interested'] || 0,color: 'text-red-500',   bg: 'bg-red-50'    },
                  { label: 'No Response',    val: day.outreachByOutcome?.['no-response'] || 0,  color: 'text-gray-400',   bg: 'bg-gray-50'   },
                ].map(s => <StatCard key={s.label} label={s.label} value={s.val} color={s.color} bg={s.bg} />)}
              </div>

              {/* outreach entries */}
              <div className="space-y-1.5">
                {day.outreachEntries.map((entry, i) => {
                  const Icon = CHANNEL_ICON[entry.channel] || Zap;
                  return (
                    <div key={i} className="flex items-start gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2">
                      <Icon size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="font-medium text-gray-800 text-xs">{entry.name}</span>
                        <span className="text-gray-400 text-xs ml-2">{CHANNEL_LABEL[entry.channel]}</span>
                        {entry.followUpNote && <div className="text-xs text-blue-600">↪ {entry.followUpNote}</div>}
                        {entry.notes && <div className="text-xs text-gray-500">{entry.notes}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* wins / blockers / notes / taskNotes */}
          {(day.taskNotes || day.wins || day.blockers || day.notes) && (
            <div className="space-y-2">
              {day.taskNotes && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1"><FileText size={11} className="text-indigo-500" /><span className="text-xs font-semibold text-indigo-700">Notes / Tasks</span></div>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{day.taskNotes}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {day.wins && (
                  <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-1"><Trophy size={11} className="text-green-600" /><span className="text-xs font-semibold text-green-700">Wins</span></div>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{day.wins}</p>
                  </div>
                )}
                {day.blockers && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-1"><AlertOctagon size={11} className="text-red-500" /><span className="text-xs font-semibold text-red-600">Blockers</span></div>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{day.blockers}</p>
                  </div>
                )}
              </div>
              {day.notes && (
                <div className="bg-white border border-gray-200 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-1"><FileText size={11} className="text-gray-400" /><span className="text-xs font-semibold text-gray-500">Other Notes</span></div>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap">{day.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── weekly report view ───────────────────────────────────────────────────────
const WeeklyReport = ({ report }) => {
  const { admin, weekStart, weekEnd, days, leadsAdded, stageChanges, totals } = report;

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {admin.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-bold text-gray-900">{admin.name}</div>
            <div className="text-xs text-gray-400">{fmtDate(weekStart)} – {fmtDate(weekEnd)}</div>
          </div>
        </div>
      </div>

      {/* summary stats */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Week Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          <StatCard label="Total Outreach" value={totals.outreachTotal} color="text-blue-600" bg="bg-blue-50" />
          <StatCard label="Interested"     value={totals.interested}    color="text-green-600" bg="bg-green-50" />
          <StatCard label="Follow-ups"     value={totals.followUp}      color="text-blue-500" bg="bg-blue-50" />
          <StatCard label="Leads Added"    value={totals.leadsAdded}    color="text-orange-600" bg="bg-orange-50" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <StatCard label="Not Interested" value={totals.notInterested}  color="text-red-500" />
          <StatCard label="No Response"    value={totals.noResponse}     color="text-gray-400" />
          {totals.fuTotal > 0 && (
            <StatCard label="Follow-ups Done" value={`${totals.fuCompleted}/${totals.fuTotal}`} color="text-green-600" />
          )}
        </div>
      </div>

      {/* day by day */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Day by Day</p>
        <div className="space-y-2">
          {days.map((day, i) => <DayCard key={i} day={day} />)}
        </div>
      </div>

      {/* leads added */}
      {leadsAdded.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Leads Added This Week ({leadsAdded.length})
          </p>
          <div className="space-y-1.5">
            {leadsAdded.map((lead, i) => {
              const sm = STAGE_META[lead.stage] || STAGE_META.lead;
              return (
                <div key={i} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-3 py-2">
                  <div>
                    <span className="font-medium text-gray-800 text-sm">{lead.name}</span>
                    {lead.company && <span className="text-gray-400 text-xs ml-2">{lead.company}</span>}
                  </div>
                  <span className={`text-xs font-semibold ${sm.color}`}>{sm.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* stage changes */}
      {stageChanges.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Pipeline Movements ({stageChanges.length})
          </p>
          <div className="space-y-1.5">
            {stageChanges.map((sc, i) => {
              const sm = STAGE_META[sc.stage] || STAGE_META.lead;
              return (
                <div key={i} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-3 py-2">
                  <div>
                    <span className="font-medium text-gray-800 text-sm">{sc.leadName}</span>
                    {sc.company && <span className="text-gray-400 text-xs ml-2">{sc.company}</span>}
                    {sc.note && <div className="text-xs text-gray-500">{sc.note}</div>}
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-semibold ${sm.color}`}>→ {sm.label}</div>
                    <div className="text-xs text-gray-400">{fmtDate(sc.date)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── monthly report view ──────────────────────────────────────────────────────
const MonthlyReport = ({ report }) => {
  const { admin, year, month, weeks, leadsAdded, monthTotals } = report;

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {admin.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-bold text-gray-900">{admin.name}</div>
            <div className="text-xs text-gray-400">{MONTH_NAMES[month - 1]} {year}</div>
          </div>
        </div>
      </div>

      {/* monthly totals */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Monthly Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          <StatCard label="Total Outreach" value={monthTotals.outreachTotal} color="text-blue-600" bg="bg-blue-50" />
          <StatCard label="Interested"     value={monthTotals.interested}    color="text-green-600" bg="bg-green-50" />
          <StatCard label="Follow-ups"     value={monthTotals.followUp}      color="text-blue-500" />
          <StatCard label="Leads Added"    value={monthTotals.leadsAdded}    color="text-orange-600" bg="bg-orange-50" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Not Interested" value={monthTotals.notInterested} color="text-red-500" />
          <StatCard label="No Response"    value={monthTotals.noResponse}    color="text-gray-400" />
        </div>
      </div>

      {/* week by week */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Week by Week</p>
        <div className="space-y-3">
          {weeks.map((week, wi) => (
            <div key={wi} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span className="font-semibold text-gray-800 text-sm">
                  Week {week.weekNumber} — {fmtDate(week.weekStart)} to {fmtDate(week.weekEnd)}
                </span>
                <div className="flex gap-2">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {week.totals.outreachTotal} outreach
                  </span>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {week.totals.interested} interested
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {week.days.map((day, di) => <DayCard key={di} day={day} />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* leads added */}
      {leadsAdded.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Leads Added This Month ({leadsAdded.length})
          </p>
          <div className="space-y-1.5">
            {leadsAdded.map((lead, i) => {
              const sm = STAGE_META[lead.stage] || STAGE_META.lead;
              return (
                <div key={i} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-3 py-2">
                  <div>
                    <span className="font-medium text-gray-800 text-sm">{lead.name}</span>
                    {lead.company && <span className="text-gray-400 text-xs ml-2">{lead.company}</span>}
                  </div>
                  <span className={`text-xs font-semibold ${sm.color}`}>{sm.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────
const Reports = () => {
  const { user } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [reportType, setReportType] = useState('weekly'); // 'weekly' | 'monthly'

  // weekly state
  const [weekStart, setWeekStart] = useState(() => toDateStr(getMondayOf(new Date())));

  // monthly state
  const today = new Date();
  const [reportYear, setReportYear] = useState(today.getFullYear());
  const [reportMonth, setReportMonth] = useState(today.getMonth() + 1);

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // fetch admins
  useEffect(() => {
    if (!user?.isAdmin) return;
    reportsAPI.getAdmins().then(r => {
      setAdmins(r.data.admins || []);
      if (r.data.admins?.length > 0) setSelectedAdminId(r.data.admins[0]._id);
    }).catch(() => toast.error('Failed to load admins'));
  }, [user]);

  const generateReport = useCallback(async () => {
    if (!selectedAdminId) return;
    setIsLoading(true);
    setReport(null);
    try {
      let res;
      if (reportType === 'weekly') {
        res = await reportsAPI.getWeekly(selectedAdminId, weekStart);
      } else {
        res = await reportsAPI.getMonthly(selectedAdminId, reportYear, reportMonth);
      }
      setReport({ type: reportType, data: res.data });
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAdminId, reportType, weekStart, reportYear, reportMonth]);

  // navigate week
  const changeWeek = (delta) => {
    const [y, m, d] = weekStart.split('-').map(Number);
    const newDate = new Date(y, m - 1, d + delta * 7);
    setWeekStart(toDateStr(newDate));
    setReport(null);
  };

  // navigate month
  const changeMonth = (delta) => {
    let nm = reportMonth + delta;
    let ny = reportYear;
    if (nm > 12) { nm = 1; ny++; }
    if (nm < 1)  { nm = 12; ny--; }
    setReportMonth(nm);
    setReportYear(ny);
    setReport(null);
  };

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
    <div className="max-w-2xl mx-auto px-3 sm:px-4 pb-28">

      {/* header */}
      <div className="flex items-center gap-3 mb-5 pt-1">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
          <BarChart3 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-xs text-gray-400">Weekly & monthly activity reports</p>
        </div>
      </div>

      {/* controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 space-y-3 shadow-sm">

        {/* report type toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button onClick={() => { setReportType('weekly'); setReport(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${reportType === 'weekly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            <Calendar size={13} className="inline mr-1.5" />Weekly
          </button>
          <button onClick={() => { setReportType('monthly'); setReport(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${reportType === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            <BarChart3 size={13} className="inline mr-1.5" />Monthly
          </button>
        </div>

        {/* admin selector */}
        <div>
          <p className="text-xs text-gray-400 mb-1.5 font-medium">Admin</p>
          <div className="flex flex-wrap gap-2">
            {admins.map(a => (
              <button key={a._id} onClick={() => { setSelectedAdminId(a._id); setReport(null); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedAdminId === a._id
                    ? 'bg-indigo-600 text-white border-transparent'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}>
                <Users size={11} className="inline mr-1" />{a.name}
              </button>
            ))}
          </div>
        </div>

        {/* date range selector */}
        {reportType === 'weekly' ? (
          <div>
            <p className="text-xs text-gray-400 mb-1.5 font-medium">Week</p>
            <div className="flex items-center gap-2">
              <button onClick={() => changeWeek(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
                <ChevronLeft size={16} />
              </button>
              <div className="flex-1 text-center text-sm font-semibold text-gray-800">
                {fmtDate(weekStart)} – {fmtDate(toDateStr(new Date(
                  new Date(weekStart.split('-').map(Number).reduce((_, v, i) =>
                    i === 0 ? v : null) || weekStart).getTime()
                )))}
                {(() => {
                  const [y, m, d] = weekStart.split('-').map(Number);
                  const end = new Date(y, m - 1, d + 5);
                  return ` ${fmtDate(toDateStr(end))}`;
                })()}
              </div>
              <button onClick={() => changeWeek(1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
                <ChevronRight size={16} />
              </button>
            </div>
            {/* simpler date display */}
            <p className="text-center text-xs text-gray-400 mt-1">
              {weekStart} → {(() => {
                const [y, m, d] = weekStart.split('-').map(Number);
                const end = new Date(y, m - 1, d + 6); // Sunday
                return toDateStr(end);
              })()}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-gray-400 mb-1.5 font-medium">Month</p>
            <div className="flex items-center gap-2">
              <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
                <ChevronLeft size={16} />
              </button>
              <div className="flex-1 text-center text-sm font-semibold text-gray-800">
                {MONTH_NAMES[reportMonth - 1]} {reportYear}
              </div>
              <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* generate button */}
        <button onClick={generateReport} disabled={!selectedAdminId || isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm">
          {isLoading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <TrendingUp size={16} />
          }
          {isLoading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* report output */}
      {isLoading && (
        <div className="flex justify-center py-16"><LoadingSpinner size="large" /></div>
      )}
      {report && !isLoading && (
        report.type === 'weekly'
          ? <WeeklyReport report={report.data} />
          : <MonthlyReport report={report.data} />
      )}
    </div>
  );
};

export default Reports;
