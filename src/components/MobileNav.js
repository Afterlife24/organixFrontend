import React from 'react';
import { NavLink } from 'react-router-dom';
import { CheckSquare, Calendar, Plus, Users, Shield, Key, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MobileNav = () => {
  const { user } = useAuth();

  const navItems = [
    {
      to: '/tasks',
      icon: CheckSquare,
      label: 'Tasks'
    },
    {
      to: '/calendar',
      icon: Calendar,
      label: 'Calendar'
    }
  ];

  // Add Create Task for admin users only
  if (user?.isAdmin) {
    navItems.push({
      to: '/create-task',
      icon: Plus,
      label: 'Create'
    });
  }

  // Add People for admin users only
  if (user?.isAdmin) {
    navItems.push({
      to: '/people',
      icon: Users,
      label: 'People'
    });
  }

  // Add Whitelist for admin users only
  if (user?.isAdmin) {
    navItems.push({
      to: '/whitelist',
      icon: Shield,
      label: 'Whitelist'
    });
  }

  // Add Reset Codes for admin users only
  if (user?.isAdmin) {
    navItems.push({
      to: '/reset-codes',
      icon: Key,
      label: 'Reset'
    });
  }

  // Add Progress for admin users only
  if (user?.isAdmin) {
    navItems.push({
      to: '/progress',
      icon: BarChart3,
      label: 'Progress'
    });
  }

  return (
    <nav className="mobile-nav">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `mobile-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;