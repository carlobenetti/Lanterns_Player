import ReactDOM from 'react-dom/client';

import '@nuclearplayer/tailwind-config';
import '@nuclearplayer/themes';
import '@nuclearplayer/i18n';

const root = ReactDOM.createRoot(document.getElementById('root')!);
const { initPlayerApp } = await import('./initPlayerApp');
await initPlayerApp(root);
