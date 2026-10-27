import React, { useState } from 'react';
import axios from 'axios';
import PrintableResultCard from '../../components/PrintableResultCard';
import { filterTableById } from '../../utils/tableSearch';

const ExamOverview = ({ submittedExams = [], onRefresh }) => {
  const [printExamAttempt, setPrintExamAttempt] = useState(null);
  const [evaluationModalAttempt, setEvaluationModalAttempt] = useState(null);
  const [evalMarks, setEvalMarks] = useState({});

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const handleEvaluateExamSubmit = async (e) => {
    e.preventDefault();
    try {
      const evaluatedAnswers = evaluationModalAttempt.answers.map((ans) => ({
        question_id: ans.question_id._id,
        manual_marks_obtained:
          evalMarks[ans.question_id._id]?.marks ?? ans.manual_marks_obtained,
        instructor_remarks:
          evalMarks[ans.question_id._id]?.remarks ?? ans.instructor_remarks
      }));

      await axios.post(
        'http://localhost:5000/api/exams/evaluate',
        { examAttemptId: evaluationModalAttempt._id, evaluatedAnswers },
        getHeaders()
      );

      setEvaluationModalAttempt(null);
      setEvalMarks({});
      if (typeof onRefresh === 'function') onRefresh();
      alert('Exam Evaluated Successfully!');
    } catch (err) {
      alert('Evaluation failed');
    }
  };

  return (
    <>
      <div className="main-card">
        <h3 className="card-title">Submitted Student Exams & Grading</h3>
        <hr className="card-divider" />
        <input type="text" placeholder="Search Submissions..." style={{ width: '320px' }}
          onKeyUp={(e) => filterTableById('submittedTable', e.target.value)}
        />
        <table id="submittedTable">
          <thead>
            <tr>
              <th>Student</th><th>Exam Name</th><th>Score</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submittedExams.map((sub) => (
              <tr key={sub._id}>
                <td>{sub.student_id?.name}</td>
                <td>{sub.exam_schedule_id?.exam_name}</td>
                <td>{sub.total_score}</td>
                <td>{sub.status}</td>
                <td>
                  {sub.status?.toLowerCase() === 'submitted' ? (
                    <button onClick={() => { setEvalMarks({}); setEvaluationModalAttempt(sub); }}>Evaluate</button>
                    ) : sub.status?.toLowerCase() === 'evaluated' ? (
                      <button className="success" onClick={() => setPrintExamAttempt(sub)}>Print Card</button>
                      ) : (
                        <span>{sub.status || 'Unknown'}</span>
                        )}
                  
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>





      {evaluationModalAttempt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3>Evaluate Manual Questions & Remarks</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEvaluationModalAttempt(null)}
                aria-label="Close"
              >✕</button>
            </div>
            <hr className="card-divider" />
            <form onSubmit={handleEvaluateExamSubmit}>
              {evaluationModalAttempt.answers.map((ans, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#f8fafc', padding: '12px', margin: '10px 0',
                    border: '1px solid #cbd5e1', borderRadius: '6px'
                  }}
                >
                  <p><strong>Q:</strong> {ans.question_id?.description} (Type: {ans.question_id?.type})</p>
                  <p><strong>Student Answer:</strong> {ans.student_answer}</p>
                  {(ans.question_id?.type === 'Short Question' ||
                    ans.question_id?.type === 'Long Question') && (
                    <>
                      <label>Manual Marks (Max {ans.question_id?.total_marks})</label>
                      <input
                        type="number"
                        defaultValue={ans.manual_marks_needed ?? ans.manual_marks_obtained}
                        onChange={(e) => setEvalMarks((prev) => ({
                          ...prev,
                          [ans.question_id._id]: {
                            ...prev[ans.question_id._id], marks: Number(e.target.value)
                          }
                        }))}
                      />
                    </>
                  )}
                  <label>Remarks</label>
                  <input
                    type="text"
                    placeholder="Enter feedback/mistakes..."
                    defaultValue={ans.instructor_remarks}
                    onChange={(e) => setEvalMarks((prev) => ({
                      ...prev,
                      [ans.question_id._id]: {
                        ...prev[ans.question_id._id], remarks: e.target.value
                      }
                    }))}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="submit" className="success">Save Evaluation</button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => setEvaluationModalAttempt(null)}
                >Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <PrintableResultCard
        attempt={printExamAttempt}
        onClose={() => setPrintExamAttempt(null)}
      />
    </>
  );
};

export default ExamOverview;
