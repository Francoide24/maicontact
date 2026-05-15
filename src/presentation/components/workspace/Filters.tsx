import React from 'react';
import { Box } from '../common/Box';

export const Filters: React.FC = () => {
  return (
    <Box title="Filtros" open={false}>
      <p>Area, estado, prioridad, canal y SLA.</p>
    </Box>
  );
};