import React, { useState, useEffect } from 'react';
import './style.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';

// Pages Import
import LoginRegister from './pages/LoginRegister';
import AdminDashboard from './pages/Admin/AdminDashboard';
import InstructorDashboard from './pages/Instructor/InstructorDashboard';
import StudentDashboard from './pages/Student/StudentDashboard';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <LoginRegister onLoginSuccess={(userData) => setUser(userData)} />;
  }

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      {user.role === 'admin' && <AdminDashboard user={user} />}
      {user.role === 'instructor' && <InstructorDashboard user={user} />}
      {user.role === 'student' && <StudentDashboard user={user} />}
      <Footer />
    </div>
  );
}

export default App;