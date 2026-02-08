import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { taskAPI, subtaskAPI, taskInstanceAPI } from '../services/api';
import { getTodayString, getLocalDateString } from '../utils/dateUtils';
import toast from 'react-hot-toast';

const TaskContext = createContext();

const initialState = {
  tasks: [],
  todayTasks: [],
  staticTasks: [], // New: for date-independent tasks
  taskInstances: [], // New: for date-based task instances
  isLoading: false,
  selectedDate: getTodayString(), // Use local date
};

const taskReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, isLoading: false };
    
    case 'SET_TASK_INSTANCES':
      return { ...state, taskInstances: action.payload, isLoading: false };
    
    case 'UPDATE_TASK_INSTANCE':
      return {
        ...state,
        taskInstances: state.taskInstances.map(instance =>
          instance._id === action.payload._id ? action.payload : instance
        )
      };
    
    case 'SET_STATIC_TASKS':
      return { ...state, staticTasks: action.payload, isLoading: false };
    
    case 'SET_TODAY_TASKS':
      return { ...state, todayTasks: action.payload, isLoading: false };
    
    case 'ADD_TASK':
      const newTask = action.payload;
      const updatedTasks = [newTask, ...state.tasks];
      
      // Add to appropriate list based on whether it has dates
      const hasDate = newTask.startDate && newTask.endDate;
      const updatedTodayTasks = hasDate && isTaskActiveToday(newTask) 
        ? [newTask, ...state.todayTasks] 
        : state.todayTasks;
      const updatedStaticTasks = !hasDate 
        ? [newTask, ...state.staticTasks] 
        : state.staticTasks;
      
      return { 
        ...state, 
        tasks: updatedTasks,
        todayTasks: updatedTodayTasks,
        staticTasks: updatedStaticTasks
      };
    
    case 'UPDATE_TASK':
      const updatedTask = action.payload;
      const updatedAllTasks = state.tasks.map(task => 
        task._id === updatedTask._id ? updatedTask : task
      );
      const updatedTodayTasksList = state.todayTasks.map(task => 
        task._id === updatedTask._id ? updatedTask : task
      );
      const updatedStaticTasksList = state.staticTasks.map(task => 
        task._id === updatedTask._id ? updatedTask : task
      );
      return { 
        ...state, 
        tasks: updatedAllTasks,
        todayTasks: updatedTodayTasksList,
        staticTasks: updatedStaticTasksList
      };
    
    case 'DELETE_TASK':
      return { 
        ...state, 
        tasks: state.tasks.filter(task => task._id !== action.payload),
        todayTasks: state.todayTasks.filter(task => task._id !== action.payload),
        staticTasks: state.staticTasks.filter(task => task._id !== action.payload)
      };
    
    case 'ADD_SUBTASK':
      const taskWithNewSubtask = state.tasks.map(task => {
        if (task._id === action.payload.taskId) {
          return { ...task, subtasks: [...task.subtasks, action.payload] };
        }
        return task;
      });
      const todayTaskWithNewSubtask = state.todayTasks.map(task => {
        if (task._id === action.payload.taskId) {
          return { ...task, subtasks: [...task.subtasks, action.payload] };
        }
        return task;
      });
      const staticTaskWithNewSubtask = state.staticTasks.map(task => {
        if (task._id === action.payload.taskId) {
          return { ...task, subtasks: [...task.subtasks, action.payload] };
        }
        return task;
      });
      return { 
        ...state, 
        tasks: taskWithNewSubtask,
        todayTasks: todayTaskWithNewSubtask,
        staticTasks: staticTaskWithNewSubtask
      };
    
    case 'UPDATE_SUBTASK':
      const tasksWithUpdatedSubtask = state.tasks.map(task => ({
        ...task,
        subtasks: task.subtasks.map(subtask => 
          subtask._id === action.payload._id ? action.payload : subtask
        )
      }));
      const todayTasksWithUpdatedSubtask = state.todayTasks.map(task => ({
        ...task,
        subtasks: task.subtasks.map(subtask => 
          subtask._id === action.payload._id ? action.payload : subtask
        )
      }));
      const staticTasksWithUpdatedSubtask = state.staticTasks.map(task => ({
        ...task,
        subtasks: task.subtasks.map(subtask => 
          subtask._id === action.payload._id ? action.payload : subtask
        )
      }));
      return { 
        ...state, 
        tasks: tasksWithUpdatedSubtask,
        todayTasks: todayTasksWithUpdatedSubtask,
        staticTasks: staticTasksWithUpdatedSubtask
      };
    
    case 'DELETE_SUBTASK':
      const tasksWithoutSubtask = state.tasks.map(task => ({
        ...task,
        subtasks: task.subtasks.filter(subtask => subtask._id !== action.payload)
      }));
      const todayTasksWithoutSubtask = state.todayTasks.map(task => ({
        ...task,
        subtasks: task.subtasks.filter(subtask => subtask._id !== action.payload)
      }));
      const staticTasksWithoutSubtask = state.staticTasks.map(task => ({
        ...task,
        subtasks: task.subtasks.filter(subtask => subtask._id !== action.payload)
      }));
      return { 
        ...state, 
        tasks: tasksWithoutSubtask,
        todayTasks: todayTasksWithoutSubtask,
        staticTasks: staticTasksWithoutSubtask
      };
    
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };
    
    default:
      return state;
  }
};

