import React from 'react';
import { useStore, type ActiveView } from '../state/store';
import { useAuth } from '../application/contexts/AuthContext';

interface NavItem {
  view: ActiveView;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'funnel', icon: '📊', label: 'Funnel' },
  { view: 'chat', icon: '💬', label: 'Chat' },
  { view: 'channels', icon: '📡', label: 'Canales' },
  { view: 'team', icon: '👥', label: 'Equipo' },
  { view: 'settings', icon: '⚙', label: 'Configuración' },
];

export const Sidebar: React.FC = () => {
  const { state, dispatch } = useStore();
  const { userProfile } = useAuth();

  const initials = (userProfile?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="app-sidebar">
      {NAV_ITEMS.map(({ view, icon, label }) => (
        <button
          key={view}
          className={`sidebar-nav-btn${state.activeView === view ? ' active' : ''}`}
          onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', view })}
          title={label}
        >
          {icon}
          <span className="sidebar-tooltip">{label}</span>
        </button>
      ))}
      <div className="sidebar-spacer" />
      <div className="sidebar-avatar" title={userProfile?.name ?? 'Usuario'}>
        {initials}
      </div>
    </aside>
  );
};
