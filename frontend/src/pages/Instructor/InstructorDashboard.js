import React, { useState, useEffect } from 'react';

import Sidebar from '../../components/Sidebar';

import DashboardAnalytics from './DashboardAnalytics';
import QuestionBank from './QuestionBank';
import ExamSchedule from './ExamSchedule';
import ExamQuestions from './ExamQuestions';
import ExamOverview from './ExamOverview';
import InstructorProfile from './InstructorProfile';


import axios from 'axios';

const InstructorDashboard = ({ user, onUserUpdate }) => {

  const [activeTab, setActiveTab] = useState('dashboard');

  const [questions, setQuestions] = useState([]);

  const [exams, setExams] = useState([]);

  const [submittedExams, setSubmittedExams] = useState([]);

  const [studentsList, setStudentsList] = useState([]);

  // Modals States


  const menuItems = [

    { id: 'dashboard', label: '📊 Dashboard' },

    { id: 'question_bank', label: '📚 Question Bank' },

    { id: 'exam_schedule', label: '📅 Exam Schedule' },

    { id: 'exam_questions', label: '📝 Exam Questions' },

    { id: 'exam_overview', label: '📋 Exam Overview' },

    { id: 'profile', label: '👤 My Profile' }

  ];

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchData = async () => {

    try {

      const qRes = await axios.get('http://localhost:5000/api/questions', getHeaders());

      setQuestions(qRes.data);

      const eRes = await axios.get('http://localhost:5000/api/exams/list', getHeaders());

      setExams(eRes.data);

      const sRes = await axios.get('http://localhost:5000/api/extra/results/submitted', getHeaders());

      setSubmittedExams(sRes.data);

      fetchStudents();

    } catch (err) {

      console.error(err);

    }

  };

  const fetchStudents = async () => {

    try {

      const res = await axios.get('http://localhost:5000/api/extra/students/active', getHeaders());

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

      <Sidebar menuItems={menuItems} activeTab={activeTab} setActiveTab={setActiveTab} />

      <section>






{activeTab === 'dashboard' && (
  <DashboardAnalytics
    submittedExams={submittedExams}
    studentsList={studentsList}
    exams={exams}
  />
)}






{activeTab === 'question_bank' && (
          <QuestionBank
            questions={questions}
            onRefresh={fetchData}
          />
        )}






        {activeTab === 'exam_schedule' && (
          <ExamSchedule exams={exams} studentsList={studentsList} fetchStudents={fetchStudents} onRefresh={fetchData} />
        )}



        {activeTab === 'exam_questions' && (
          <ExamQuestions
            exams={exams}
            questions={questions}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'exam_overview' && (
          <ExamOverview submittedExams={submittedExams} onRefresh={fetchData} />
        )}



        {activeTab === 'profile' && (
          <InstructorProfile user={user} onUserUpdate={onUserUpdate} />
        )}



      </section>

    </main>

  );

};

export default InstructorDashboard;