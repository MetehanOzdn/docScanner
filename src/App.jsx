import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DevicesList from './pages/DevicesList';
import PatientList from './pages/PatientList';
import Scan from './pages/Scan';
import DocumentTypeSelection from './pages/DocumentTypeSelection';
import PdfUpload from './pages/PdfUpload';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DevicesList />} />
      <Route path="/patients" element={<PatientList />} />
      <Route path="/document-type" element={<DocumentTypeSelection />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="/pdf-upload" element={<PdfUpload />} />
    </Routes>
  );
}

export default App;
