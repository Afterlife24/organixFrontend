import React, { useState, useEffect, useCallback } from 'react';
import { useTask } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { taskInstanceAPI, followUpsAPI } from '../services/api';
import TaskInstanceCard from '../components/TaskInstanceCard';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateTaskModal from '../components/CreateTaskModal';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus,
  Phone, Linkedin, MessageCircle, Star, GitBranch, Zap, TrendingUp
} from 'lucide-react';
import {
  getLocalDateString,
  isToday,
  isSameDay,
  formatDate,
  getMonthName,
  getYear,
  generateCalendarDays,
  isInCurrentMonth
} from '../utils/dateUtils';

// ─── channel icon map ─────────────────────────────────────────────────────────
const CHANNEL_ICON = {
  'cold-call': Phone,
  'linkedin':  Linkedin,
  'whatsapp':  MessageCircle,
  'event':     Star,
  'referral':  GitBranch,
  'other':     Zap,
};

const CHANNEL_LABEL = {
  'cold-call': 'Cold Call',
  'linkedin':  'LinkedIn',
  'whatsapp':  'WhatsApp',
  'event':     'Event',
  'referral':  'Referral',
  'other':     'Other',
};

const STAGE_META = {
  'lead':         { label: 'Lead',         bg: 'bg-gray-100',   text: 'text-gray-600'   },
  'conversation': { label: 'Conversation', bg: 'bg-blue-100',   text: 'text-blue-700'   },
  'meeting':      { label: 'Meeting',      bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'proposal':     { label: 'Proposal',     bg: 'bg-orange-100', text: 'text-orange-700' },
  'client':       { label: 'Client',       bg: 'bg-green-100',  text: 'text-green-700'  },
  'lost':         { label: 'Lost',         bg: 'bg-red-100',    text: 'text-red-600'    },
};

// ─── follow-up card components ────────────────────────────────────────────────

const OutreachFollowUpCard = ({ entry }) => {
  const Icon = CHANNEL_ICON[entry.channel] || Zap;
  return (
    <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
      <div className="w-7 h-7 bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={13} className="text-blue-600" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-gray-900 text-sm">{entry.name}</div>
        <div className="text-xs text-blue-600 font-medium mt-0.5">
          {CHANNEL_LABEL[entry.channel] || 'Other'}
        </div>
        {entry.followUpNote && (
          <div className="text-xs text-gray-600 mt-0.5">↪ {entry.followUpNote}</div>
        )}
        {(entry.phone || entry.email) && (
          <div className="flex gap-3 mt-0.5">
            {entry.phone && <span className="text-xs text-gray-400">📞 {entry.phone}</span>}
            {entry.email && <span className="text-xs text-gray-400">✉️ {entry.email}</span>}
          </div>
        )}
        {entry.loggedBy && (
          <div className="text-xs text-gray-400 mt-0.5">by {entry.loggedBy.name}</div>
        )}
      </div>
    </div>
  );
};

const LeadFollowUpCard = ({ lead }) => {
  const sm = STAGE_META[lead.stage] || STAGE_META.lead;
  return (
    <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
      <div className="w-7 h-7 bg-orange-100 border border-orange-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <TrendingUp size={13} className="text-orange-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">{lead.name}</span>
          {lead.company && <span className="text-xs text-gray-400">{lead.company}</span>}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sm.bg} ${sm.text}`}>
            {sm.label}
          </span>
        </div>
        {lead.nextStep && (
          <div className="text-xs text-orange-700 mt-0.5 bg-orange-100 rounded-lg px-2 py-0.5">
            ↪ {lead.nextStep}
          </div>
        )}
        {(lead.phone || lead.email) && (
          <div className="flex gap-3 mt-0.5">
            {lead.phone && <span className="text-xs text-gray-400">📞 {lead.phone}</span>}
            {lead.email && <span className="text-xs text-gray-400">✉️ {lead.email}</span>}
          </div>
        )}
        {lead.ownerId && (
          <div className="text-xs text-gray-400 mt-0.5">by {lead.ownerId.name}</div>
        )}
      </div>
    </div>
  );
};

// ─── main Calendar component ──────────────────────────────────────────────────

const Calendar = () => {
  const { taskInstances, isLoading, fetchTaskInstancesForDate } = useTask();
  const { user } = useAuth();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);

  // task counts per day
  const [monthTaskCounts, setMonthTaskCounts] = useState({});

  // follow-up counts per day { "2026-08-22": { outreach: 2, leads: 1 } }
  const [monthFollowUpCounts, setMonthFollowUpCounts] = useState({});

  // follow-up details for selected date
  const [followUps, setFollowUps] = useState({ outreach: [], leads: [] });
  const [followUpsLoading, setFollowUpsLoading] = useState(false);

  // mobile panel tab
  const [mobileTab, setMobileTab] = useState('tasks'); // 'tasks' | 'followups'

  // ── fetch task counts for month ───────────────────────────────────────────
  useEffect(() => {
    const fetchMonthCounts = async () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      try {
        const response = await taskInstanceAPI.getMonthCounts(year, month);
        setMonthTaskCounts(response.data.counts || {});
      } catch { setMonthTaskCounts({}); }
    };
    setMonthTaskCounts({});
    fetchMonthCounts();
  }, [currentMonth]);

  // ── fetch follow-up counts for month (admin only) ─────────────────────────
  useEffect(() => {
    if (!user?.isAdmin) return;
    const fetchFollowUpCounts = async () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      try {
        const res = await followUpsAPI.getMonthCounts(year, month);
        setMonthFollowUpCounts(res.data.counts || {});
      } catch { setMonthFollowUpCounts({}); }
    };
    setMonthFollowUpCounts({});
    fetchFollowUpCounts();
  }, [currentMonth, user]);

  // ── fetch tasks for selected date ─────────────────────────────────────────
  useEffect(() => {
    const dateString = getLocalDateString(selectedDate);
    fetchTaskInstancesForDate(dateString);
  }, [selectedDate, fetchTaskInstancesForDate]);

  // ── fetch follow-up details for selected date ─────────────────────────────
  const fetchFollowUps = useCallback(async (date) => {
    if (!user?.isAdmin) return;
    setFollowUpsLoading(true);
    try {
      const res = await followUpsAPI.getDateDetails(getLocalDateString(date));
      setFollowUps(res.data);
    } catch { setFollowUps({ outreach: [], leads: [] }); }
    finally { setFollowUpsLoading(false); }
  }, [user]);

  useEffect(() => { fetchFollowUps(selectedDate); }, [selectedDate, fetchFollowUps]);

  // ── update task count for selected date ───────────────────────────────────
  useEffect(() => {
    const dateString = getLocalDateString(selectedDate);
    const pendingCount = (taskInstances || []).filter(t => !t.completed).length;
    setMonthTaskCounts(prev => ({ ...prev, [dateString]: pendingCount }));
  }, [taskInstances, selectedDate]);

  const navigateMonth = (dir) => {
    const n = new Date(currentMonth);
    n.setMonth(n.getMonth() + dir);
    setCurrentMonth(n);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setMobileTab('tasks');
  };

  const calendarDays = generateCalendarDays(currentMonth);
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const completedTasks = (taskInstances || []).filter(i => i.completed);
  const incompleteTasks = (taskInstances || []).filter(i => !i.completed);
  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() &&
    currentMonth.getFullYear() === new Date().getFullYear();

  const totalFollowUps = followUps.outreach.length + followUps.leads.length;

  // ── tasks panel ───────────────────────────────────────────────────────────
  const TasksPanel = () => (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-gray-900">
            {isToday(selectedDate) ? 'Today' : formatDate(selectedDate, { weekday: 'short', month: 'short', day: 'numeric' })}
          </h3>
          <button onClick={() => setShowCreateModal(true)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>{incompleteTasks.length} active</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full"></span>{completedTasks.length} done</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner size="medium" /></div>
        ) : (taskInstances || []).length > 0 ? (
          <div className="p-3 space-y-3">
            {incompleteTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-semibold text-gray-600">Active ({incompleteTasks.length})</span>
                </div>
                <div className="space-y-2">
                  {incompleteTasks.map(ti => (
                    <TaskInstanceCard key={ti._id} taskInstance={ti} showDateRange={false} compact={true} />
                  ))}
                </div>
              </div>
            )}
            {completedTasks.length > 0 && (
              <div className={incompleteTasks.length > 0 ? 'pt-3 border-t border-gray-100' : ''}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-semibold text-gray-600">Done ({completedTasks.length})</span>
                </div>
                <div className="space-y-2 opacity-70">
                  {completedTasks.map(ti => (
                    <TaskInstanceCard key={ti._id} taskInstance={ti} showDateRange={false} compact={true} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <CalendarIcon className="text-gray-400" size={24} />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">No tasks scheduled</p>
            <p className="text-xs text-gray-400 mb-4">
              {isToday(selectedDate) ? "You're all clear for today!" : `Nothing on ${formatDate(selectedDate, { month: 'short', day: 'numeric' })}`}
            </p>
            <button onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
              <Plus size={13} />Add Task
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ── follow-ups panel ──────────────────────────────────────────────────────
  const FollowUpsPanel = () => (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Follow-ups</h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            {followUps.outreach.length} outreach
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            {followUps.leads.length} leads
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {followUpsLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner size="medium" /></div>
        ) : totalFollowUps === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <TrendingUp className="text-gray-400" size={24} />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">No follow-ups</p>
            <p className="text-xs text-gray-400">Set follow-up dates on leads in the Daily Log</p>
          </div>
        ) : (
          <div className="p-3 space-y-4">
            {/* Outreach follow-ups */}
            {followUps.outreach.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Outreach ({followUps.outreach.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {followUps.outreach.map((entry, i) => (
                    <OutreachFollowUpCard key={entry._id || i} entry={entry} />
                  ))}
                </div>
              </div>
            )}

            {/* Lead follow-ups */}
            {followUps.leads.length > 0 && (
              <div className={followUps.outreach.length > 0 ? 'pt-3 border-t border-gray-100' : ''}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="w-2.5 h-2.5 bg-orange-500 rounded-full flex-shrink-0"></span>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Leads ({followUps.leads.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {followUps.leads.map(lead => (
                    <LeadFollowUpCard key={lead._id} lead={lead} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">

      {/* ── header ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="text-primary-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600">Monthly view with task management</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {!isCurrentMonth && (
              <button onClick={goToToday} className="btn-secondary text-sm">Today</button>
            )}
            <button onClick={() => setShowCreateModal(true)}
              className="btn-primary text-sm inline-flex items-center space-x-2">
              <Plus size={16} /><span>New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── main grid ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">

        {/* Calendar — takes 3/5 columns */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col">

            {/* Month nav */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => navigateMonth(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {getMonthName(currentMonth)} {getYear(currentMonth)}
              </h2>
              <button onClick={() => navigateMonth(1)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Grid */}
            <div className="calendar-grid flex-1">
              {weekDays.map(d => <div key={d} className="calendar-header">{d}</div>)}

              {calendarDays.map((date, idx) => {
                const inMonth = isInCurrentMonth(date, currentMonth);
                const todayDate = isToday(date);
                const selected = isSameDay(date, selectedDate);
                const dateStr = getLocalDateString(date);
                const taskCount = monthTaskCounts[dateStr] || 0;
                const fuCounts = monthFollowUpCounts[dateStr] || {};
                const hasOutreach = (fuCounts.outreach || 0) > 0;
                const hasLeads = (fuCounts.leads || 0) > 0;

                return (
                  <button key={idx} onClick={() => handleDateClick(date)}
                    className={`
                      calendar-day flex flex-col items-center justify-start pt-2 pb-1.5 text-sm font-medium rounded-lg relative min-h-[56px] overflow-visible
                      ${inMonth ? 'calendar-day-current-month' : 'calendar-day-other-month'}
                      ${todayDate ? 'calendar-day-today' : ''}
                      ${selected && !todayDate ? 'calendar-day-selected' : ''}
                      ${selected && todayDate ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold ring-2 ring-blue-400 shadow-lg' : ''}
                    `}
                    title={formatDate(date)}
                  >
                    <span className="leading-none">{date.getDate()}</span>

                    {/* color dots — always reserve space so layout doesn't shift */}
                    <div className="flex items-center justify-center gap-0.5 mt-1.5 h-2">
                      {inMonth && taskCount > 0 && (
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selected && todayDate ? 'bg-white' : 'bg-purple-500'}`} />
                      )}
                      {inMonth && hasOutreach && (
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selected && todayDate ? 'bg-blue-200' : 'bg-blue-500'}`} />
                      )}
                      {inMonth && hasLeads && (
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selected && todayDate ? 'bg-orange-200' : 'bg-orange-500'}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center flex-wrap gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-purple-500 rounded-full"></span>Tasks
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>Outreach follow-ups
              </div>
              {user?.isAdmin && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>Lead follow-ups
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panels — takes 2/5 columns */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">

          {/* Mobile tab switcher (hidden on desktop) */}
          <div className="lg:hidden flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => setMobileTab('tasks')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mobileTab === 'tasks' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              📋 Tasks
            </button>
            <button onClick={() => setMobileTab('followups')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mobileTab === 'followups' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
              🔔 Follow-ups {totalFollowUps > 0 && `(${totalFollowUps})`}
            </button>
          </div>

          {/* Desktop: two stacked panels / Mobile: tab-driven */}
          <div className="hidden lg:flex flex-col gap-4 flex-1 min-h-0">
            {/* Tasks */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden min-h-0">
              <TasksPanel />
            </div>
            {/* Follow-ups (admin only) */}
            {user?.isAdmin && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden min-h-0">
                <FollowUpsPanel />
              </div>
            )}
          </div>

          {/* Mobile panels */}
          <div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden" style={{ minHeight: '400px' }}>
            {mobileTab === 'tasks' ? <TasksPanel /> : <FollowUpsPanel />}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default Calendar;
