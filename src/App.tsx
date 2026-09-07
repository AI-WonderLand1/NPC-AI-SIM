import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import LibraryPage from './components/LibraryPage.js';
import { BuilderPage } from './components/BuilderPage.js';
import AppErrorBoundary from './components/AppErrorBoundary.js';

function LegacyLibraryRedirect() {
  const { templateId } = useParams<{ templateId: string }>();
  return <Navigate to={templateId ? `/builder/${templateId}` : '/library'} replace />;
}

function AppContent() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const editor = (
    <BuilderPage isSubscribed={isSubscribed} onSubscribe={() => setIsSubscribed(true)} />
  );

  return (
    <Routes>
      <Route path="/" element={editor} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/library/:templateId" element={<LegacyLibraryRedirect />} />
      <Route path="/builder" element={editor} />
      <Route path="/builder/:templateId" element={editor} />
      <Route path="/docs" element={<Navigate to="/library" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
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
