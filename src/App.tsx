import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import LibraryPage from './components/LibraryPage.js';
import { BuilderPage } from './components/BuilderPage.js';

function LegacyLibraryRedirect() {
  const { templateId } = useParams<{ templateId: string }>();
  return <Navigate to={templateId ? `/builder/${templateId}` : '/library'} replace />;
}

function AppContent() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  return (
    <Routes>
      <Route path="/" element={<LibraryPage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/library/:templateId" element={<LegacyLibraryRedirect />} />
      <Route
        path="/builder"
        element={<BuilderPage isSubscribed={isSubscribed} onSubscribe={() => setIsSubscribed(true)} />}
      />
      <Route
        path="/builder/:templateId"
        element={<BuilderPage isSubscribed={isSubscribed} onSubscribe={() => setIsSubscribed(true)} />}
      />
      <Route path="/docs" element={<Navigate to="/library" replace />} />
      <Route path="*" element={<Navigate to="/library" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
