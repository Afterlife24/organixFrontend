import React from 'react';
import { NavLink } from 'react-router-dom';
import { CheckSquare, Calendar, ClipboardList, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFollowUps } from '../context/FollowUpContext';

const MobileNav = () => {
  const { user } = useAuth();
  const { todayCount } = useFollowUps();

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
          const showBadge = item.to === '/calendar' && user?.isAdmin && todayCount > 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `mobile-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <div className="relative">
                <Icon size={20} className="mb-1" />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {todayCount > 9 ? '9+' : todayCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
