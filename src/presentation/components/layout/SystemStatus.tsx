import React from 'react';

export const SystemStatus: React.FC = () => {
  return (
    <section className="system-strip">
      <div><strong>Meta: </strong>WhatsApp Cloud API ready</div>
      <div><strong>n8n: </strong>webhook-ready</div>
      <div><strong>Datos: </strong>PostgreSQL / BigQuery</div>
      <div><strong>IA: </strong>Anthropic-ready</div>
    </section>
  );
};