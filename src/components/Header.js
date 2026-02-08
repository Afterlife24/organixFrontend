import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Menu, Sparkles } from 'lucide-react';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 px-4 md:px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors duration-200"
        >
          <Menu size={24} />
        </button>
        
        {/* Logo/Title */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">After Life</h1>
              <p className="text-sm text-gray-500 hidden lg:block">Premium task management</p>
            </div>
          </div>
          
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white" size={16} />
            </div>
            <h1 className="text-xl font-bold gradient-text">After Life</h1>
          </div>
        </div>
        
        {/* User Menu */}
        <div className="flex items-center space-x-3">
          {/* User Info */}
          <div className="hidden sm:flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <User className="text-white" size={16} />
            </div>
            <div className="hidden md:block">
              <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          {/* Mobile User Avatar */}
          <div className="sm:hidden w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
            <User className="text-white" size={16} />
          </div>
          
          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
            title="Logout"
          >
            <LogOut size={18} className="group-hover:rotate-12 transition-transform duration-200" />
            <span className="hidden lg:inline font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;