import React from 'react';
import { Box } from '../common/Box';

export const IntegrationsPanel: React.FC = () => {
  return (
    <Box title="Integraciones" open={false}>
      <p>Meta, n8n, PostgreSQL, BigQuery y Anthropic.</p>
    </Box>
  );
};