
import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { filterTableById } from '../../utils/tableSearch';

const API_BASE = 'https://online-exam-evgn.vercel.app';

const StudentMyExams = ({ activeTab, setActiveTab }) => {
  const [assignedExams, setAssignedExams] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [paperQuestions, setPaperQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [questionTimers, setQuestionTimers] = useState({});
  const [expiredQuestions, setExpiredQuestions] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState({});
  const [attemptRecoveryChecked, setAttemptRecoveryChecked] = useState(false);
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const attemptStorageKey = `student_exam_attempt_${(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      return savedUser?._id || savedUser?.id || savedUser?.email || 'student';
    } catch {
      return 'student';
    }
  })()}`;

  const getHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  }), []);

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/exams/list`, getHeaders());
      setAssignedExams(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load assigned exams:', error);
    }
  }, [getHeaders]);

  const fetchResults = useCallback(async () => {
    setResultsLoading(true);
    setResultsError('');
    try {
      const response = await axios.get(`${API_BASE}/api/extra/results/student`, getHeaders());
      setResults(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load attempted exams:', error);
      setResultsError('Unable to verify previous exam attempts. Please refresh or try again.');
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Restore an in-progress exam after a page refresh.
  useEffect(() => {
    try {
      const rawAttempt = localStorage.getItem(attemptStorageKey);
      if (rawAttempt) {
        const saved = JSON.parse(rawAttempt);
        if (saved.activeExam && Array.isArray(saved.paperQuestions) && saved.paperQuestions.length) {
          const restoredIndex = Math.min(Math.max(Number(saved.currentQIndex) || 0, 0), saved.paperQuestions.length - 1);
          const elapsedSeconds = Math.max(0, Math.floor((Date.now() - Number(saved.savedAt || Date.now())) / 1000));
          const restoredTimers = { ...(saved.questionTimers || {}) };
          const restoredExpired = { ...(saved.expiredQuestions || {}) };
          const remaining = Math.max(0, Number(restoredTimers[restoredIndex] ?? saved.timer ?? 0) - elapsedSeconds);
          restoredTimers[restoredIndex] = remaining;
          if (remaining <= 0) restoredExpired[restoredIndex] = true;
          if (typeof setActiveTab === 'function') setActiveTab('my_exams');
          setActiveExam(saved.activeExam);
          setPaperQuestions(saved.paperQuestions);
          setCurrentQIndex(restoredIndex);
          setTimer(remaining);
          setStudentAnswers(saved.studentAnswers || {});
          setQuestionTimers(restoredTimers);
          setExpiredQuestions(restoredExpired);
          setVisitedQuestions(saved.visitedQuestions || { [restoredIndex]: true });
        } else {
          localStorage.removeItem(attemptStorageKey);
        }
      }
    } catch (error) {
      console.error('Could not restore exam attempt:', error);
      localStorage.removeItem(attemptStorageKey);
    } finally {
      setAttemptRecoveryChecked(true);
    }
  }, [attemptStorageKey, setActiveTab]);

  // Persist answers and the active question timer.
  useEffect(() => {
    if (!attemptRecoveryChecked) return;
    if (activeExam && paperQuestions.length > 0) {
      try {
        localStorage.setItem(attemptStorageKey, JSON.stringify({
          activeExam, paperQuestions, currentQIndex, timer, studentAnswers,
          questionTimers, expiredQuestions, visitedQuestions, savedAt: Date.now(),
        }));
      } catch (error) {
        console.error('Could not save exam attempt:', error);
      }
    } else {
      localStorage.removeItem(attemptStorageKey);
    }
  }, [attemptRecoveryChecked, attemptStorageKey, activeExam, paperQuestions, currentQIndex, timer, studentAnswers, questionTimers, expiredQuestions, visitedQuestions]);

  useEffect(() => {
    if (!activeExam) return undefined;
    const warnBeforeLeaving = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [activeExam]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Refresh attempt records when entering the exam list and after an exam closes.
  useEffect(() => {
    if (activeTab === 'my_exams' && !activeExam) {
      fetchData();
      fetchResults();
    }
  }, [activeTab, activeExam, fetchData, fetchResults]);

  const getExamStatus = (exam) => {
    if (!exam?.start_time || !exam?.end_time) return 'unknown';
    const now = new Date(currentTime);
    if (now < new Date(exam.start_time)) return 'upcoming';
    if (now > new Date(exam.end_time)) return 'expired';
    return 'active';
  };

  const getRemainingTime = (exam) => {
    if (!exam?.start_time) return '';
    const diff = new Date(exam.start_time) - new Date(currentTime);
    if (diff <= 0) return '';
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const formatQuestionTimer = (seconds) => {
    const safe = Math.max(0, Number(seconds) || 0);
    return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
  };

  const isQuestionAnswered = (index) => {
    const questionId = paperQuestions[index]?._id;
    const answer = studentAnswers[questionId];
    return answer !== undefined && answer !== null && String(answer).trim() !== '';
  };

  const getQuestionState = (index) => {
    if (expiredQuestions[index]) return 'expired';
    if (isQuestionAnswered(index)) return 'answered';
    if (visitedQuestions[index]) return 'visited';
    return 'unvisited';
  };

  const updateAnswer = (questionId, answer) => {
    setStudentAnswers((previous) => ({ ...previous, [questionId]: answer }));
  };

  const startExam = async (examId) => {
    try {
      const exam = assignedExams.find((item) => String(item._id) === String(examId));
      if (!exam) return alert('Exam not found!');
      const status = getExamStatus(exam);
      if (status === 'upcoming') return alert(`Exam has not started yet.\nTime Remaining: ${getRemainingTime(exam)}`);
      if (status === 'expired') return alert('This exam has expired.');
      if (isExamAttempted(examId)) return alert('This exam has already been attempted.');

      const response = await axios.get(`${API_BASE}/api/exams/paper/${examId}`, getHeaders());
      if (!Array.isArray(response.data) || response.data.length === 0) return alert('No questions found in this exam paper!');
      const timers = {};
      response.data.forEach((question, index) => { timers[index] = Number(question.time_for_question || 60); });
      setPaperQuestions(response.data);
      setQuestionTimers(timers);
      setExpiredQuestions({});
      setVisitedQuestions({ 0: true });
      setActiveExam(examId);
      setCurrentQIndex(0);
      setTimer(timers[0]);
      setStudentAnswers({});
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Error starting exam');
    }
  };

  const handleSubmitExam = useCallback(async () => {
    if (!activeExam || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(studentAnswers).map(([questionId, answer]) => ({
        question_id: questionId,
        student_answer: answer,
      }));
      await axios.post(`${API_BASE}/api/exams/submit`, {
        exam_schedule_id: activeExam,
        answers: formattedAnswers,
      }, getHeaders());

      // Clear saved attempt only after the server confirms submission.
      localStorage.removeItem(attemptStorageKey);
      setActiveExam(null);
      setPaperQuestions([]);
      setQuestionTimers({});
      setExpiredQuestions({});
      setVisitedQuestions({});
      setCurrentQIndex(0);
      setTimer(0);
      setStudentAnswers({});
      await Promise.all([fetchData(), fetchResults()]);
      alert('Exam Submitted Successfully!');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Exam submission failed');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [activeExam, studentAnswers, getHeaders, attemptStorageKey, fetchData, fetchResults]);

  useEffect(() => {
    if (!activeExam || !paperQuestions.length || !paperQuestions[currentQIndex]) return undefined;
    if (expiredQuestions[currentQIndex]) {
      setTimer(0);
      return undefined;
    }
    const interval = setInterval(() => {
      setQuestionTimers((previous) => {
        const current = previous[currentQIndex] ?? Number(paperQuestions[currentQIndex]?.time_for_question || 60);
        if (current <= 1) {
          setTimer(0);
          setExpiredQuestions((previousExpired) => ({ ...previousExpired, [currentQIndex]: true }));
          return { ...previous, [currentQIndex]: 0 };
        }
        const next = current - 1;
        setTimer(next);
        return { ...previous, [currentQIndex]: next };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeExam, currentQIndex, paperQuestions, expiredQuestions]);

  useEffect(() => {
    if (!activeExam || !paperQuestions.length || !expiredQuestions[currentQIndex]) return undefined;
    const timeout = setTimeout(() => {
      let nextIndex = currentQIndex + 1;
      while (nextIndex < paperQuestions.length && expiredQuestions[nextIndex]) nextIndex++;
      if (nextIndex < paperQuestions.length) {
        setCurrentQIndex(nextIndex);
        setVisitedQuestions((previous) => ({ ...previous, [nextIndex]: true }));
        setTimer(questionTimers[nextIndex] ?? Number(paperQuestions[nextIndex]?.time_for_question || 60));
      } else {
        handleSubmitExam();
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [expiredQuestions, currentQIndex, activeExam, paperQuestions, questionTimers, handleSubmitExam]);

  const handleNextQuestion = () => {
    setVisitedQuestions((previous) => ({ ...previous, [currentQIndex]: true }));
    let nextIndex = currentQIndex + 1;
    while (nextIndex < paperQuestions.length && expiredQuestions[nextIndex]) nextIndex++;
    if (nextIndex >= paperQuestions.length) {
      handleSubmitExam();
      return;
    }
    setCurrentQIndex(nextIndex);
    setVisitedQuestions((previous) => ({ ...previous, [nextIndex]: true }));
    setTimer(questionTimers[nextIndex] ?? Number(paperQuestions[nextIndex]?.time_for_question || 60));
  };

  const handlePrevQuestion = () => {
    setVisitedQuestions((previous) => ({ ...previous, [currentQIndex]: true }));
    let previousIndex = currentQIndex - 1;
    while (previousIndex >= 0 && expiredQuestions[previousIndex]) previousIndex--;
    if (previousIndex < 0) return;
    setCurrentQIndex(previousIndex);
    setVisitedQuestions((previous) => ({ ...previous, [previousIndex]: true }));
    setTimer(questionTimers[previousIndex] ?? Number(paperQuestions[previousIndex]?.time_for_question || 60));
  };

  const isExamAttempted = (examId) => results.some((result) => {
    const scheduleId = result?.exam_schedule_id?._id || result?.exam_schedule_id?.id || result?.exam_schedule_id;
    return String(scheduleId) === String(examId);
  });

  if (activeTab !== 'my_exams') return null;

  return (
    <>
      {!activeExam && (
        <div className="main-card">
          <div className="card-header-wrapper"><h3 className="card-title">Assigned Exams</h3></div>
          <hr className="card-divider" />
          <input className="dashboard-search-input" type="text" placeholder="Search Assigned Exams..." onKeyUp={(event) => filterTableById('studentExamsTable', event.target.value)} />
          {resultsLoading && <p>Checking previous exam attempts...</p>}
          {resultsError && <div role="alert"><p>{resultsError}</p><button type="button" onClick={fetchResults}>Retry</button></div>}
          <table id="studentExamsTable">
            <thead><tr><th>Exam Name</th><th>Start Time</th><th>End Time</th><th>Action</th></tr></thead>
            <tbody>
              {[...assignedExams]
              .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
              .map((exam) => {
              const attempted = isExamAttempted(exam._id);
              const status = getExamStatus(exam);
                return (
                  <tr key={exam._id}>
                    <td><strong>{exam.exam_name}</strong></td>
                    <td>{new Date(exam.start_time).toLocaleString()}</td>
                    <td>{new Date(exam.end_time).toLocaleString()}</td>
                    <td>
                      {resultsError ? <span className="badge badge-warning">Attempt status unavailable</span>
                        : resultsLoading ? <span className="badge badge-warning">Checking attempt...</span>
                        : attempted ? <span className="badge badge-success">Exam Attempted ✓</span>
                        : status === 'upcoming' ? <span className="badge badge-warning">Time Remaining: {getRemainingTime(exam)}</span>
                        : status === 'expired' ? <span className="badge badge-danger">Expired</span>
                        : <button type="button" className="success" onClick={() => startExam(exam._id)}>Start Exam</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeExam && paperQuestions.length > 0 && paperQuestions[currentQIndex] && (
        <div className="exam-modal-overlay">
          <div className="main-card exam-modal-box">
            <div className="exam-modal-header">
              <h3 className="card-title">Question {currentQIndex + 1} of {paperQuestions.length}</h3>
              <h4 className={`exam-timer-header ${timer < 10 ? 'danger-timer' : 'safe-timer'}`}>Time Remaining: {formatQuestionTimer(timer)}</h4>
            </div>
            <hr className="card-divider" />
            <div className="question-nav-container">
              <div className="question-palette-grid">
                {paperQuestions.map((question, index) => {
                  const state = getQuestionState(index);
                  const className = ['palette-item-btn', index === currentQIndex ? 'current-question' : '', state === 'answered' ? 'answered' : '', state === 'visited' ? 'visited' : '', state === 'expired' ? 'expired' : ''].filter(Boolean).join(' ');
                  return <button key={question._id || index} type="button" className={className} disabled={state === 'expired' || isSubmitting} onClick={() => {
                    if (state === 'expired') return;
                    setCurrentQIndex(index);
                    setVisitedQuestions((previous) => ({ ...previous, [index]: true }));
                    setTimer(questionTimers[index] ?? Number(question.time_for_question || 60));
                  }}>{index + 1}</button>;
                })}
              </div>
              <div className="palette-legends">
                <span className="legend-row-item"><span className="dot-box answered-dot" />Attempted</span>
                <span className="legend-row-item"><span className="dot-box review-dot" />For review</span>
                <span className="legend-row-item"><span className="dot-box expired-dot" />Time Expired</span>
              </div>
            </div>
            <p className="active-question-text">{paperQuestions[currentQIndex].description}</p>


            {paperQuestions[currentQIndex].type === 'MCQS' && <div className="options-container-box">
              <label className="options-title-label">Select Correct Option:</label>
              {Object.entries(paperQuestions[currentQIndex].options || {}).filter(([key, value]) => value != null && String(value).trim() !== '').map(([key, value]) => {
  
  
                const questionId = paperQuestions[currentQIndex]._id;
                return <label className="mcq-option-label" key={key}><input className="mcq-radio-input" type="radio" name={`mcq_${questionId}`} checked={studentAnswers[questionId] === value} onChange={() => updateAnswer(questionId, value)} />{value}</label>;
              })}
            </div>}




            
            {paperQuestions[currentQIndex].type === 'True/False' && <div className="options-container-box">
              <label className="options-title-label">Select Answer:</label>
              <select value={studentAnswers[paperQuestions[currentQIndex]._id] || ''} onChange={(event) => updateAnswer(paperQuestions[currentQIndex]._id, event.target.value)}>
                <option value="">-- Select Answer --</option><option value="True">True</option><option value="False">False</option>
              </select>
            </div>}
            {['Short Question', 'Long Question'].includes(paperQuestions[currentQIndex].type) && <div className="options-container-box">
              <label className="options-title-label">Your Answer:</label><textarea rows="5" placeholder="Type your answer here..." value={studentAnswers[paperQuestions[currentQIndex]._id] || ''} onChange={(event) => updateAnswer(paperQuestions[currentQIndex]._id, event.target.value)} />
            </div>}
            <div className="modal-footer-nav">
              <button type="button" disabled={currentQIndex === 0 || isSubmitting} onClick={handlePrevQuestion}>Previous</button>
              {currentQIndex === paperQuestions.length - 1 ? <button type="button" className="success" disabled={isSubmitting} onClick={handleSubmitExam}>{isSubmitting ? 'Submitting...' : 'Submit Exam'}</button>
                : <button type="button" disabled={isSubmitting} onClick={handleNextQuestion}>Next Question</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentMyExams;