// Helper function to check if task is active today
const isTaskActiveToday = (task) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(task.startDate);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(task.endDate);
  endDate.setHours(23, 59, 59, 999);
  
  return today >= startDate && today <= endDate;
};

export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Fetch all tasks
  const fetchTasks = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await taskAPI.getAllTasks();
      dispatch({ type: 'SET_TASKS', payload: response.data.tasks });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.error('Failed to fetch tasks');
    }
  };

  // Fetch static tasks
  const fetchStaticTasks = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await taskAPI.getStaticTasks();
      dispatch({ type: 'SET_STATIC_TASKS', payload: response.data.tasks });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.error('Failed to fetch static tasks');
    }
  };

  // Fetch task instances for specific date
  const fetchTaskInstancesForDate = useCallback(async (date) => {
    try {
      console.log('TaskContext: Fetching task instances for date:', date);
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await taskInstanceAPI.getInstancesForDate(date);
      console.log('TaskContext: Successfully fetched task instances:', response.data);
      dispatch({ type: 'SET_TASK_INSTANCES', payload: response.data.taskInstances });
      dispatch({ type: 'SET_SELECTED_DATE', payload: date });
    } catch (error) {
      console.error('TaskContext: Error fetching task instances:', error);
      console.error('TaskContext: Error response:', error.response?.data);
      console.error('TaskContext: Error status:', error.response?.status);
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.error('Failed to fetch task instances for selected date');
    }
  }, []);

  // Toggle task instance completion
  const toggleTaskInstanceComplete = async (instanceId) => {
    try {
      const response = await taskInstanceAPI.toggleTaskComplete(instanceId);
      dispatch({ type: 'UPDATE_TASK_INSTANCE', payload: response.data.taskInstance });
      return { success: true, taskInstance: response.data.taskInstance };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update task';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Toggle subtask instance completion
  const toggleSubtaskInstanceComplete = async (instanceId, subtaskId) => {
    try {
      const response = await taskInstanceAPI.toggleSubtaskComplete(instanceId, subtaskId);
      dispatch({ type: 'UPDATE_TASK_INSTANCE', payload: response.data.taskInstance });
      return { success: true, taskInstance: response.data.taskInstance };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update subtask';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Fetch today's tasks (using task instances)
  const fetchTodayTasks = async () => {
    try {
      const today = getTodayString();
      await fetchTaskInstancesForDate(today);
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.error('Failed to fetch today\'s tasks');
    }
  };

  // Fetch tasks for specific date (using task instances)
  const fetchTasksForDate = async (date) => {
    await fetchTaskInstancesForDate(date);
  };

  // Create task
  const createTask = useCallback(async (taskData) => {
    try {
      const response = await taskAPI.createTask(taskData);
      dispatch({ type: 'ADD_TASK', payload: response.data.task });
      
      // If the task has dates, refresh the current selected date's task instances
      if (taskData.startDate && taskData.endDate) {
        const taskDate = getLocalDateString(new Date(taskData.startDate));
        const currentSelectedDate = state.selectedDate;
        
        // Only refresh if the new task's date matches the currently selected date
        if (taskDate === currentSelectedDate) {
          // Refresh task instances for the current date
          setTimeout(() => {
            fetchTaskInstancesForDate(currentSelectedDate);
          }, 100);
        }
      }
      
      toast.success('Task created successfully');
      return { success: true, task: response.data.task };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create task';
      toast.error(message);
      return { success: false, message };
    }
  }, [state.selectedDate, fetchTaskInstancesForDate]);

  // Update task
  const updateTask = async (taskId, updates) => {
    try {
      const response = await taskAPI.updateTask(taskId, updates);
      dispatch({ type: 'UPDATE_TASK', payload: response.data.task });
      toast.success('Task updated successfully');
      return { success: true, task: response.data.task };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update task';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Update task order
  const updateTaskOrder = useCallback(async (taskId, direction) => {
    try {
      await taskAPI.updateTaskOrder(taskId, direction);
      
      // Refresh the appropriate task list
      const currentSelectedDate = state.selectedDate;
      if (currentSelectedDate) {
        // Refresh task instances for calendar
        fetchTaskInstancesForDate(currentSelectedDate);
      }
      // Also refresh static tasks
      fetchStaticTasks();
      
      toast.success(`Task moved ${direction}`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update task order';
      toast.error(message);
      return { success: false, message };
    }
  }, [state.selectedDate, fetchTaskInstancesForDate, fetchStaticTasks]);

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      await taskAPI.deleteTask(taskId);
      dispatch({ type: 'DELETE_TASK', payload: taskId });
      toast.success('Task deleted successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete task';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Create subtask
  const createSubtask = async (taskId, subtaskData) => {
    try {
      const response = await taskAPI.createSubtask(taskId, subtaskData);
      dispatch({ type: 'ADD_SUBTASK', payload: { ...response.data.subtask, taskId } });
      
      // Refresh task instances if we're viewing a specific date (for calendar view)
      const currentSelectedDate = state.selectedDate;
      if (currentSelectedDate) {
        console.log('TaskContext: Refreshing task instances after subtask creation');
        fetchTaskInstancesForDate(currentSelectedDate);
      }
      
      toast.success('Subtask created successfully');
      return { success: true, subtask: response.data.subtask };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create subtask';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Update subtask
  const updateSubtask = async (subtaskId, updates) => {
    try {
      const response = await subtaskAPI.updateSubtask(subtaskId, updates);
      dispatch({ type: 'UPDATE_SUBTASK', payload: response.data.subtask });
      return { success: true, subtask: response.data.subtask };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update subtask';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Delete subtask
  const deleteSubtask = async (subtaskId) => {
    try {
      await subtaskAPI.deleteSubtask(subtaskId);
      dispatch({ type: 'DELETE_SUBTASK', payload: subtaskId });
      
      // Refresh task instances if we're viewing a specific date (for calendar view)
      const currentSelectedDate = state.selectedDate;
      if (currentSelectedDate) {
        console.log('TaskContext: Refreshing task instances after subtask deletion');
        fetchTaskInstancesForDate(currentSelectedDate);
      }
      
      toast.success('Subtask deleted successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete subtask';
      toast.error(message);
      return { success: false, message };
    }
  };

  const value = {
    ...state,
    fetchTasks,
    fetchTodayTasks,
    fetchStaticTasks,
    fetchTasksForDate,
    fetchTaskInstancesForDate,
    toggleTaskInstanceComplete,
    toggleSubtaskInstanceComplete,
    createTask,
    updateTask,
    updateTaskOrder,
    deleteTask,
    createSubtask,
    updateSubtask,
    deleteSubtask,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};