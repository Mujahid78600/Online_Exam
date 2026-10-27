import React, { useState } from 'react';
import axios from 'axios';
import { filterTableById } from '../../utils/tableSearch';

const QuestionBank = ({ questions = [], onRefresh }) => {
  const [showQModal, setShowQModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [qType, setQType] = useState('MCQS');
  const [qFormData, setQFormData] = useState({
    description: '',
    difficulty_level: 'Easy',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'Option A',
    total_marks: 5,
    time_for_question: 60
  });

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQType('MCQS');
    setQFormData({
      description: '',
      difficulty_level: 'Easy',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'Option A',
      total_marks: 5,
      time_for_question: 60
    });
  };

  const openAddQuestionModal = () => {
    resetQuestionForm();
    setShowQModal(true);
  };

  const openEditQuestionModal = (q) => {
    setEditingQuestionId(q._id);
    setQType(q.type);
    setQFormData({
      description: q.description || '',
      difficulty_level: q.difficulty_level || 'Easy',
      option_a: q.options?.option_a || '',
      option_b: q.options?.option_b || '',
      option_c: q.options?.option_c || '',
      option_d: q.options?.option_d || '',
      correct_answer: q.correct_answer || 'Option A',
      total_marks: q.total_marks || 5,
      time_for_question: q.time_for_question || 60
    });
    setShowQModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();

    const payload = {
      ...qFormData,
      type: qType,
      options: qType === 'MCQS'
        ? {
            option_a: qFormData.option_a,
            option_b: qFormData.option_b,
            option_c: qFormData.option_c,
            option_d: qFormData.option_d
          }
        : {}
    };

    try {
      if (editingQuestionId) {
        await axios.put(
          `http://localhost:5000/api/questions/${editingQuestionId}`,
          payload,
          getHeaders()
        );
        alert('Question Updated Successfully!');
      } else {
        await axios.post(
          'http://localhost:5000/api/questions',
          payload,
          getHeaders()
        );
        alert('Question Added Successfully!');
      }

      setShowQModal(false);
      resetQuestionForm();
      if (typeof onRefresh === 'function') await onRefresh();
    } catch (err) {
      console.error('Error saving question:', err.response?.data || err);
      alert(err.response?.data?.message || 'Error saving question');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/questions/${id}`, getHeaders());
      if (typeof onRefresh === 'function') await onRefresh();
    } catch (err) {
      console.error('Error deleting question:', err.response?.data || err);
      alert(err.response?.data?.message || 'Failed to delete question');
    }
  };

  return (
    <>
      <div className="main-card">
        <div className="card-header-wrapper">
          <h3 className="card-title">Question Bank</h3>
          <button onClick={openAddQuestionModal}>+ Add New Question</button>
        </div>

        <hr className="card-divider" />

        <input type="text" placeholder="Search Questions..." style={{ width: '320px', marginBottom: '10px' }}

          onKeyUp={(e) => filterTableById('qBankTable', e.target.value)}
        />

        <table id="qBankTable">
          <thead>
            <tr>
              <th>Question Description</th>
              <th>Type</th>
              <th>Difficulty</th>
              <th>Correct Answer</th>
              <th>Total Marks</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q._id}>
                <td>{q.description}</td>
                <td>{q.type}</td>
                <td>{q.difficulty_level || 'Easy'}</td>
                <td>{q.correct_answer || '-'}</td>
                <td>{q.total_marks ?? 0}</td>
                <td>{q.time_for_question ?? '-'}</td>
                <td>
                  <button onClick={() => openEditQuestionModal(q)} style={{ marginRight: '8px' }} >Edit</button>
                  <button className="danger" onClick={() => handleDeleteQuestion(q._id)}>Delete</button>
                  
                </td>
              </tr>
            ))}
            {questions.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '16px' }}>
                  No questions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showQModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3>{editingQuestionId ? 'Edit Question' : 'Add New Question'}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowQModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <hr className="card-divider" />

            <form onSubmit={handleSaveQuestion}>
              <label>Question Description</label>
              <textarea
                required
                rows="2"
                value={qFormData.description}
                onChange={(e) =>
                  setQFormData({ ...qFormData, description: e.target.value })
                }
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Question Type</label>
                  <select
                    value={qType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setQType(newType);
                      if (newType === 'True/False') {
                        setQFormData({ ...qFormData, correct_answer: 'True' });
                      } else if (newType === 'MCQS') {
                        setQFormData({ ...qFormData, correct_answer: 'Option A' });
                      } else {
                        setQFormData({ ...qFormData, correct_answer: '' });
                      }
                    }}
                  >
                    <option value="MCQS">MCQS</option>
                    <option value="True/False">True/False</option>
                    <option value="Short Question">Short Question</option>
                    <option value="Long Question">Long Question</option>
                  </select>
                </div>

                <div>
                  <label>Difficulty Level</label>
                  <select
                    value={qFormData.difficulty_level}
                    onChange={(e) =>
                      setQFormData({ ...qFormData, difficulty_level: e.target.value })
                    }
                  >
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Difficult">Difficult</option>
                  </select>
                </div>
              </div>

              {qType === 'MCQS' && (
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '12px',
                    borderRadius: '6px',
                    margin: '12px 0',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                    Enter MCQ Options:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                    {['a', 'b', 'c', 'd'].map((option) => (
                      <div key={option}>
                        <label style={{ fontSize: '0.8rem' }}>
                          Option {option.toUpperCase()}
                        </label>
                        <input
                          type="text"
                          placeholder={`Option ${option.toUpperCase()}`}
                          value={qFormData[`option_${option}`]}
                          required
                          onChange={(e) =>
                            setQFormData({
                              ...qFormData,
                              [`option_${option}`]: e.target.value
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <label style={{ marginTop: '10px' }}>Select Correct Option</label>
                  <select
                    value={qFormData.correct_answer}
                    onChange={(e) =>
                      setQFormData({ ...qFormData, correct_answer: e.target.value })
                    }
                  >
                    <option value="Option A">Option A</option>
                    <option value="Option B">Option B</option>
                    <option value="Option C">Option C</option>
                    <option value="Option D">Option D</option>
                  </select>
                </div>
              )}

              {qType === 'True/False' && (
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', margin: '10px 0' }}>
                  <label>Select Correct Answer</label>
                  <select
                    value={qFormData.correct_answer}
                    onChange={(e) =>
                      setQFormData({ ...qFormData, correct_answer: e.target.value })
                    }
                  >
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Total Marks</label>
                  <input
                    type="number"
                    min="0"
                    value={qFormData.total_marks}
                    onChange={(e) =>
                      setQFormData({ ...qFormData, total_marks: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label>Time Allowed (seconds)</label>
                  <input
                    type="number"
                    min="0"
                    value={qFormData.time_for_question}
                    onChange={(e) =>
                      setQFormData({ ...qFormData, time_for_question: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="submit" className="success">
                  {editingQuestionId ? 'Update Question' : 'Save Question'}
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => setShowQModal(false)}
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

export default QuestionBank;
