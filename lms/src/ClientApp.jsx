'use client';

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CourseProvider } from './context/CourseContext';

const ClientApp = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CourseProvider>
          <App />
        </CourseProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default ClientApp;
