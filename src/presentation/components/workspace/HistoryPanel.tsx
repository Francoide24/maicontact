import React from 'react';
import { Box } from '../common/Box';

export const HistoryPanel: React.FC = () => {
  return (
    <Box title="Historial y auditoria" open={false}>
      <ul>
        <li>Webhook recibido desde WhatsApp.</li>
        <li>Clasificacion enviada a n8n.</li>
        <li>Asignacion registrada en audit_logs.</li>
      </ul>
    </Box>
  );
};