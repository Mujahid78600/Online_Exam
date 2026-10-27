import React, { useEffect } from 'react';

const PrintableResultCard = ({ attempt, onClose }) => {
  useEffect(() => {
    if (!attempt) return;

    document.body.classList.add('printing-result');

    return () => {
      document.body.classList.remove('printing-result');
    };
  }, [attempt]);

  if (!attempt) return null;

  const studentName =
    attempt.studentName ||
    attempt.student_id?.name ||
    attempt.student?.name ||
    attempt.user?.name ||
    'N/A';

  const studentEmail =
    attempt.studentEmail ||
    attempt.student_id?.email ||
    attempt.student?.email ||
    attempt.user?.email ||
    'N/A';

  const examTitle =
    attempt.exam_schedule_id?.exam_name ||
    attempt.exam_name ||
    'N/A';

  const status = attempt.status || 'Submitted';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay result-print-overlay">
      <div className="result-print-modal">
        <div id="printableArea" className="printable-result-card">

          {/* Report Header */}
          <div className="result-report-header">
            <h2>OFFICIAL EXAM RESULT REPORT</h2>
            <p>Online Examination System Portal</p>
          </div>

          {/* Student and Exam Information */}
          <div className="result-student-info">
            <div>
              <p>
                <strong>Student Name:</strong> {studentName}
              </p>

              <p>
                <strong>Student Email:</strong> {studentEmail}
              </p>
            </div>

            <div>
              <p>
                <strong>Exam Title:</strong> {examTitle}
              </p>

              <p>
                <strong>Status:</strong>{' '}
                <span className="result-status">{status}</span>
              </p>
            </div>
          </div>

          {/* Answers Breakdown */}
          <h4 className="result-breakdown-title">
            Question Answers Breakdown:
          </h4>

          <table className="result-answers-table">
            <thead>
              <tr>
                <th className="result-col-number">#</th>
                <th className="result-col-question">Question</th>
                <th className="result-col-student-answer">
                  Student Answer
                </th>
                <th className="result-col-correct-answer">
                  Correct Answer
                </th>
                <th className="result-col-marks">Marks</th>
                <th className="result-col-remarks">Remarks</th>
              </tr>
            </thead>

            <tbody>
              {attempt.answers?.length > 0 ? (
                attempt.answers.map((ans, idx) => (
                  <tr key={ans._id || idx}>
                    <td>{idx + 1}</td>

                    <td className="result-question-cell">
                      {ans.question_id?.description || '-'}
                    </td>

                    <td>
                      {ans.student_answer || '-'}
                    </td>

                    <td>
                      {ans.question_id?.correct_answer || 'N/A'}
                    </td>

                    <td>
                      {(ans.auto_marks_obtained || 0) +
                        (ans.manual_marks_obtained || 0)}
                      {' / '}
                      {ans.question_id?.total_marks || 0}
                    </td>

                    <td>
                      {ans.instructor_remarks || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="result-no-answers">
                    No answer details available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Total Marks */}
          <div className="result-total-marks">
            Total Marks Obtained: {attempt.total_score}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="result-card-actions no-print">
          <button
            type="button"
            className="success"
            onClick={handlePrint}
          >
            Print Result Card
          </button>

          <button
            type="button"
            className="danger"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintableResultCard;