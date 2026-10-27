
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import DashboardAnalytics from './DashboardAnalytics';
import ManageUsers from './ManageUsers';
import ExamOverview from './ExamOverview';
import AdminProfile from './AdminProfile';
import axios from 'axios';

const AdminDashboard = ({ user, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [exams, setExams] = useState([]);
  const [submittedExams, setSubmittedExams] = useState([]);
  const [studentsList, setStudentsList] = useState([]);

  const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'users', label: '👥 Manage Users' },
    { id: 'exams', label: '📋 All Exams Overview' },
    { id: 'profile', label: '👤 My Profile' }
  ];

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  const fetchData = async () => {
    try {
      const eRes = await axios.get(
        'http://localhost:5000/api/exams/list',
        getHeaders()
      );
      setExams(eRes.data);

      const sRes = await axios.get(
        'http://localhost:5000/api/extra/results/submitted',
        getHeaders()
      );
      setSubmittedExams(sRes.data);

      await fetchStudents();
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(
        'http://localhost:5000/api/extra/students/active',
        getHeaders()
      );
      setStudentsList(res.data);
    } catch (err) {
      console.error('Students fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  return (
    <main>
      <Sidebar
        menuItems={menuItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <section>
        {activeTab === 'dashboard' && (
          <DashboardAnalytics
            submittedExams={submittedExams}
            studentsList={studentsList}
            exams={exams}
          />
        )}

        {activeTab === 'users' && <ManageUsers />}

        {activeTab === 'exams' && (
          <ExamOverview
            submittedExams={submittedExams}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'profile' && (
          <AdminProfile
            user={user}
            onUserUpdate={onUserUpdate}
          />
        )}
      </section>
    </main>
  );
};

export default AdminDashboard;