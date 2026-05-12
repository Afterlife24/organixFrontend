import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, AlertCircle, Search } from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskInstanceCardReadOnly from '../components/TaskInstanceCardReadOnly';
import LoadingSpinner from '../components/LoadingSpinner';
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
import toast from 'react-hot-toast';

const Progress = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [taskInstances, setTaskInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [dateCounts, setDateCounts] = useState({});

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const response = await adminAPI.getAllUsers();
        // Filter out admin users
        const nonAdminUsers = response.data.users.filter(u => !u.isAdmin);
        setUsers(nonAdminUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch tasks for selected user and date
  useEffect(() => {
    if (!selectedUser) {
      setTaskInstances([]);
      return;
    }

    const fetchUserTasks = async () => {
      try {
        setIsLoading(true);
        const dateString = getLocalDateString(selectedDate);
        const response = await adminAPI.getUserTasks(selectedUser, dateString);
        setTaskInstances(response.data.taskInstances || []);
        
        // Update the count for this date
        const pendingCount = (response.data.taskInstances || []).filter(t => !t.completed).length;
        setDateCounts(prev => ({
          ...prev,
          [dateString]: pendingCount
        }));
      } catch (error) {
        console.error('Error fetching user tasks:', error);
        toast.error('Failed to load user tasks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTasks();
  }, [selectedUser, selectedDate]);

  // Fetch task counts for calendar dates (only for today and future)
  const calendarDays = generateCalendarDays(currentMonth);

  useEffect(() => {
    if (!selectedUser) {
      setDateCounts({});
      return;
    }

    const fetchDateCounts = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const futureDates = calendarDays.filter(date => {
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);
        return dateOnly >= today && isInCurrentMonth(date, currentMonth);
      });

      // Fetch counts progressively
      for (const date of futureDates) {
        const dateString = getLocalDateString(date);
        try {
          const response = await adminAPI.getUserTasks(selectedUser, dateString);
          const pendingCount = (response.data.taskInstances || []).filter(t => !t.completed).length;
          
          if (pendingCount > 0) {
            setDateCounts(prev => ({
              ...prev,
              [dateString]: pendingCount
            }));
          }
        } catch (error) {
          console.error(`Error fetching count for ${dateString}:`, error);
        }
      }
    };

    fetchDateCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, currentMonth]);

  // Navigate months
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Handle date click
  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  // Generate calendar days
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Filter users by search
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUserData = users.find(u => u._id === selectedUser);

  // Filter tasks
  const completedTasks = (taskInstances || []).filter(instance => instance.completed);
  const incompleteTasks = (taskInstances || []).filter(instance => !instance.completed);

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingUp className="text-primary-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Progress Monitoring</h1>
              <p className="text-gray-600">View team member task progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Selection */}
      <div className="mb-6">
        <div className="floating-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="mr-2 text-blue-600" size={20} />
            Select Team Member
          </h2>
          
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* User Dropdown */}
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoadingUsers}
            >
              <option value="">Choose a team member...</option>
              {filteredUsers.map((userData) => (
                <option key={userData._id} value={userData._id}>
                  {userData.name} ({userData.email}) - {userData.taskCount} tasks
                </option>
              ))}
            </select>
          </div>
          
          {selectedUserData && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {selectedUserData.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{selectedUserData.name}</p>
                  <p className="text-xs text-gray-500">{selectedUserData.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calendar and Tasks Section */}
      {selectedUser && (
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
                  <div key={day} className="calendar-header">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((date, index) => {
                  const isCurrentMonthDay = isInCurrentMonth(date, currentMonth);
                  const isTodayDate = isToday(date);
                  const isSelected = isSameDay(date, selectedDate);
                  const dateString = getLocalDateString(date);
                  const pendingCount = dateCounts[dateString] || 0;
                  
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
                      {pendingCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                          {pendingCount > 9 ? '9+' : pendingCount}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isToday(selectedDate) ? 'Today' : formatDate(selectedDate, { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </h3>
                
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
                              <TaskInstanceCardReadOnly 
                                key={taskInstance._id}
                                taskInstance={taskInstance} 
                                showDateRange={false}
                                compact={true}
                              />
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
                              <TaskInstanceCardReadOnly 
                                key={taskInstance._id}
                                taskInstance={taskInstance} 
                                showDateRange={false}
                                compact={true}
                              />
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
                      <p className="text-sm text-gray-500">
                        {selectedUserData?.name} has no tasks for {formatDate(selectedDate, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No User Selected State */}
      {!selectedUser && !isLoadingUsers && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-gray-400" size={40} />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Select a Team Member
            </h3>
            <p className="text-gray-500 max-w-md">
              Choose a team member from the dropdown above to view their task progress and calendar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;
