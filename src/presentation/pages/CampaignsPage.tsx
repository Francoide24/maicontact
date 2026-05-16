import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { useAuth } from '../../application/contexts/AuthContext';
import { useDbActions } from '../../components/DataLoader';
import { can } from '../../application/services/rbac';
import { Modal } from '../../components/Modal';
import type { Campaign, Pool } from '../../data/mockData';

type Tab = 'campaigns' | 'pools';

const CHANNEL_TYPES = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'webchat', label: 'Webchat' },
  { value: 'email', label: 'Email' },
];

export const CampaignsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('campaigns');
  const { currentUser } = useAuth();
  const canManageCampaigns = can(currentUser, 'campaigns.manage');
  const canManagePools     = can(currentUser, 'pools.manage');

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Campañas y Pools</h1>
          <p className="page-subtitle">Administra campañas y pools de ejecutivos</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${activeTab === 'campaigns' ? ' active' : ''}`} onClick={() => setActiveTab('campaigns')}>
          Campañas
        </button>
        <button className={`tab-btn${activeTab === 'pools' ? ' active' : ''}`} onClick={() => setActiveTab('pools')}>
          Pools de ejecutivos
        </button>
      </div>

      {activeTab === 'campaigns' && <CampaignsTab canManage={canManageCampaigns} />}
      {activeTab === 'pools'     && <PoolsTab canManage={canManagePools} />}
    </div>
  );
};

// ── Campaigns Tab ─────────────────────────────────────────────────────────────

const CampaignsTab: React.FC<{ canManage: boolean }> = ({ canManage }) => {
  const { state } = useStore();
  const db = useDbActions();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing]       = useState<Campaign | null>(null);

  const campaigns = Object.values(state.campaigns);
  const funnels   = Object.values(state.funnels);
  const pools     = Object.values(state.pools);
  const users     = Object.values(state.users).filter((u) => u.isActive);

  const handleSave = async (data: Omit<Campaign, 'id'>) => {
    if (editing) {
      await db.updateCampaign(editing.id, data);
      setEditing(null);
    } else {
      await db.createCampaign(data);
      setShowCreate(false);
    }
  };

  return (
    <>
      <div className="section-toolbar">
        {canManage && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Nueva campaña</button>
        )}
      </div>

      <div className="card-grid">
        {campaigns.map((c) => {
          const directUsers = c.userIds?.map((uid) => users.find((u) => u.id === uid)).filter(Boolean) ?? [];
          const campaignPools = c.poolIds.map((pid) => pools.find((p) => p.id === pid)).filter(Boolean);

          return (
            <div key={c.id} className={`campaign-card${c.active ? '' : ' inactive'}`}>
              <div className="campaign-card-header">
                <h3>{c.name}</h3>
                <span className={`status-dot ${c.active ? 'status-active' : 'status-inactive'}`}>
                  {c.active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <p className="text-muted small">
                Embudo: {funnels.find((f) => f.id === c.funnelId)?.name ?? '—'}
              </p>

              {/* Canales */}
              {c.channels?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <p className="pool-users-label">Canales</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {c.channels.map((ch) => {
                      const [type, id] = ch.split(':');
                      return (
                        <span key={ch} className="label-chip" style={{ fontSize: 11 }}>
                          {type}{id ? `: ${id}` : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pools */}
              {campaignPools.length > 0 && (
                <p className="text-muted small" style={{ marginTop: 6 }}>
                  Pools: {campaignPools.map((p) => p!.name).join(', ')}
                </p>
              )}

              {/* Ejecutivos directos */}
              {directUsers.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <p className="pool-users-label">Ejecutivos directos</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {directUsers.map((u) => u && (
                      <span key={u.id} className="tag-chip" style={{ fontSize: 11 }}>{u.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {canManage && (
                <button className="btn-ghost mt-8" onClick={() => setEditing(c)}>Editar</button>
              )}
            </div>
          );
        })}
        {campaigns.length === 0 && (
          <p className="text-muted">No hay campañas creadas.</p>
        )}
      </div>

      {(showCreate || editing) && (
        <CampaignModal
          initial={editing ?? undefined}
          funnels={funnels}
          pools={pools}
          users={users}
          onSave={handleSave}
          onClose={() => { setEditing(null); setShowCreate(false); }}
        />
      )}
    </>
  );
};

interface CampaignModalProps {
  initial?: Campaign;
  funnels: { id: string; name: string }[];
  pools:   { id: string; name: string }[];
  users:   { id: string; name: string; role: string }[];
  onSave:  (data: Omit<Campaign, 'id'>) => Promise<void>;
  onClose: () => void;
}

const CampaignModal: React.FC<CampaignModalProps> = ({ initial, funnels, pools, users, onSave, onClose }) => {
  const [name, setName]         = useState(initial?.name ?? '');
  const [funnelId, setFunnel]   = useState(initial?.funnelId ?? '');
  const [poolIds, setPools]     = useState<string[]>(initial?.poolIds ?? []);
  const [userIds, setUserIds]   = useState<string[]>(initial?.userIds ?? []);
  const [active, setActive]     = useState(initial?.active ?? true);
  const [channels, setChannels] = useState<string[]>(initial?.channels ?? []);
  const [newChType, setNewChType] = useState('whatsapp');
  const [newChId, setNewChId]   = useState('');
  const [saving, setSaving]     = useState(false);

  const togglePool = (id: string) =>
    setPools((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleUser = (id: string) =>
    setUserIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const addChannel = () => {
    const ch = newChId.trim() ? `${newChType}:${newChId.trim()}` : newChType;
    if (!channels.includes(ch)) setChannels((prev) => [...prev, ch]);
    setNewChId('');
  };

  const removeChannel = (ch: string) => setChannels((prev) => prev.filter((c) => c !== ch));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      funnelId: funnelId || null,
      stageIds: initial?.stageIds ?? [],
      poolIds,
      userIds,
      channels,
      active,
    });
    setSaving(false);
  };

  const agentUsers = users.filter((u) => u.role !== 'admin');

  return (
    <Modal title={initial ? 'Editar campaña' : 'Nueva campaña'} onClose={onClose}>
      <form className="user-form" onSubmit={handleSubmit}>
        <div className="modal-field">
          <label>Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Bienvenida Empresa" required autoFocus disabled={saving} />
        </div>
        <div className="modal-field">
          <label>Embudo asociado</label>
          <select value={funnelId} onChange={(e) => setFunnel(e.target.value)} disabled={saving}>
            <option value="">Sin embudo</option>
            {funnels.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        {/* Canales */}
        <div className="modal-field">
          <label>Canales</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {channels.map((ch) => (
              <span key={ch} className="label-chip" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {ch}
                {!saving && (
                  <button type="button" onClick={() => removeChannel(ch)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>✕</button>
                )}
              </span>
            ))}
            {channels.length === 0 && <span className="text-muted small">Sin canales configurados</span>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <select value={newChType} onChange={(e) => setNewChType(e.target.value)} disabled={saving} style={{ flex: '0 0 auto' }}>
              {CHANNEL_TYPES.map((ct) => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
            </select>
            <input
              placeholder="+56912345678 / usuario_ig"
              value={newChId}
              onChange={(e) => setNewChId(e.target.value)}
              disabled={saving}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChannel(); } }}
            />
            <button type="button" className="btn btn-secondary" onClick={addChannel} disabled={saving}>+</button>
          </div>
        </div>

        {/* Pools */}
        <div className="modal-field">
          <label>Pools de ejecutivos</label>
          <div className="checkbox-group">
            {pools.map((p) => (
              <label key={p.id} className="checkbox-item">
                <input type="checkbox" checked={poolIds.includes(p.id)} onChange={() => togglePool(p.id)} disabled={saving} />
                {p.name}
              </label>
            ))}
            {pools.length === 0 && <span className="text-muted small">Sin pools creados</span>}
          </div>
        </div>

        {/* Ejecutivos directos */}
        <div className="modal-field">
          <label>Ejecutivos directos</label>
          <div className="checkbox-group">
            {agentUsers.map((u) => (
              <label key={u.id} className="checkbox-item">
                <input type="checkbox" checked={userIds.includes(u.id)} onChange={() => toggleUser(u.id)} disabled={saving} />
                {u.name}
              </label>
            ))}
            {agentUsers.length === 0 && <span className="text-muted small">Sin ejecutivos disponibles</span>}
          </div>
        </div>

        <div className="modal-field">
          <label className="checkbox-item">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} disabled={saving} />
            Campaña activa
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="modal-btn secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="modal-btn primary" disabled={saving}>{saving ? 'Guardando…' : initial ? 'Guardar' : 'Crear'}</button>
        </div>
      </form>
    </Modal>
  );
};

// ── Pools Tab ─────────────────────────────────────────────────────────────────

const PoolsTab: React.FC<{ canManage: boolean }> = ({ canManage }) => {
  const { state } = useStore();
  const db = useDbActions();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing]       = useState<Pool | null>(null);

  const pools    = Object.values(state.pools);
  const users    = Object.values(state.users);
  const campaigns = Object.values(state.campaigns);

  const handleSave = async (data: Omit<Pool, 'id'>) => {
    if (editing) {
      await db.updatePool(editing.id, data);
      setEditing(null);
    } else {
      await db.createPool(data);
      setShowCreate(false);
    }
  };

  const strategyLabel: Record<Pool['strategy'], string> = {
    round_robin:   'Round Robin',
    least_loaded:  'Menos cargado',
    manual:        'Manual',
  };

  return (
    <>
      <div className="section-toolbar">
        {canManage && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Nuevo pool</button>
        )}
      </div>

      <div className="card-grid">
        {pools.map((pool) => {
          const poolUsers = pool.userIds.map((uid) => users.find((u) => u.id === uid)).filter(Boolean);
          const nonPoolUsers = users.filter((u) => !pool.userIds.includes(u.id) && u.isActive && u.role !== 'admin');

          return (
            <div key={pool.id} className="campaign-card pool-card">
              <div className="campaign-card-header">
                <h3>{pool.name}</h3>
                <span className="tag-chip">{strategyLabel[pool.strategy]}</span>
              </div>
              <p className="text-muted small">
                Campañas: {pool.campaignIds.map((cid) => campaigns.find((c) => c.id === cid)?.name ?? cid).join(', ') || '—'}
              </p>
              <p className="text-muted small">Máx. por agente: {pool.maxOpenPerUser}</p>

              <div className="pool-users">
                <p className="pool-users-label">Ejecutivos ({poolUsers.length})</p>
                {poolUsers.map((u) => u && (
                  <div key={u.id} className="pool-user-row">
                    <div className="user-avatar-sm">{u.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div>
                    <span>{u.name}</span>
                    {canManage && (
                      <button className="btn-ghost text-danger small" onClick={() => db.removeUserFromPool(pool.id, u.id)}>✕</button>
                    )}
                  </div>
                ))}
                {canManage && nonPoolUsers.length > 0 && (
                  <select
                    className="filter-select mt-8"
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) { db.addUserToPool(pool.id, e.target.value); e.target.value = ''; } }}
                  >
                    <option value="">+ Agregar ejecutivo…</option>
                    {nonPoolUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                )}
              </div>

              {canManage && (
                <button className="btn-ghost mt-8" onClick={() => setEditing(pool)}>Editar pool</button>
              )}
            </div>
          );
        })}
        {pools.length === 0 && <p className="text-muted">No hay pools creados.</p>}
      </div>

      {(showCreate || editing) && (
        <PoolModal
          initial={editing ?? undefined}
          campaigns={campaigns}
          onSave={handleSave}
          onClose={() => { setEditing(null); setShowCreate(false); }}
        />
      )}
    </>
  );
};

interface PoolModalProps {
  initial?: Pool;
  campaigns: { id: string; name: string }[];
  onSave: (data: Omit<Pool, 'id'>) => Promise<void>;
  onClose: () => void;
}

const PoolModal: React.FC<PoolModalProps> = ({ initial, campaigns, onSave, onClose }) => {
  const [name, setName]             = useState(initial?.name ?? '');
  const [strategy, setStrategy]     = useState<Pool['strategy']>(initial?.strategy ?? 'round_robin');
  const [maxOpen, setMaxOpen]       = useState(initial?.maxOpenPerUser ?? 15);
  const [campaignIds, setCIds]      = useState<string[]>(initial?.campaignIds ?? []);
  const [saving, setSaving]         = useState(false);

  const toggleCampaign = (id: string) =>
    setCIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), userIds: initial?.userIds ?? [], campaignIds, strategy, maxOpenPerUser: maxOpen });
    setSaving(false);
  };

  return (
    <Modal title={initial ? 'Editar pool' : 'Nuevo pool'} onClose={onClose}>
      <form className="user-form" onSubmit={handleSubmit}>
        <div className="modal-field">
          <label>Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: SAC Empresas" required autoFocus disabled={saving} />
        </div>
        <div className="form-row">
          <div className="modal-field">
            <label>Estrategia</label>
            <select value={strategy} onChange={(e) => setStrategy(e.target.value as Pool['strategy'])} disabled={saving}>
              <option value="round_robin">Round Robin</option>
              <option value="least_loaded">Menos cargado</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div className="modal-field">
            <label>Máx. conv. por agente</label>
            <input type="number" min={1} max={999} value={maxOpen} onChange={(e) => setMaxOpen(Number(e.target.value))} disabled={saving} />
          </div>
        </div>
        <div className="modal-field">
          <label>Campañas asociadas</label>
          <div className="checkbox-group">
            {campaigns.map((c) => (
              <label key={c.id} className="checkbox-item">
                <input type="checkbox" checked={campaignIds.includes(c.id)} onChange={() => toggleCampaign(c.id)} disabled={saving} />
                {c.name}
              </label>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="modal-btn secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="modal-btn primary" disabled={saving}>{saving ? 'Guardando…' : initial ? 'Guardar' : 'Crear'}</button>
        </div>
      </form>
    </Modal>
  );
};
