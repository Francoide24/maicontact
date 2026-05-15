import React from 'react';
import { Box } from '../common/Box';
import { AREAS } from '../../../shared/constants/areas';

export const DerivationPanel: React.FC = () => {
  return (
    <Box title="Derivacion y asignacion">
      <div className="field-stack">
        <select>
          {AREAS.map(area => (
            <option key={area}>{area}</option>
          ))}
        </select>
        <button className="secondary">Derivar a area</button>
        <button className="primary">Asignar con estrategia del area</button>
        <button className="danger">Cerrar conversacion</button>
      </div>
    </Box>
  );
};