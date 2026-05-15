export function App() {
  const root = document.createElement('main');
  root.className = 'shell';
  root.innerHTML = '<h1>MaiContact</h1><p>Inbox omnicanal preparado para integraciones reales.</p>';
  return root as unknown as JSX.Element;
}
