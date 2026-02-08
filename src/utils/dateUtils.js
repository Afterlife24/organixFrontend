// Utility functions for handling dates in local timezone

/**
 * Get local date string in YYYY-MM-DD format without timezone conversion
 * @param {Date} date - The date object
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date string in local timezone
 * @returns {string} - Today's date in YYYY-MM-DD format
 */
export const getTodayString = () => {
  return getLocalDateString(new Date());
};

/**
 * Create a Date object from YYYY-MM-DD string in local timezone
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} - Date object in local timezone
 */
export const createLocalDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Check if two dates are the same day (ignoring time)
 * @param {Date} date1 
 * @param {Date} date2 
 * @returns {boolean}
 */
export const isSameDay = (date1, date2) => {
  return getLocalDateString(date1) === getLocalDateString(date2);
};

/**
 * Check if a date is today
 * @param {Date} date 
 * @returns {boolean}
 */
export const isToday = (date) => {
  return isSameDay(date, new Date());
};

/**
 * Format date for display
 * @param {Date|string} date 
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string}
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? createLocalDate(date) : new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    });
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return '';
  }
};

/**
 * Format date for short display
 * @param {Date|string} date 
 * @returns {string}
 */
export const formatDateShort = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? createLocalDate(date) : new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return '';
  }
};

/**
 * Get month name
 * @param {Date} date 
 * @returns {string}
 */
export const getMonthName = (date) => {
  return date.toLocaleDateString('en-US', { month: 'long' });
};

/**
 * Get year
 * @param {Date} date 
 * @returns {number}
 */
export const getYear = (date) => {
  return date.getFullYear();
};

/**
 * Generate calendar days for a given month
 * @param {Date} date - Any date in the target month
 * @returns {Array} - Array of date objects representing the calendar grid
 */
export const generateCalendarDays = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  
  // Start from the Sunday before the first day of the month
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  // End on the Saturday after the last day of the month
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
  
  const days = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
};

/**
 * Check if a date is in the current month
 * @param {Date} date 
 * @param {Date} monthDate 
 * @returns {boolean}
 */
export const isInCurrentMonth = (date, monthDate) => {
  return date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear();
};