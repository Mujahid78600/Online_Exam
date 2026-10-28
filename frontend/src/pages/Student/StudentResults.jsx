import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { filterTableById } from '../../utils/tableSearch';

const API_BASE = 'https://online-exam-evgn.vercel.app';

const StudentResults = ({ user, studentProfile, setPrintAttempt }) => {
  const [results, setResults] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE}/api/extra/results/student`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setResults(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load student results:', err);
      setError(err.response?.data?.message || 'Unable to load results. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    if (searchText) {
      filterTableById('studentResultsTable', searchText);
    } else {
      filterTableById('studentResultsTable', '');
    }
  }, [searchText, results]);

  const getStudentName = () =>
    studentProfile?.name || user?.name || '';

  const getStudentEmail = () =>
    studentProfile?.email || user?.email || '';

  return (
    <div className="main-card">
      <h3 className="card-title">My Exam Results</h3>
      <hr className="card-divider" />

      <input
        className="dashboard-search-input"
        type="text"
        placeholder="Search Results..."
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        aria-label="Search exam results"
      />

      {loading ? (
        <p>Loading results...</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" className="success" onClick={fetchResults}>
            Retry
          </button>
        </div>
      ) : results.length === 0 ? (
        <p>No exam results found.</p>
      ) : (
        <table id="studentResultsTable">
          <thead>
            <tr>
              <th>Exam Title</th>
              <th>Score</th>
              <th>Status</th>
              <th>Print Result</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result._id}>
                <td><strong>{result.exam_schedule_id?.exam_name || 'Exam'}</strong></td>
                <td>{result.total_score ?? 0}</td>
                <td>
                  <span
                    className={`result-status-badge ${
                      String(result.status).toLowerCase() === 'passed'
                        ? 'pass-status'
                        : 'fail-status'
                    }`}
                  >
                    {result.status || 'Unknown'}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="success"
                    onClick={() =>
                      setPrintAttempt({
                        ...result,
                        studentName: getStudentName(),
                        studentEmail: getStudentEmail()
                      })
                    }
                  >
                    Print Result Card
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentResults;
