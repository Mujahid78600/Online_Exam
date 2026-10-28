import React, { useState } from 'react';
import axios from 'axios';
import { filterTableById } from '../../utils/tableSearch';

const ExamQuestions = ({ exams = [], questions = [], onRefresh }) => {
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedExamForMap, setSelectedExamForMap] = useState('');
  const [selectedQuestionsForExam, setSelectedQuestionsForExam] = useState([]);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const openAddMappingModal = () => {
    setSelectedExamForMap('');
    setSelectedQuestionsForExam([]);
    setShowMapModal(true);
  };

  const openEditMappingModal = async (exam) => {
    setSelectedExamForMap(exam._id);
    setSelectedQuestionsForExam([]);
    setShowMapModal(true);

    try {
      const res = await axios.get(
        `https://online-exam-evgn.vercel.app/api/exams/mapped-questions/${exam._id}`,
        getHeaders()
      );
      setSelectedQuestionsForExam(res.data);
    } catch (err) {
      console.error('Error loading mapped questions:', err);
      alert('Failed to load mapped questions.');
    }
  };

  const handleExamChangeForMap = async (examId) => {
    setSelectedExamForMap(examId);

    if (!examId) {
      setSelectedQuestionsForExam([]);
      return;
    }

    try {
      const res = await axios.get(
        `https://online-exam-evgn.vercel.app/api/exams/mapped-questions/${examId}`,
        getHeaders()
      );
      setSelectedQuestionsForExam(res.data);
    } catch (err) {
      console.error('Error loading mapped questions:', err);
      alert('Failed to load mapped questions.');
    }
  };

  const handleToggleQuestionForMap = (questionId) => {
    setSelectedQuestionsForExam((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId]
    );
  };

  const handleSaveExamQuestions = async (e) => {
    e.preventDefault();

    if (!selectedExamForMap) {
      return alert('Please select an exam first!');
    }

    const currentExam = exams.find((exam) => exam._id === selectedExamForMap);
    if (!currentExam) {
      return alert('Selected exam could not be found. Please refresh and try again.');
    }

    const existingAssignedStudents =
      currentExam.assigned_students?.map((student) =>
        typeof student === 'object' ? student._id : student
      ) || [];

    const selectedQuestionObjects = questions.filter((question) =>
      selectedQuestionsForExam.includes(question._id)
    );
    const totalMappedMarks = selectedQuestionObjects.reduce(
      (sum, question) => sum + (Number(question.total_marks) || 0),
      0
    );

    if (selectedQuestionsForExam.length === 0) {
      return alert('Please select at least one question for this exam.');
    }

    const instructorPassingMarks = Number(currentExam.passing_marks);
    if (!Number.isFinite(instructorPassingMarks) || instructorPassingMarks < 0) {
      return alert('Please edit the exam schedule and enter passing marks first.');
    }

    if (instructorPassingMarks > totalMappedMarks) {
      return alert(
        `Passing marks (${instructorPassingMarks}) cannot exceed the selected questions total (${totalMappedMarks}). Please edit the exam schedule and correct the passing marks.`
      );
    }

    try {
      await axios.post(
        'https://online-exam-evgn.vercel.app/api/exams/add-questions',
        {
          exam_schedule_id: selectedExamForMap,
          question_ids: selectedQuestionsForExam
        },
        getHeaders()
      );

      await axios.put(
        `https://online-exam-evgn.vercel.app/api/exams/schedule/${selectedExamForMap}`,
        {
          exam_name: currentExam.exam_name,
          start_time: currentExam.start_time,
          end_time: currentExam.end_time,
          assigned_students: existingAssignedStudents,
          total_exam_marks: totalMappedMarks,
          passing_marks: instructorPassingMarks
        },
        getHeaders()
      );

      alert(
        `Questions mapped successfully! Total Marks: ${totalMappedMarks}, Instructor-set Passing Marks: ${instructorPassingMarks}`
      );
      setShowMapModal(false);
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (err) {
      console.error('Error mapping questions:', err.response?.data || err);
      alert(err.response?.data?.message || 'Error mapping questions and updating marks');
    }
  };

  const handleDeleteExamSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam schedule?')) return;

    try {
      await axios.delete(`https://online-exam-evgn.vercel.app/api/exams/schedule/${id}`, getHeaders());
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to delete exam schedule:', err);
      alert(err.response?.data?.message || 'Failed to delete exam schedule');
    }
  };

  return (
    <>
      <div className="main-card">
        <div className="card-header-wrapper">
          <h3 className="card-title">Add Question Into Exam</h3>
          <button onClick={openAddMappingModal}>+ Add Exam Mapping</button>
        </div>

        <hr className="card-divider" />

        <input
          type="text"
          placeholder="Search Mapped Exams..."
          style={{ width: '320px', marginBottom: '10px' }}
          onKeyUp={(e) => filterTableById('mapExamsTable', e.target.value)}
        />

        <table id="mapExamsTable">
          <thead>
            <tr>
              <th>Exam Name</th>
              <th>Start Date &amp; Time</th>
              <th>End Date &amp; Time</th>
              <th>Passing Marks</th>
              <th>Question Added</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam._id}>
                <td><strong>{exam.exam_name}</strong></td>
                <td>{new Date(exam.start_time).toLocaleString()}</td>
                <td>{new Date(exam.end_time).toLocaleString()}</td>
                <td>{exam.passing_marks}</td>
                <td>
                  <span
                    style={{
                      background: exam.questions_count > 0 ? '#dcfce7' : '#fee2e2',
                      color: exam.questions_count > 0 ? '#166534' : '#991b1b',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    {exam.questions_count || 0} Questions Added
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => openEditMappingModal(exam)}
                    style={{ marginRight: '8px' }}
                  >
                    Edit
                  </button>
                  <button
                    className="danger"
                    onClick={() => handleDeleteExamSchedule(exam._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showMapModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <h3>Map Questions To Exam Paper</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowMapModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <hr className="card-divider" />

            <form onSubmit={handleSaveExamQuestions}>
              <select
                value={selectedExamForMap}
                required
                onChange={(e) => handleExamChangeForMap(e.target.value)}
              >
                <option value="" disabled>-- Select Scheduled Exam --</option>
                {exams.map((exam) => (
                  <option key={exam._id} value={exam._id}>{exam.exam_name}</option>
                ))}
              </select>

              {selectedExamForMap && (
                <div style={{ marginTop: '8px' }}>
                  <h4 style={{ marginBottom: '8px' }}>
                    Toggle / Select Questions to Add ({selectedQuestionsForExam.length} Selected):
                  </h4>

                  <table>
                    <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9' }}>
                      <tr>
                        <th>Add</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Difficulty</th>
                        <th>Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((question) => {
                        const isAdded = selectedQuestionsForExam.includes(question._id);
                        return (
                          <tr
                            key={question._id}
                            style={{ backgroundColor: isAdded ? '#f0fdf4' : '#fff' }}
                          >
                            <td>
                              <input
                                type="checkbox"
                                style={{ width: 'auto', transform: 'scale(1.2)', cursor: 'pointer' }}
                                checked={isAdded}
                                onChange={() => handleToggleQuestionForMap(question._id)}
                              />
                            </td>
                            <td>{question.description}</td>
                            <td>{question.type}</td>
                            <td>
                              <strong>{question.difficulty_level || 'Easy'}</strong>
                            </td>
                            <td>{question.total_marks}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="success">Submit</button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => setShowMapModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ExamQuestions;
