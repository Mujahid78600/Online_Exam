import React, { useState } from 'react';
import axios from 'axios';
import { filterTableById } from '../../utils/tableSearch';

const ExamSchedule = ({ exams = [], studentsList = [], fetchStudents, onRefresh }) => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    exam_name: '',
    start_time: '',
    duration_minutes: '',
    passing_marks: '',
    assigned_students: []
  });
  const [filterDept, setFilterDept] = useState('');
  const [filterClass, setFilterClass] = useState('');

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const toLocalDateTimeInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const getCurrentLocalDateTime = () => toLocalDateTimeInput(new Date());

  // Convert a datetime-local value to an ISO-like timestamp with Pakistan's UTC+05:00 offset.
  // Example: 2026-10-06T10:00:00+05:00
  const toPakistanIsoString = (date) => {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.000+05:00`;
  };

  const openScheduleModal = () => {
    fetchStudents();
    setEditingExamId(null);
    setScheduleData({
      exam_name: '',
      start_time: '',
      duration_minutes: '',
      passing_marks: '',
      assigned_students: []
    });
    setFilterDept('');
    setFilterClass('');
    setShowScheduleModal(true);
  };

  const openEditScheduleModal = (exam) => {
    fetchStudents();
    setEditingExamId(exam._id);

    const durationMinutes = exam.start_time && exam.end_time
      ? Math.max(1, Math.round((new Date(exam.end_time).getTime() - new Date(exam.start_time).getTime()) / 60000))
      : '';

    setScheduleData({
      exam_name: exam.exam_name || '',
      start_time: toLocalDateTimeInput(exam.start_time),
      duration_minutes: durationMinutes,
      passing_marks: exam.passing_marks ?? '',
      assigned_students: exam.assigned_students?.map(s => typeof s === 'object' ? s._id : s) || []
    });
    setFilterDept('');
    setFilterClass('');
    setShowScheduleModal(true);
  };

  const getCalculatedEndDateTime = () => {
    if (!scheduleData.start_time || !scheduleData.duration_minutes) return '';
    const startDate = new Date(scheduleData.start_time);
    const duration = Number(scheduleData.duration_minutes);
    if (Number.isNaN(startDate.getTime()) || !Number.isFinite(duration) || duration <= 0) return '';
    return new Date(startDate.getTime() + duration * 60000);
  };

  const getCalculatedEndTimeDisplay = () => {
    const endDate = getCalculatedEndDateTime();
    return endDate ? endDate.toLocaleString() : '';
  };

  const handleSaveExamSchedule = async (e) => {
    e.preventDefault();

    if (!scheduleData.start_time) {
      return alert('Please select the exam start date and time.');
    }

    const startDateTime = new Date(scheduleData.start_time);
    const durationMinutes = Number(scheduleData.duration_minutes);
    const passingMarks = Number(scheduleData.passing_marks);
    const now = new Date();

    if (Number.isNaN(startDateTime.getTime())) {
      return alert('Please select a valid exam start date and time.');
    }
    if (startDateTime.getTime() < now.getTime()) {
      return alert('Exam start date/time must be the current time or in the future.');
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return alert('Please enter a valid duration in minutes.');
    }
    if (scheduleData.passing_marks === '' || !Number.isFinite(passingMarks) || passingMarks < 0) {
      return alert('Please enter valid passing marks.');
    }
    if (scheduleData.assigned_students.length === 0) {
      return alert('Please select at least one student to assign this exam!');
    }

    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    // ISO strings are cast to BSON Date values by Mongoose when the model fields use type: Date.
    // MongoDB Compass/shell will then display them as ISODate("...").
    const payload = {
      exam_name: scheduleData.exam_name.trim(),
      start_time: toPakistanIsoString(startDateTime),
      end_time: toPakistanIsoString(endDateTime),
      passing_marks: passingMarks,
      assigned_students: scheduleData.assigned_students
    };

    try {
      if (editingExamId) {
        await axios.put(`https://online-exam-evgn.vercel.app/api/exams/schedule/${editingExamId}`, payload, getHeaders());
        alert('Exam Schedule Updated Successfully!');
      } else {
        await axios.post('https://online-exam-evgn.vercel.app/api/exams/schedule', payload, getHeaders());
        alert('Exam Scheduled and Assigned Successfully!');
      }
      setShowScheduleModal(false);
      onRefresh();
    } catch (err) {
      console.error('Error saving exam schedule:', err.response?.data || err);
      alert(err.response?.data?.message || 'Error saving exam schedule');
    }
  };

  const getExamDuration = () => {
    if (!scheduleData.start_time || !scheduleData.duration_minutes) return '';
    const durationMinutes = Number(scheduleData.duration_minutes);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return '';
    const days = Math.floor(durationMinutes / 1440);
    const hours = Math.floor((durationMinutes % 1440) / 60);
    const minutes = durationMinutes % 60;
    return [
      days ? `${days} day${days === 1 ? '' : 's'}` : '',
      hours ? `${hours} hour${hours === 1 ? '' : 's'}` : '',
      minutes ? `${minutes} min` : ''
    ].filter(Boolean).join(' ');
  };

    const handleDeleteExamSchedule = async (id) => {

    if (window.confirm('Are you sure you want to delete this exam schedule?')) {

      try {

        await axios.delete(`https://online-exam-evgn.vercel.app/api/exams/schedule/${id}`, getHeaders());

        onRefresh();

      } catch (err) { alert('Failed to delete exam schedule'); }

    }

  };

  const handleDeptFilterSelect = (dept) => {

    setFilterDept(dept);

    if (!dept) return;

    const matchingIds = studentsList.filter(s => s.department?.toLowerCase() === dept.toLowerCase()).map(s => s._id);

    const combined = Array.from(new Set([...scheduleData.assigned_students, ...matchingIds]));

    setScheduleData({ ...scheduleData, assigned_students: combined });

  };

  const handleClassFilterSelect = (cls) => {

    setFilterClass(cls);

    if (!cls) return;

    const matchingIds = studentsList.filter(s => s.class?.toLowerCase() === cls.toLowerCase()).map(s => s._id);

    const combined = Array.from(new Set([...scheduleData.assigned_students, ...matchingIds]));

    setScheduleData({ ...scheduleData, assigned_students: combined });

  };

  const handleStudentToggle = (studentId) => {

    if (scheduleData.assigned_students.includes(studentId)) {

      setScheduleData({

        ...scheduleData,

        assigned_students: scheduleData.assigned_students.filter(id => id !== studentId)

      });

    } else {

      setScheduleData({

        ...scheduleData,

        assigned_students: [...scheduleData.assigned_students, studentId]

      });

    }

  };


  const uniqueDepartments = Array.from(new Set(studentsList.map(s => s.department).filter(Boolean)));
  const uniqueClasses = Array.from(new Set(studentsList.map(s => s.class).filter(Boolean)));

  return (
    <>


          <div className="main-card">

            <div className="card-header-wrapper">

              <h3 className="card-title">Exam Schedule & Assigned Students</h3>

              <button onClick={openScheduleModal}>+ Schedule New Exam</button>

            </div>

            <hr className="card-divider" />

            <input 

              type="text" 

              placeholder="Search Scheduled Exams..." 

              style={{ width: '320px', marginBottom: '10px' }} 

              onKeyUp={(e) => filterTableById('examTable', e.target.value)} 

            />

            <table id="examTable">

              <thead>

                <tr>

                  <th>Exam Name</th>

                  <th>Start Date &amp; Time</th>

                  <th>End Date &amp; Time</th>

                  <th>Passing / Total Marks</th>

                  <th>Assigned Students</th>

                  <th>Action</th>

                </tr>

              </thead>

              <tbody>

                {exams.map(e => (

                  <tr key={e._id}>

                    <td>{e.exam_name}</td>

                    <td>{new Date(e.start_time).toLocaleString()}</td>

                    <td>{new Date(e.end_time).toLocaleString()}</td>

                    <td>{e.passing_marks ?? '-'} / {e.total_exam_marks ?? '-'}</td>

                    <td>{e.assigned_students?.length || 0} Students Assigned</td>

                    <td>

                      <button onClick={() => openEditScheduleModal(e)} style={{ marginRight: '8px' }}>Edit</button>

                      <button className="danger" onClick={() => handleDeleteExamSchedule(e._id)}>Delete</button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>





        {showScheduleModal && (

          <div className="modal-overlay">

            <div className="modal-content" style={{ maxWidth: '850px' }}>

              <div className="modal-header">

                <h3>{editingExamId ? 'Edit Scheduled Exam' : 'Schedule Exam & Assign Students'}</h3>

                <button type="button" className="modal-close-btn" onClick={() => setShowScheduleModal(false)} aria-label="Close">✕</button>

              </div>

              <hr className="card-divider" />

              <form onSubmit={handleSaveExamSchedule}>

                <label>Exam Name</label>

                <input type="text" value={scheduleData.exam_name} required onChange={(e) => setScheduleData({...scheduleData, exam_name: e.target.value})} />

                <div className="schedule-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", alignItems: "start" }}>
                  <div className="schedule-form-field">
                    <label htmlFor="exam-start-time">Start Date &amp; Time</label>
                    <input
                      id="exam-start-time"
                      type="datetime-local"
                      min={getCurrentLocalDateTime()}
                      value={scheduleData.start_time}
                      required
                      onChange={(e) => setScheduleData({
                        ...scheduleData,
                        start_time: e.target.value
                      })}
                    />
                  </div>

                  <div className="schedule-form-field">
                    <label htmlFor="exam-duration">Duration (Minutes)</label>
                    <input
                      id="exam-duration"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 90"
                      value={scheduleData.duration_minutes}
                      required
                      onChange={(e) => setScheduleData({
                        ...scheduleData,
                        duration_minutes: e.target.value
                      })}
                    />
                  </div>

                  <div className="schedule-form-field">
                    <label htmlFor="exam-end-time">End Date &amp; Time </label>
                    <input
                      id="exam-end-time"
                      type="datetime-local"
                        value={getCalculatedEndDateTime() ? toLocalDateTimeInput(getCalculatedEndDateTime()): '' }
                      placeholder="Enter start date/time and duration"
                      readOnly
                    />
                  </div>

                </div>

<div
  className="schedule-form-grid"
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    alignItems: "start"
  }}
>
  <div className="schedule-form-field">
    <label htmlFor="exam-passing-marks">Passing Marks</label>
    <input
      id="exam-passing-marks"
      type="number"
      min="0"
      step="0.01"
      value={scheduleData.passing_marks}
      required
      placeholder="Enter passing marks"
      onChange={(e) =>
        setScheduleData({
          ...scheduleData,
          passing_marks: e.target.value
        })
      }
    />
  </div>

  <div className="schedule-form-field">
    <label htmlFor="exam-duration-display">Exam Duration</label>
    <input
      id="exam-duration-display"
      type="text"
      value={getExamDuration()}
      placeholder="Enter duration above"
      readOnly
    />
  </div>
</div>

                <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Assign Students (By Department, Class or Manual):</h4>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>

                  <select value={filterDept} onChange={(e) => handleDeptFilterSelect(e.target.value)}>

                    <option value="">-- Select All By Department --</option>

                    {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}

                  </select>

                  <select value={filterClass} onChange={(e) => handleClassFilterSelect(e.target.value)}>

                    <option value="">-- Select All By Class --</option>

                    {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}

                  </select>

                </div>

                <div style={{ background: '#f8fafc', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', maxHeight: '180px', overflowY: 'auto' }}>

                  {studentsList.length === 0 ? (

                    <p style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '8px' }}>No active students found in system.</p>

                  ) : (

                    studentsList.map(st => (

                      <label key={st._id} style={{ display: 'block', margin: '6px 0', fontSize: '0.9rem' }}>

                        <input 

                          type="checkbox" 

                          style={{ width: 'auto', marginRight: '8px' }}

                          checked={scheduleData.assigned_students.includes(st._id)}

                          onChange={() => handleStudentToggle(st._id)}

                        />

                        {st.name} ({st.email}) — Dept: {st.department || 'N/A'}, Class: {st.class || 'N/A'}

                      </label>

                    ))

                  )}

                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>

                  <button type="submit" className="success">{editingExamId ? 'Update Exam' : 'Schedule & Assign'}</button>

                  <button type="button" className="danger" onClick={() => setShowScheduleModal(false)}>Cancel</button>

                </div>

              </form>

            </div>

          </div>

        )}


    </>
  );
};

export default ExamSchedule;
