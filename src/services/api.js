import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getCurrentUser: () => api.get('/auth/me'),
  resetPassword: (email, code, newPassword) => api.post('/auth/reset-password', { email, code, newPassword }),
  verifyResetCode: (email, code) => api.post('/auth/verify-reset-code', { email, code }),
};

// Task API
export const taskAPI = {
  getAllTasks: () => api.get('/tasks'),
  getTodayTasks: () => api.get('/tasks/today'),
  getStaticTasks: () => api.get('/tasks/static'),
  getTasksForDate: (date) => api.get(`/tasks/date/${date}`),
  createTask: (taskData) => api.post('/tasks', taskData),
  updateTask: (taskId, updates) => api.put(`/tasks/${taskId}`, updates),
  updateTaskOrder: (taskId, direction) => api.put(`/tasks/${taskId}/order`, { direction }),
  deleteTask: (taskId) => api.delete(`/tasks/${taskId}`),
  createSubtask: (taskId, subtaskData) => api.post(`/tasks/${taskId}/subtasks`, subtaskData),
};

// Subtask API
export const subtaskAPI = {
  updateSubtask: (subtaskId, updates) => api.put(`/subtasks/${subtaskId}`, updates),
  deleteSubtask: (subtaskId) => api.delete(`/subtasks/${subtaskId}`),
  getSubtasksForTask: (taskId) => api.get(`/subtasks/task/${taskId}`),
};

// Task Instance API
export const taskInstanceAPI = {
  getInstancesForDate: (date) => api.get(`/task-instances/date/${date}`),
  getMonthCounts: (year, month) => api.get(`/task-instances/month-counts/${year}/${month}`),
  toggleTaskComplete: (instanceId) => api.put(`/task-instances/${instanceId}/complete`),
  toggleSubtaskComplete: (instanceId, subtaskId) => api.put(`/task-instances/${instanceId}/subtask/${subtaskId}`),
};

// Admin API
export const adminAPI = {
  getAllUsers: () => api.get('/admin/users'),
  getAdminStats: () => api.get('/admin/stats'),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  createTaskForUser: (taskData) => api.post('/admin/create-task', taskData),
  getWhitelist: () => api.get('/admin/whitelist'),
  addToWhitelist: (email) => api.post('/admin/whitelist', { email }),
  removeFromWhitelist: (id) => api.delete(`/admin/whitelist/${id}`),
  getResetCodes: () => api.get('/admin/reset-codes'),
  generateResetCode: (email) => api.post('/admin/reset-codes', { email }),
  deleteResetCode: (id) => api.delete(`/admin/reset-codes/${id}`),
  getUserTasks: (userId, date) => api.get(`/admin/user-tasks/${userId}/date/${date}`),
  getUserMonthStatus: (userId, year, month) => api.get(`/admin/user-tasks/${userId}/month-status/${year}/${month}`),
};

// Daily Log API (admin only)
export const dailyLogAPI = {
  getLog: (date) => api.get(`/daily-log/${date}`),
  getTeamLogs: (date) => api.get(`/daily-log/team/${date}`),
  updateStation: (date, station) => api.patch(`/daily-log/${date}/station`, { station }),
  updateSummary: (date, data) => api.patch(`/daily-log/${date}/summary`, data),
  addOutreach: (date, data) => api.post(`/daily-log/${date}/outreach`, data),
  deleteOutreach: (date, entryId) => api.delete(`/daily-log/${date}/outreach/${entryId}`),
  // any admin can edit/delete any other admin's outreach entry
  updateOutreach: (date, adminId, entryId, data) => api.patch(`/daily-log/${date}/outreach/${entryId}`, { ...data, adminId }),
  deleteOutreachForAdmin: (date, adminId, entryId) => api.delete(`/daily-log/${date}/outreach/${entryId}?adminId=${adminId}`),
};

// Leads CRM API (admin only)
export const leadsAPI = {
  getAll: (params) => api.get('/leads', { params }),
  getAllAdmins: () => api.get('/leads/all-admins'),
  getPipelineCounts: () => api.get('/leads/pipeline-counts'),
  getById: (id) => api.get(`/leads/${id}`),
  getHistory: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.patch(`/leads/${id}`, data),
  remove: (id) => api.delete(`/leads/${id}`),
  getActivitiesForDate: (date) => api.get(`/leads/activities/date/${date}`),
  addActivity: (leadId, data) => api.post(`/leads/${leadId}/activities`, data),
  deleteActivity: (activityId) => api.delete(`/leads/activities/${activityId}`),
};

// Follow-ups API (admin only)
export const followUpsAPI = {
  getMonthCounts: (year, month) => api.get(`/follow-ups/month/${year}/${month}`),
  getDateDetails: (date) => api.get(`/follow-ups/date/${date}`),
};

export default api;