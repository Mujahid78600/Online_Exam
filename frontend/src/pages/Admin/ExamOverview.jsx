
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { filterTableById } from '../../utils/tableSearch';

const API_BASE = 'http://localhost:5000';

const ExamOverview = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `${API_BASE}/api/exams/list`,
        getHeaders()
      );

      setExams(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error('Failed to load exams:', err);
      setError('Unable to load exams. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  return (
    <div className="main-card">
      <div className="card-header-wrapper">
        <h3 className="card-title">System Exams Overview</h3>
      </div>

      <hr className="card-divider" />

      <input
        type="text"
        placeholder="Search Exams..."
        style={{
          width: '320px',
          maxWidth: '100%',
          marginBottom: 10
        }}
        onChange={(event) =>
          filterTableById(
            'adminExamsTable',
            event.target.value
          )
        }
      />

      {loading && (
        <p role="status">Loading exams...</p>
      )}

      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            type="button"
            onClick={fetchExams}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table id="adminExamsTable">
          <thead>
            <tr>
              <th>Exam Name</th>
              <th>Instructor</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Passing Marks</th>
            </tr>
          </thead>

          <tbody>
            {!loading && exams.map((exam) => (
              <tr key={exam._id}>
                <td>
                  <strong>
                    {exam.exam_name || '—'}
                  </strong>
                </td>

                <td>
                  {exam.instructor_id?.name || 'Instructor'}
                </td>

                <td>
                  {exam.start_time
                    ? new Date(
                        exam.start_time
                      ).toLocaleString()
                    : '—'}
                </td>

                <td>
                  {exam.end_time
                    ? new Date(
                        exam.end_time
                      ).toLocaleString()
                    : '—'}
                </td>

                <td>
                  {exam.passing_marks ?? '—'}
                </td>
              </tr>
            ))}

            {!loading && !error && exams.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: 'center' }}
                >
                  No exams found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExamOverview;
