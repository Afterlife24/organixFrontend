import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Plus, CheckSquare, X, Sparkles, TrendingUp, Users, Shield, Key, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ onClose }) => {
  const { user } = useAuth();

  const navItems = [
    {
      to: '/tasks',
      icon: CheckSquare,
      label: 'Tasks',
      description: 'Static tasks',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      to: '/calendar',
      icon: Calendar,
      label: 'Calendar',
      description: 'Date-based tasks',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  // Add Create Task tab only for admin users
  if (user?.isAdmin) {
    navItems.push({
      to: '/create-task',
      icon: Plus,
      label: 'Create Task',
      description: 'Add new task',
      color: 'from-green-500 to-emerald-500'
    });
  }

  // Add People tab for admin users
  if (user?.isAdmin) {
    navItems.push({
      to: '/people',
      icon: Users,
      label: 'People',
      description: 'Assign tasks',
      color: 'from-red-500 to-orange-500'
    });
  }

  // Add Whitelist tab for admin users
  if (user?.isAdmin) {
    navItems.push({
      to: '/whitelist',
      icon: Shield,
      label: 'Whitelist',
      description: 'Manage access',
      color: 'from-indigo-500 to-purple-500'
    });
  }

  // Add Reset Codes tab for admin users
  if (user?.isAdmin) {
    navItems.push({
      to: '/reset-codes',
      icon: Key,
      label: 'Reset Codes',
      description: 'Password recovery',
      color: 'from-yellow-500 to-orange-500'
    });
  }

  // Add Progress tab for admin users
  if (user?.isAdmin) {
    navItems.push({
      to: '/progress',
      icon: BarChart3,
      label: 'Progress',
      description: 'Monitor users',
      color: 'from-cyan-500 to-blue-500'
    });
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-6 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse-glow">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <span className="text-xl font-bold gradient-text">After Life</span>
              <div className="flex items-center space-x-1 mt-1">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-xs text-gray-500 font-medium">Premium</span>
              </div>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''} group`
                }
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-10 h-10 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center mr-4 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110`}>
                  <Icon size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors">
                    {item.description}
                  </div>
                </div>
              </NavLink>
            );
          })}
        </nav>
      </div>
      
      {/* Footer - Fixed */}
      <div className="flex-shrink-0 p-4 border-t border-white/20">
        <div className="text-center">
          <div className="text-xs text-gray-500">
            Built with ❤️ AfterLife
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Version 2.0 Platinum
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;