import React from 'react';

const areas = ['Leads Hogar', 'SAC', 'Retencion', 'Empresas y Horeca'];
const conversations = [
  ['Lead Web Hogar', 'WhatsApp', areas[0], 'Admin Maihue', 'media'],
  ['Maria Gonzalez', 'WhatsApp', areas[0], 'Carla Ventas', 'alta'],
  ['Jorge Perez', 'Webchat', areas[1], 'Diego SAC', 'media'],
  ['Cafe Alameda', 'Instagram', areas[3], 'sin asignar', 'alta']
];

const box = (title: string, body: React.ReactNode, open = true) => React.createElement(
  'details',
  { open, className: 'panel-section' },
  React.createElement('summary', null, title),
  React.createElement('div', { className: 'section-body' }, body)
);

export function App() {
  return React.createElement(
    'main',
    { className: 'shell' },
    React.createElement(
      'header',
      { className: 'hero' },
      React.createElement('div', null,
        React.createElement('p', { className: 'eyebrow' }, 'MAIHUE - PLATAFORMA OPERACIONAL'),
        React.createElement('h1', null, 'Inbox omnicanal'),
        React.createElement('p', { className: 'subtitle' }, 'Bandeja con derivacion, asignacion, historial completo, supervision e integraciones reales.')
      ),
      React.createElement('div', { className: 'user-card' },
        React.createElement('span', null, 'Vista de usuario'),
        React.createElement('select', null,
          React.createElement('option', null, 'Admin Maihue - admin'),
          React.createElement('option', null, 'Supervisor Comercial - supervisor'),
          React.createElement('option', null, 'Ejecutiva Ventas - agent')
        )
      )
    ),
    React.createElement('section', { className: 'system-strip' },
      React.createElement('div', null, React.createElement('strong', null, 'Meta: '), 'WhatsApp Cloud API ready'),
      React.createElement('div', null, React.createElement('strong', null, 'n8n: '), 'webhook-ready'),
      React.createElement('div', null, React.createElement('strong', null, 'Datos: '), 'PostgreSQL / BigQuery'),
      React.createElement('div', null, React.createElement('strong', null, 'IA: '), 'Anthropic-ready')
    ),
    React.createElement('section', { className: 'workspace' },
      React.createElement('aside', { className: 'card' },
        box('Conversaciones', React.createElement('div', { className: 'conversation-list' }, conversations.map((item, idx) =>
          React.createElement('button', { key: item[0], className: 'conversation-item ' + (idx === 0 ? 'active' : '') },
            React.createElement('strong', null, item[0]),
            React.createElement('span', null, item[1] + ' - ' + item[2] + ' - ' + item[3]),
            React.createElement('small', null, 'prioridad: ' + item[4])
          )
        ))),
        box('Filtros', React.createElement('p', null, 'Area, estado, prioridad, canal y SLA.'), false)
      ),
      React.createElement('section', { className: 'card center-pane' },
        React.createElement('p', { className: 'eyebrow' }, 'WHATSAPP'),
        React.createElement('h2', null, 'Lead Web Hogar'),
        React.createElement('p', { className: 'subtitle' }, '+56 9 3522 0880 - Leads Hogar - asignado a Admin Maihue'),
        React.createElement('div', { className: 'timeline' },
          React.createElement('article', { className: 'message inbound' }, 'Hola, necesito ayuda de Maihue.'),
          React.createElement('article', { className: 'message bot-note' }, 'Intencion detectada. Preparando derivacion con contexto completo.'),
          React.createElement('article', { className: 'message event' }, 'Transferencia lista: historial, tags, resumen IA, motivo y SLA se mantienen en la conversacion.'),
          React.createElement('article', { className: 'message internal' }, 'Nota interna: validar cobertura y estado comercial antes de ofrecer agenda.')
        ),
        React.createElement('div', { className: 'composer' },
          React.createElement('input', { placeholder: 'Escribe respuesta, nota interna o instruccion para IA...' }),
          React.createElement('button', null, 'Enviar')
        )
      ),
      React.createElement('aside', { className: 'card' },
        box('Derivacion y asignacion', React.createElement('div', { className: 'field-stack' },
          React.createElement('select', null, areas.map((area) => React.createElement('option', { key: area }, area))),
          React.createElement('button', { className: 'secondary' }, 'Derivar a area'),
          React.createElement('button', { className: 'primary' }, 'Asignar con estrategia del area'),
          React.createElement('button', { className: 'danger' }, 'Cerrar conversacion')
        )),
        box('Etiquetas', React.createElement('div', { className: 'tag-grid' },
          React.createElement('span', { className: 'badge accent' }, 'ventas'),
          React.createElement('span', { className: 'badge accent' }, 'lead-hogar'),
          React.createElement('button', { className: 'ghost' }, '+ Crear etiqueta')
        )),
        box('Bot e IA', React.createElement('p', null, 'Modo sugerir respuesta. Proveedor configurable via backend.' )),
        box('Historial y auditoria', React.createElement('ul', null,
          React.createElement('li', null, 'Webhook recibido desde WhatsApp.'),
          React.createElement('li', null, 'Clasificacion enviada a n8n.'),
          React.createElement('li', null, 'Asignacion registrada en audit_logs.')
        ), false),
        box('Integraciones', React.createElement('p', null, 'Meta, n8n, PostgreSQL, BigQuery y Anthropic.'), false)
      )
    )
  );
}
