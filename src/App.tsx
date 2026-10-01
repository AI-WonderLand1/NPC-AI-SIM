import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { BuilderPage } from './components/BuilderPage.js';
import AppErrorBoundary from './components/AppErrorBoundary.js';

function AppContent() {
  const editor = <BuilderPage />;

  return (
    <Routes>
      <Route path="/" element={editor} />
      <Route path="/builder" element={editor} />
      <Route path="/builder/:templateId" element={editor} />
      <Route path="/library" element={<Navigate to="/builder" replace />} />
      <Route path="/library/:templateId" element={<Navigate to="/builder" replace />} />
      <Route path="/docs" element={<Navigate to="/builder" replace />} />
      <Route path="*" element={<Navigate to="/builder" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppErrorBoundary>
  );
}

export default App;
