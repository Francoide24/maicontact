import React, { useState } from 'react';
import { Box } from '../common/Box';
import { useApp } from '../../../application/contexts/AppContext';
import { useAuth } from '../../../application/contexts/AuthContext';

export const DerivationPanel: React.FC = () => {
  const { userProfile } = useAuth();
  const { 
    selectedConversation, 
    areas, 
    assignConversation, 
    updateConversationStatus 
  } = useApp();
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [loading, setLoading] = useState(false);

  const canAssign = userProfile?.role === 'admin' || userProfile?.role === 'supervisor';
  const canClose = selectedConversation && 
    (userProfile?.role === 'admin' || selectedConversation.current_assignee_id === userProfile?.id);

  const handleAreaAssignment = async () => {
    if (!selectedConversation || !selectedAreaId || loading) return;

    setLoading(true);
    try {
      await assignConversation(selectedConversation.id, undefined, selectedAreaId);
      setSelectedAreaId('');
    } catch (error) {
      console.error('Error assigning to area:', error);
      alert('Error al derivar conversación');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssignment = async () => {
    if (!selectedConversation || !selectedAreaId || loading) return;

    setLoading(true);
    try {
      // Por ahora, asignación simple. En producción, implementar estrategia de área
      await assignConversation(selectedConversation.id, undefined, selectedAreaId);
      setSelectedAreaId('');
    } catch (error) {
      console.error('Error auto-assigning:', error);
      alert('Error en asignación automática');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation || loading) return;

    if (confirm('¿Estás seguro de que quieres cerrar esta conversación?')) {
      setLoading(true);
      try {
        await updateConversationStatus(selectedConversation.id, 'closed');
      } catch (error) {
        console.error('Error closing conversation:', error);
        alert('Error al cerrar conversación');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!selectedConversation) {
    return (
      <Box title="Derivacion y asignacion">
        <p style={{ opacity: 0.7, textAlign: 'center' }}>
          Selecciona una conversación
        </p>
      </Box>
    );
  }

  return (
    <Box title="Derivacion y asignacion">
      <div className="field-stack">
        <select 
          value={selectedAreaId} 
          onChange={(e) => setSelectedAreaId(e.target.value)}
          disabled={loading || !canAssign}
        >
          <option value="">Seleccionar área...</option>
          {areas.map(area => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
        
        <button 
          className="secondary" 
          onClick={handleAreaAssignment}
          disabled={loading || !selectedAreaId || !canAssign}
        >
          Derivar a área
        </button>
        
        <button 
          className="primary" 
          onClick={handleAutoAssignment}
          disabled={loading || !selectedAreaId || !canAssign}
        >
          Asignar con estrategia del área
        </button>
        
        <button 
          className="danger" 
          onClick={handleCloseConversation}
          disabled={loading || !canClose}
        >
          Cerrar conversación
        </button>

        {!canAssign && (
          <small style={{ opacity: 0.7, fontSize: '0.75rem' }}>
            Solo supervisores y admins pueden derivar conversaciones
          </small>
        )}
      </div>
    </Box>
  );
};