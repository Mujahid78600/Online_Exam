import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import PrintableResultCard from '../../components/PrintableResultCard';
import StudentDashboardAnalytics from './StudentDashboardAnalytics';
import StudentMyExams from './StudentMyExams';
import StudentResults from './StudentResults';
import StudentProfile from './StudentProfile';

const StudentDashboard = ({ user, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [studentUser, setStudentUser] = useState(user || {});
  const [printAttempt, setPrintAttempt] = useState(null);

  const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'my_exams', label: '📝 My Exams' },
    { id: 'results', label: '📈 Results & Reports' },
    { id: 'profile', label: '👤 My Profile' },
  ];

  const handleUserUpdate = (updatedUser) => {
    setStudentUser(updatedUser);

    if (typeof onUserUpdate === 'function') {
      onUserUpdate(updatedUser);
    } else {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <main className="student-dashboard-layout">
      <Sidebar
        menuItems={menuItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <section className="student-analytics-dashboard">
        {activeTab === 'dashboard' && (
          <StudentDashboardAnalytics user={user} studentUser={studentUser} />
        )}

        <StudentMyExams activeTab={activeTab} />

        {activeTab === 'results' && (
          <StudentResults
            studentProfile={studentUser}
            user={user}
            setPrintAttempt={setPrintAttempt}
          />
        )}

        {activeTab === 'profile' && (
          <StudentProfile
            user={studentUser}
            onUserUpdate={handleUserUpdate}
          />
        )}

        <PrintableResultCard
          attempt={printAttempt}
          student={studentUser}
          onClose={() => setPrintAttempt(null)}
        />
      </section>
    </main>
  );
};

export default StudentDashboard;
