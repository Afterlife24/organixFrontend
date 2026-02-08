import React, { useState, useEffect } from 'react';
import { Users, Plus, Calendar, CheckSquare, AlertCircle, Search, UserPlus, Send } from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { getTodayString } from '../utils/dateUtils';
import toast from 'react-hot-toast';

const People = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  // Form state
  const [selectedUser, setSelectedUser] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState('static'); // 'static' or 'dated'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersResponse, statsResponse] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getAdminStats()
      ]);
      
      // Filter out admin users from the list
      const nonAdminUsers = usersResponse.data.users.filter(u => !u.isAdmin);
      setUsers(nonAdminUsers);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }
    
    if (!taskTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    if (taskType === 'dated' && (!startDate || !endDate)) {
      toast.error('Please select both start and end dates for dated tasks');
      return;
    }

    try {
      setIsCreatingTask(true);
      
      const taskData = {
        userId: selectedUser,
        title: taskTitle.trim()
      };

      if (taskType === 'dated') {
        taskData.startDate = startDate;
        taskData.endDate = endDate;
      }

      const response = await adminAPI.createTaskForUser(taskData);
      
      toast.success(`Task created for ${response.data.targetUser.name}!`);
      
      // Reset form
      setTaskTitle('');
      setSelectedUser('');
      setSearchTerm('');
      setTaskType('static');
      setStartDate('');
      setEndDate('');
      
      // Refresh stats
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create task';
      toast.error(message);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUserData = users.find(u => u._id === selectedUser);

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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
            <UserPlus className="mr-3 text-blue-600" size={32} />
            Assign Tasks
          </h1>
          <p className="text-gray-600 mt-1">Create tasks for team members</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="floating-card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="floating-card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckSquare className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
              </div>
            </div>
          </div>

          <div className="floating-card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Form */}
      <div className="floating-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Plus className="mr-2 text-green-600" size={24} />
          Create New Task
        </h2>

        <form onSubmit={handleCreateTask} className="space-y-6">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Team Member
            </label>
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
                required
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
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
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

          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Enter task description..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Task Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                taskType === 'static' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="taskType"
                  value="static"
                  checked={taskType === 'static'}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="sr-only"
                />
                <CheckSquare className={`mr-3 ${taskType === 'static' ? 'text-blue-600' : 'text-gray-400'}`} size={20} />
                <div>
                  <div className="font-medium text-gray-900">Static Task</div>
                  <div className="text-sm text-gray-500">No specific dates</div>
                </div>
              </label>

              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                taskType === 'dated' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="taskType"
                  value="dated"
                  checked={taskType === 'dated'}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="sr-only"
                />
                <Calendar className={`mr-3 ${taskType === 'dated' ? 'text-blue-600' : 'text-gray-400'}`} size={20} />
                <div>
                  <div className="font-medium text-gray-900">Dated Task</div>
                  <div className="text-sm text-gray-500">With start & end dates</div>
                </div>
              </label>
            </div>
          </div>

          {/* Date Selection (only for dated tasks) */}
          {taskType === 'dated' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={getTodayString()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || getTodayString()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreatingTask}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreatingTask ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Send className="mr-2" size={16} />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* No Users Message */}
      {users.length === 0 && (
        <div className="floating-card p-8 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Members</h3>
          <p className="text-gray-500">There are no registered users to assign tasks to.</p>
        </div>
      )}
    </div>
  );
};

export default People;