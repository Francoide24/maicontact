import React, { useState } from 'react';
import { useAuth } from '../../application/contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="shell" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p className="eyebrow">MAIHUE - PLATAFORMA OPERACIONAL</p>
          <h1>Iniciar Sesión</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="field-stack">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={loading}
              style={{ padding: '0.75rem' }}
            />
          </div>

          <div className="field-stack">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              style={{ padding: '0.75rem' }}
            />
          </div>

          {error && (
            <div style={{ color: 'red', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary"
            disabled={loading}
            style={{ padding: '0.75rem', marginTop: '1rem' }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>
          <p>Usuarios de demostración:</p>
          <p>admin@maihue.cl (Admin)</p>
          <p>supervisor@maihue.cl (Supervisor)</p>
          <p>agente@maihue.cl (Agente)</p>
        </div>
      </div>
    </main>
  );
};