import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { useAuth } from '../../application/contexts/AuthContext';
import { can } from '../../application/services/rbac';
import { Modal } from '../../components/Modal';
import type { AppUser } from '../../data/mockData';
import { ALL_PERMISSIONS } from '../../application/services/rbac';

type UserStatus = 'active' | 'inactive';

export const TeamPage: React.FC = () => {
  const { state, dispatch } = useStore();
  const { currentUser } = useAuth();
  const canManage = can(currentUser, 'users.manage');

  const [editingUser, setEditingUser]     = useState<AppUser | null>(null);
  const [showCreateModal, setShowCreate]  = useState(false);
  const [filterStatus, setFilterStatus]   = useState<UserStatus | 'all'>('all');

  const users     = Object.values(state.users);
  const campaigns = Object.values(state.campaigns);
  const pools     = Object.values(state.pools);

  const filtered = users.filter((u) => {
    if (filterStatus === 'active')   return u.isActive;
    if (filterStatus === 'inactive') return !u.isActive;
    return true;
  });

  const roleLabel: Record<AppUser['role'], string> = {
    admin: 'Admin', supervisor: 'Supervisor', agent: 'Agente',
  };

  const handleToggle = (userId: string) => {
    dispatch({ type: 'TOGGLE_USER_STATUS', userId });
  };

  const handleSaveUser = (data: Omit<AppUser, 'id'>) => {
    if (editingUser) {
      dispatch({ type: 'UPDATE_USER', userId: editingUser.id, changes: data });
      setEditingUser(null);
    } else {
      dispatch({ type: 'CREATE_USER', user: data });
      setShowCreate(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Equipo</h1>
          <p className="page-subtitle">{users.length} usuario{users.length !== 1 ? 's' : ''} en el sistema</p>
        </div>
        <div className="page-actions">
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as UserStatus | 'all')}
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          {canManage && (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              + Nuevo usuario
            </button>
          )}
        </div>
      </div>

      {canManage && (
        <div className="info-banner">
          <strong>Provisioning de usuarios:</strong> Los cambios aquí son locales (estado demo).
          Para crear usuarios reales en producción, créalos en Supabase Auth e inserta la fila en{' '}
          <code>public.users</code>. La creación desde esta UI requiere un Worker/Edge Function seguro.{' '}
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="banner-link"
          >
            Ir a Supabase →
          </a>
        </div>
      )}

      <div className="team-table-wrapper">
        <table className="team-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Campañas</th>
              <th>Pools</th>
              <th>Conversaciones max</th>
              {canManage && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className={user.isActive ? '' : 'row-inactive'}>
                <td className="user-name-cell">
                  <div className="user-avatar-sm">{user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div>
                  <span>{user.name}</span>
                </td>
                <td className="text-muted">{user.email}</td>
                <td><span className={`role-badge role-${user.role}`}>{roleLabel[user.role]}</span></td>
                <td>
                  <span className={`status-dot ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="text-muted small">
                  {user.campaignIds.map((cid) => campaigns.find((c) => c.id === cid)?.name ?? cid).join(', ') || '—'}
                </td>
                <td className="text-muted small">
                  {user.poolIds.map((pid) => pools.find((p) => p.id === pid)?.name ?? pid).join(', ') || '—'}
                </td>
                <td className="text-muted">{user.maxOpenConversations}</td>
                {canManage && (
                  <td>
                    <div className="row-actions">
                      <button className="btn-ghost" onClick={() => setEditingUser(user)}>Editar</button>
                      <button
                        className={`btn-ghost ${user.isActive ? 'text-warning' : 'text-success'}`}
                        onClick={() => handleToggle(user.id)}
                      >
                        {user.isActive ? 'Pausar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showCreateModal || editingUser) && (
        <UserModal
          initial={editingUser ?? undefined}
          campaigns={campaigns}
          pools={pools}
          onSave={handleSaveUser}
          onClose={() => { setEditingUser(null); setShowCreate(false); }}
        />
      )}
    </div>
  );
};

// ── UserModal ──────────────────────────────────────────────────────────────────

interface UserModalProps {
  initial?: AppUser;
  campaigns: { id: string; name: string }[];
  pools: { id: string; name: string }[];
  onSave: (data: Omit<AppUser, 'id'>) => void;
  onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ initial, campaigns, pools, onSave, onClose }) => {
  const [name, setName]             = useState(initial?.name ?? '');
  const [email, setEmail]           = useState(initial?.email ?? '');
  const [role, setRole]             = useState<AppUser['role']>(initial?.role ?? 'agent');
  const [maxOpen, setMaxOpen]       = useState(initial?.maxOpenConversations ?? 15);
  const [campaignIds, setCIds]      = useState<string[]>(initial?.campaignIds ?? []);
  const [poolIds, setPIds]          = useState<string[]>(initial?.poolIds ?? []);
  const [permissions, setPerms]     = useState<string[]>(initial?.permissions ?? []);

  const toggleCampaign = (id: string) =>
    setCIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const togglePool = (id: string) =>
    setPIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleRoleChange = (r: AppUser['role']) => {
    setRole(r);
    if (r === 'admin') setPerms([...ALL_PERMISSIONS]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSave({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      permissions: permissions as typeof ALL_PERMISSIONS[number][],
      isActive: initial?.isActive ?? true,
      campaignIds,
      poolIds,
      maxOpenConversations: maxOpen,
    });
  };

  return (
    <Modal title={initial ? 'Editar usuario' : 'Nuevo usuario'} onClose={onClose}>
      <form className="user-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="modal-field">
            <label>Nombre completo</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: María González" required />
          </div>
          <div className="modal-field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@maihue.cl" required />
          </div>
        </div>

        <div className="form-row">
          <div className="modal-field">
            <label>Rol</label>
            <select value={role} onChange={(e) => handleRoleChange(e.target.value as AppUser['role'])}>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="agent">Agente</option>
            </select>
          </div>
          <div className="modal-field">
            <label>Conversaciones máx.</label>
            <input type="number" min={1} max={999} value={maxOpen} onChange={(e) => setMaxOpen(Number(e.target.value))} />
          </div>
        </div>

        <div className="modal-field">
          <label>Campañas asignadas</label>
          <div className="checkbox-group">
            {campaigns.map((c) => (
              <label key={c.id} className="checkbox-item">
                <input type="checkbox" checked={campaignIds.includes(c.id)} onChange={() => toggleCampaign(c.id)} />
                {c.name}
              </label>
            ))}
            {campaigns.length === 0 && <span className="text-muted small">Sin campañas creadas</span>}
          </div>
        </div>

        <div className="modal-field">
          <label>Pools asignados</label>
          <div className="checkbox-group">
            {pools.map((p) => (
              <label key={p.id} className="checkbox-item">
                <input type="checkbox" checked={poolIds.includes(p.id)} onChange={() => togglePool(p.id)} />
                {p.name}
              </label>
            ))}
            {pools.length === 0 && <span className="text-muted small">Sin pools creados</span>}
          </div>
        </div>

        <details className="permissions-details">
          <summary>Permisos efectivos ({permissions.length}/{ALL_PERMISSIONS.length})</summary>
          <div className="permissions-grid">
            {ALL_PERMISSIONS.map((p) => (
              <label key={p} className="checkbox-item small">
                <input
                  type="checkbox"
                  checked={permissions.includes(p)}
                  onChange={() => setPerms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
                />
                {p}
              </label>
            ))}
          </div>
        </details>

        <div className="modal-actions">
          <button type="button" className="modal-btn secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="modal-btn primary">{initial ? 'Guardar cambios' : 'Crear usuario'}</button>
        </div>
      </form>
    </Modal>
  );
};
