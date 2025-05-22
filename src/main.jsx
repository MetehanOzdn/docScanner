import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App'; // Your main App component that might contain an <Outlet />
import Home from './pages/Home';
import UserList from './pages/UserList';

// Import global styles - adjust path if necessary
import './index.css';
// import './App.css'; // If App.css has global styles for App component layout

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
