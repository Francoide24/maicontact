import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { useAuth } from '../../application/contexts/AuthContext';
import { useDbActions, type CreateUserInput } from '../../components/DataLoader';
import { can } from '../../application/services/rbac';
import { Modal } from '../../components/Modal';
import type { AppUser } from '../../data/mockData';
import { ALL_PERMISSIONS } from '../../application/services/rbac';

type UserStatus = 'active' | 'inactive' | 'all';

export const TeamPage: React.FC = () => {
  const { state }       = useStore();
  const { currentUser } = useAuth();
  const db              = useDbActions();
  const canManage       = can(currentUser, 'users.manage');

  const [editingUser, setEditingUser]    = useState<AppUser | null>(null);
  const [showCreateModal, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus]  = useState<UserStatus>('all');
  const [actionError, setActionError]    = useState<string | null>(null);

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

  const handleToggle = async (user: AppUser) => {
    setActionError(null);
    try {
      await db.toggleUserStatus(user.id, user.isActive);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Error al cambiar estado');
    }
  };

  const handleSaveUser = async (data: Omit<AppUser, 'id'> & { password?: string }) => {
    setActionError(null);
    try {
      if (editingUser) {
        await db.updateUser(editingUser.id, {
          name: data.name,
          role: data.role,
        });
        setEditingUser(null);
      } else {
        const input: CreateUserInput = {
          email: data.email,
          name: data.name,
          role: data.role,
          password: data.password,
          campaignIds: data.campaignIds,
          poolIds: data.poolIds,
          maxOpenConversations: data.maxOpenConversations,
        };
        await db.createUser(input);
        setShowCreate(false);
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Error al guardar usuario');
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
            onChange={(e) => setFilterStatus(e.target.value as UserStatus)}
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

      {actionError && (
        <div className="login-error" role="alert" style={{ marginBottom: 0 }}>
          {actionError}
          <button
            onClick={() => setActionError(null)}
            style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >✕</button>
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
              {canManage && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className={user.isActive ? '' : 'row-inactive'}>
                <td className="user-name-cell">
                  <div className="user-avatar-sm">
                    {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
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
                {canManage && (
                  <td>
                    <div className="row-actions">
                      <button className="btn-ghost" onClick={() => setEditingUser(user)}>Editar</button>
                      <button
                        className={`btn-ghost ${user.isActive ? 'text-warning' : 'text-success'}`}
                        onClick={() => handleToggle(user)}
                      >
                        {user.isActive ? 'Pausar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={canManage ? 7 : 6} style={{ textAlign: 'center', opacity: 0.5, padding: '24px' }}>Sin usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(showCreateModal || editingUser) && (
        <UserModal
          initial={editingUser ?? undefined}
          campaigns={campaigns}
          pools={pools}
          onSave={handleSaveUser}
          onClose={() => { setEditingUser(null); setShowCreate(false); setActionError(null); }}
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
  onSave: (data: Omit<AppUser, 'id'> & { password?: string }) => Promise<void>;
  onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ initial, campaigns, pools, onSave, onClose }) => {
  const [name, setName]           = useState(initial?.name ?? '');
  const [email, setEmail]         = useState(initial?.email ?? '');
  const [password, setPassword]   = useState('');
  const [role, setRole]           = useState<AppUser['role']>(initial?.role ?? 'agent');
  const [maxOpen, setMaxOpen]     = useState(initial?.maxOpenConversations ?? 15);
  const [campaignIds, setCIds]    = useState<string[]>(initial?.campaignIds ?? []);
  const [poolIds, setPIds]        = useState<string[]>(initial?.poolIds ?? []);
  const [saving, setSaving]       = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const isEditing = Boolean(initial);

  const toggleArr = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    if (!isEditing && !password.trim()) {
      setModalError('La contraseña es requerida para nuevos usuarios');
      return;
    }
    setModalError(null);
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        permissions: ALL_PERMISSIONS.filter(() => true), // will be derived by server
        isActive: initial?.isActive ?? true,
        campaignIds,
        poolIds,
        maxOpenConversations: maxOpen,
        ...(password ? { password } : {}),
      });
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Error desconocido');
      setSaving(false);
    }
  };

  return (
    <Modal title={isEditing ? 'Editar usuario' : 'Nuevo usuario'} onClose={onClose}>
      <form className="user-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="modal-field">
            <label>Nombre completo</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: María González"
              required
              disabled={saving}
            />
          </div>
          <div className="modal-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maria@maihue.cl"
              required
              disabled={isEditing || saving}
            />
          </div>
        </div>

        {!isEditing && (
          <div className="modal-field">
            <label>Contraseña inicial</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              disabled={saving}
              autoComplete="new-password"
            />
          </div>
        )}

        <div className="form-row">
          <div className="modal-field">
            <label>Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value as AppUser['role'])} disabled={saving}>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="agent">Agente</option>
            </select>
          </div>
          <div className="modal-field">
            <label>Conversaciones máx.</label>
            <input
              type="number"
              min={1}
              max={999}
              value={maxOpen}
              onChange={(e) => setMaxOpen(Number(e.target.value))}
              disabled={saving}
            />
          </div>
        </div>

        <div className="modal-field">
          <label>Campañas asignadas</label>
          <div className="checkbox-group">
            {campaigns.map((c) => (
              <label key={c.id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={campaignIds.includes(c.id)}
                  onChange={() => setCIds(toggleArr(campaignIds, c.id))}
                  disabled={saving}
                />
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
                <input
                  type="checkbox"
                  checked={poolIds.includes(p.id)}
                  onChange={() => setPIds(toggleArr(poolIds, p.id))}
                  disabled={saving}
                />
                {p.name}
              </label>
            ))}
            {pools.length === 0 && <span className="text-muted small">Sin pools creados</span>}
          </div>
        </div>

        {modalError && (
          <p className="login-error" role="alert">{modalError}</p>
        )}

        <div className="modal-actions">
          <button type="button" className="modal-btn secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="modal-btn primary" disabled={saving}>
            {saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
