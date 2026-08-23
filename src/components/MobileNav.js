import React from 'react';
import { NavLink } from 'react-router-dom';
import { CheckSquare, Calendar, ClipboardList, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MobileNav = () => {
  const { user } = useAuth();

  // Non-admin: Tasks + Calendar only
  // Admin: Tasks, Log, Calendar, People, Progress — exactly 5, always fits
  const navItems = user?.isAdmin
    ? [
        { to: '/tasks',     icon: CheckSquare,  label: 'Tasks'    },
        { to: '/daily-log', icon: ClipboardList, label: 'Log'      },
        { to: '/calendar',  icon: Calendar,      label: 'Calendar' },
        { to: '/people',    icon: Users,         label: 'People'   },
        { to: '/progress',  icon: BarChart3,     label: 'Progress' },
      ]
    : [
        { to: '/tasks',    icon: CheckSquare, label: 'Tasks'    },
        { to: '/calendar', icon: Calendar,    label: 'Calendar' },
      ];

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
