import React from 'react';
import { Box } from '../common/Box';

export const TagsPanel: React.FC = () => {
  return (
    <Box title="Etiquetas">
      <div className="tag-grid">
        <span className="badge accent">ventas</span>
        <span className="badge accent">lead-hogar</span>
        <button className="ghost">+ Crear etiqueta</button>
      </div>
    </Box>
  );
};