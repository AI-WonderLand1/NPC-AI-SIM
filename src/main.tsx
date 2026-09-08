import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';
import './theme/npc-brain-replica.css';
import './theme/npc-brain-runtime.css';
import './theme/npc-approved-reference.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);