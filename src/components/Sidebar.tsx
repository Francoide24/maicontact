import React, { useState, useEffect } from 'react';
import { useStore, type ActiveView } from '../state/store';
import { useAuth } from '../application/contexts/AuthContext';
import { can } from '../application/services/rbac';

interface NavItem {
  view: ActiveView;
  icon: string;
  label: string;
  permission?: Parameters<typeof can>[1];
}

const NAV_ITEMS: NavItem[] = [
  { view: 'funnel',    icon: '⬡',  label: 'Embudos',       permission: 'funnels.read' },
  { view: 'chat',      icon: '💬',  label: 'Chat' },
  { view: 'channels',  icon: '📡',  label: 'Canales',       permission: 'channels.manage' },
  { view: 'team',      icon: '👥',  label: 'Equipo',        permission: 'users.read' },
  { view: 'campaigns', icon: '📣',  label: 'Campañas',      permission: 'campaigns.read' },
  { view: 'templates', icon: '📋',  label: 'Plantillas Meta', permission: 'templates.manage' },
  { view: 'settings',  icon: '⚙️', label: 'Configuración', permission: 'settings.manage' },
];

const COLLAPSE_KEY = 'maicontact_sidebar_collapsed';

export const Sidebar: React.FC = () => {
  const { state, dispatch } = useStore();
  const { currentUser, logout } = useAuth();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, String(collapsed)); } catch { /* ignore */ }
  }, [collapsed]);

  const initials = (currentUser?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const visibleItems = NAV_ITEMS.filter((item) =>
    !item.permission || can(currentUser, item.permission)
  );

  return (
    <aside className={`app-sidebar${collapsed ? ' collapsed' : ' expanded'}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        {collapsed ? '›' : '‹'}
      </button>

      <nav className="sidebar-nav">
        {visibleItems.map(({ view, icon, label }) => (
          <button
            key={view}
            className={`sidebar-nav-btn${state.activeView === view ? ' active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', view })}
            title={collapsed ? label : undefined}
          >
            <span className="sidebar-icon" aria-hidden="true">{icon}</span>
            {!collapsed && <span className="sidebar-label">{label}</span>}
            {collapsed && <span className="sidebar-tooltip" role="tooltip">{label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          className="sidebar-avatar-btn"
          title={currentUser?.name ?? 'Usuario'}
          onClick={logout}
        >
          <span className="sidebar-avatar">{initials}</span>
          {!collapsed && (
            <span className="sidebar-avatar-name">{currentUser?.name ?? 'Usuario'}</span>
          )}
        </button>
      </div>
    </aside>
  );
};
