import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { FollowUpProvider } from './context/FollowUpContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import CreateTask from './pages/CreateTask';
import People from './pages/People';
import Whitelist from './pages/Whitelist';
import ResetCodes from './pages/ResetCodes';
import ForgotPassword from './pages/ForgotPassword';
import Progress from './pages/Progress';
import DailyLog from './pages/DailyLog';

function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <FollowUpProvider>
        <Router>
          <div className="App">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/tasks" replace />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="create-task" element={<CreateTask />} />
                <Route path="people" element={<People />} />
                <Route path="whitelist" element={<Whitelist />} />
                <Route path="reset-codes" element={<ResetCodes />} />
                <Route path="progress" element={<Progress />} />
                <Route path="daily-log" element={<DailyLog />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
        </FollowUpProvider>
      </TaskProvider>
    </AuthProvider>
  );
}

export default App;