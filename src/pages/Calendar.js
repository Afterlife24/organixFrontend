import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { taskInstanceAPI } from '../services/api';
import TaskInstanceCard from '../components/TaskInstanceCard';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateTaskModal from '../components/CreateTaskModal';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
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

const Calendar = () => {
  const { taskInstances, isLoading, fetchTaskInstancesForDate } = useTask();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [monthTaskCounts, setMonthTaskCounts] = useState({});

  // Fetch task counts for all dates in current month (single API call)
  useEffect(() => {
    const fetchMonthCounts = async () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      try {
        const response = await taskInstanceAPI.getMonthCounts(year, month);
        setMonthTaskCounts(response.data.counts || {});
      } catch (error) {
        console.error('Error fetching month task counts:', error);
        setMonthTaskCounts({});
      }
    };

    setMonthTaskCounts({});
    fetchMonthCounts();
  }, [currentMonth]);

  // Fetch tasks for the selected date
  useEffect(() => {
    const dateString = getLocalDateString(selectedDate);
    console.log('Calendar: Fetching tasks for date:', dateString);
    fetchTaskInstancesForDate(dateString);
  }, [selectedDate, fetchTaskInstancesForDate]);

  // Update count for selected date when tasks change
  useEffect(() => {
    const dateString = getLocalDateString(selectedDate);
    const pendingCount = (taskInstances || []).filter(t => !t.completed).length;
    
    // Update the count for the selected date
    setMonthTaskCounts(prev => ({
      ...prev,
      [dateString]: pendingCount
    }));
  }, [taskInstances, selectedDate]);

  // Navigate months
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Go to current month
  const goToCurrentMonth = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Handle date click
  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  // Generate calendar days
  const calendarDays = generateCalendarDays(currentMonth);
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Filter tasks
  const completedTasks = (taskInstances || []).filter(instance => instance.completed);
  const incompleteTasks = (taskInstances || []).filter(instance => !instance.completed);

  // Check if current month is today's month
  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && 
                         currentMonth.getFullYear() === new Date().getFullYear();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
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
              <button
                onClick={goToCurrentMonth}
                className="btn-secondary text-sm"
              >
                Today
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary text-sm inline-flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-section layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Previous month"
              >
                <ChevronLeft size={20} />
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900">
                {getMonthName(currentMonth)} {getYear(currentMonth)}
              </h2>
              
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Next month"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid">
              {/* Week day headers */}
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="calendar-header"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((date, index) => {
                const isCurrentMonthDay = isInCurrentMonth(date, currentMonth);
                const isTodayDate = isToday(date);
                const isSelected = isSameDay(date, selectedDate);
                const dateString = getLocalDateString(date);
                const taskCount = monthTaskCounts[dateString] || 0;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={`
                      calendar-day h-12 flex items-center justify-center text-sm font-medium rounded-lg relative
                      ${isCurrentMonthDay 
                        ? 'calendar-day-current-month' 
                        : 'calendar-day-other-month'
                      }
                      ${isTodayDate 
                        ? 'calendar-day-today' 
                        : ''
                      }
                      ${isSelected && !isTodayDate
                        ? 'calendar-day-selected' 
                        : ''
                      }
                      ${isSelected && isTodayDate
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold ring-2 ring-blue-400 shadow-lg transform scale-105' 
                        : ''
                      }
                    `}
                    title={formatDate(date)}
                  >
                    {date.getDate()}
                    
                    {/* Task count badge */}
                    {isCurrentMonthDay && taskCount > 0 && (
                      <span className={`
                        absolute -top-1 -right-1 
                        min-w-[18px] h-[18px] 
                        flex items-center justify-center 
                        text-[10px] font-bold 
                        rounded-full 
                        ${isSelected 
                          ? 'bg-white text-blue-600' 
                          : 'bg-red-500 text-white'
                        }
                        shadow-sm
                        px-1
                      `}>
                        {taskCount > 9 ? '9+' : taskCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-100 border-2 border-blue-200 rounded"></div>
                <span>Today</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary-600 rounded"></div>
                <span>Selected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
            {/* Tasks Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isToday(selectedDate) ? 'Today' : formatDate(selectedDate, { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </h3>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Add task for this date"
                >
                  <Plus size={18} />
                </button>
              </div>
              
              {/* Task Stats */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {incompleteTasks.length} active
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {completedTasks.length} done
                  </span>
                </div>
              </div>
            </div>

            {/* Tasks Content */}
            <div className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="medium" />
                </div>
              ) : (taskInstances || []).length > 0 ? (
                <div className="h-full overflow-y-auto tasks-scroll">
                  <div className="p-4 space-y-4">
                    {/* Active Tasks */}
                    {incompleteTasks.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-3 px-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <h4 className="text-sm font-semibold text-gray-700">
                            Active Tasks ({incompleteTasks.length})
                          </h4>
                        </div>
                        <div className="space-y-3">
                          {incompleteTasks.map((taskInstance) => (
                            <div key={taskInstance._id} className="transform transition-all duration-200 hover:scale-[1.02]">
                              <TaskInstanceCard 
                                taskInstance={taskInstance} 
                                showDateRange={false}
                                compact={true}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completed Tasks */}
                    {completedTasks.length > 0 && (
                      <div className={incompleteTasks.length > 0 ? 'mt-6 pt-6 border-t border-gray-100' : ''}>
                        <div className="flex items-center space-x-2 mb-3 px-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <h4 className="text-sm font-semibold text-gray-700">
                            Completed Tasks ({completedTasks.length})
                          </h4>
                        </div>
                        <div className="space-y-3 opacity-75">
                          {completedTasks.map((taskInstance) => (
                            <div key={taskInstance._id} className="transform transition-all duration-200 hover:scale-[1.02]">
                              <TaskInstanceCard 
                                taskInstance={taskInstance} 
                                showDateRange={false}
                                compact={true}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Empty State */
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="text-gray-400" size={32} />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No tasks scheduled
                    </h4>
                    <p className="text-sm text-gray-500 mb-6 max-w-xs">
                      {isToday(selectedDate) 
                        ? "You're all clear for today! Time to relax or add a new task."
                        : `No tasks scheduled for ${formatDate(selectedDate, { month: 'short', day: 'numeric' })}`
                      }
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center space-x-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Plus size={16} />
                      <span>Add Task</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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