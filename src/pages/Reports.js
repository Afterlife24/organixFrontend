import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, ChevronLeft, ChevronRight, AlertCircle,
  Users, Calendar, TrendingUp, FileText
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

const getMondayOf = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const fmtDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

// ─── simple day row ───────────────────────────────────────────────────────────
const DayRow = ({ day }) => {
  const hasNotes = !!(day.taskNotes?.trim());
  return (
    <div className={`flex gap-4 py-3.5 border-b border-gray-100 last:border-0 ${!hasNotes ? 'opacity-50' : ''}`}>
      {/* date label */}
      <div className="w-28 flex-shrink-0 text-xs font-semibold text-gray-500 pt-0.5">
        {day.dayName}, {fmtDate(day.date)}
      </div>
      {/* notes content */}
      <div className="flex-1 min-w-0">
        {hasNotes ? (
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{day.taskNotes}</p>
        ) : (
          <p className="text-xs text-gray-400 italic">No entry</p>
        )}
      </div>
    </div>
  );
};

// ─── weekly report ────────────────────────────────────────────────────────────
const WeeklyReport = ({ report }) => {
  const { admin, weekStart, weekEnd, days } = report;
  const filled = days.filter(d => d.taskNotes?.trim()).length;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {admin.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">{admin.name}</div>
            <div className="text-xs text-gray-400">{fmtDate(weekStart)} – {fmtDate(weekEnd)}</div>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          filled === 7 ? 'bg-green-100 text-green-700' :
          filled > 0  ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
        }`}>
          {filled}/7 days filled
        </span>
      </div>
      {/* days */}
      <div className="px-5">
        {days.map((day, i) => <DayRow key={i} day={day} />)}
      </div>
    </div>
  );
};

// ─── monthly report ───────────────────────────────────────────────────────────
const MonthlyReport = ({ report }) => {
  const { admin, year, month, weeks } = report;
  const allDays = weeks.flatMap(w => w.days);
  const filled = allDays.filter(d => d.taskNotes?.trim()).length;

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {admin.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">{admin.name}</div>
            <div className="text-xs text-gray-400">{MONTH_NAMES[month - 1]} {year}</div>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          filled > 20 ? 'bg-green-100 text-green-700' :
          filled > 10 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
        }`}>
          {filled}/{allDays.length} days filled
        </span>
      </div>

      {/* week by week */}
      {weeks.map((week, wi) => (
        <div key={wi} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">
              Week {week.weekNumber} — {fmtDate(week.weekStart)} to {fmtDate(week.weekEnd)}
            </span>
            <span className="text-xs text-gray-400">
              {week.days.filter(d => d.taskNotes?.trim()).length}/{week.days.length} filled
            </span>
          </div>
          <div className="px-5">
            {week.days.map((day, di) => <DayRow key={di} day={day} />)}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── main ─────────────────────────────────────────────────────────────────────
const Reports = () => {
  const { user } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [reportType, setReportType] = useState('weekly');

  const [weekStart, setWeekStart] = useState(() => toDateStr(getMondayOf(new Date())));

  const today = new Date();
  const [reportYear, setReportYear] = useState(today.getFullYear());
  const [reportMonth, setReportMonth] = useState(today.getMonth() + 1);

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const changeWeek = (delta) => {
    const [y, m, d] = weekStart.split('-').map(Number);
    const newDate = new Date(y, m - 1, d + delta * 7);
    setWeekStart(toDateStr(newDate));
    setReport(null);
  };

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
          <p className="text-xs text-gray-400">Daily Notes / Tasks — weekly & monthly</p>
        </div>
      </div>

      {/* controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 space-y-3 shadow-sm">

        {/* weekly / monthly */}
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

        {/* admin picker */}
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

        {/* date range */}
        {reportType === 'weekly' ? (
          <div className="flex items-center gap-2">
            <button onClick={() => changeWeek(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
              <ChevronLeft size={16} />
            </button>
            <div className="flex-1 text-center text-sm font-semibold text-gray-800">
              {(() => {
                const [y, m, d] = weekStart.split('-').map(Number);
                const end = new Date(y, m - 1, d + 6);
                return `${fmtDate(weekStart)} – ${fmtDate(toDateStr(end))}`;
              })()}
            </div>
            <button onClick={() => changeWeek(1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
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
        )}

        {/* generate */}
        <button onClick={generateReport} disabled={!selectedAdminId || isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm">
          {isLoading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <FileText size={16} />
          }
          {isLoading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* output */}
      {isLoading && <div className="flex justify-center py-16"><LoadingSpinner size="large" /></div>}
      {report && !isLoading && (
        report.type === 'weekly'
          ? <WeeklyReport report={report.data} />
          : <MonthlyReport report={report.data} />
      )}
    </div>
  );
};

export default Reports;
