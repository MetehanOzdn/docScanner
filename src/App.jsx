import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import DocumentScanner from './pages/Scan';
import PatientList from './pages/PatientList';
import DevicesList from './pages/DevicesList';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/devices" />} />
      <Route path="/patients" element={<PatientList />} />
      <Route path="/scan" element={<DocumentScanner />} />
      <Route path="/devices" element={<DevicesList />} />
      {/* You can add a route for Home if needed, e.g., for a different purpose or direct access */}
      {/* <Route path="/home" element={<Home />} /> */}
    </Routes>
  );
}

export default App;
