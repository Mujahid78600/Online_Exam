import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const API_BASE = 'http://localhost:5000';

const StudentDashboardAnalytics = ({ assignedExams = [], studentUser = {}, user }) => {
  const [results, setResults] = useState([]);
  const [selectedResultExamId, setSelectedResultExamId] = useState('');
  const [resultsLoading, setResultsLoading] = useState(true);
  const [resultsError, setResultsError] = useState('');

  const fetchResults = useCallback(async () => {
    setResultsLoading(true);
    setResultsError('');

    try {
      const response = await axios.get(`${API_BASE}/api/extra/results/student`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setResults(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load analytics results:', error);
      setResultsError('Unable to load exam analytics. Please try again.');
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

const resultExamOptions = (Array.isArray(results) ? results : []).filter((result) => {
  const examId =
    result.exam_schedule_id?._id || result.exam_schedule_id;

  return examId;
});

// Select first available result by default.
useEffect(() => {
  if (resultExamOptions.length === 0) {
    setSelectedResultExamId('');
    return;
  }

  const selectionExists = resultExamOptions.some((result) => {
    const examId =
      result.exam_schedule_id?._id || result.exam_schedule_id;

    return String(examId) === String(selectedResultExamId);
  });

  if (!selectionExists) {
    const firstExamId =
      resultExamOptions[0].exam_schedule_id?._id ||
      resultExamOptions[0].exam_schedule_id;

    setSelectedResultExamId(String(firstExamId));
  }
}, [results, selectedResultExamId]);

const selectedExamResult = resultExamOptions.find((result) => {
  const examId =
    result.exam_schedule_id?._id || result.exam_schedule_id;

  return String(examId) === String(selectedResultExamId);
});





const selectedExamId =
  selectedExamResult?.exam_schedule_id?._id ||
  selectedExamResult?.exam_schedule_id;

const selectedExamDetails = {
  ...(assignedExams.find(
    (exam) => String(exam._id) === String(selectedExamId)
  ) || {}),
  ...(selectedExamResult?.exam_schedule_id &&
  typeof selectedExamResult.exam_schedule_id === 'object'
    ? selectedExamResult.exam_schedule_id
    : {})
};

const obtainedMarks = Number(
  selectedExamResult?.total_score ?? 0
);

// Calculate total marks from the questions in the result.
const totalMarksFromAnswers = Array.isArray(
  selectedExamResult?.answers
)
  ? selectedExamResult.answers.reduce((sum, answer) => {
      const marks = Number(
        answer.question_id?.total_marks ?? 0
      );

      return sum + (
        Number.isFinite(marks) && marks > 0 ? marks : 0
      );
    }, 0)
  : 0;

const totalMarksValue =
  selectedExamResult?.total_exam_marks ??
  selectedExamDetails?.total_exam_marks ??
  selectedExamDetails?.total_marks ??
  (totalMarksFromAnswers > 0 ? totalMarksFromAnswers : null);

const totalMarks = Number(totalMarksValue);

const validTotalMarks =
  totalMarksValue !== null &&
  totalMarksValue !== undefined &&
  totalMarksValue !== '' &&
  Number.isFinite(totalMarks) &&
  totalMarks > 0;

const scorePercentage = validTotalMarks
  ? Math.max(
      0,
      Math.min(100, (obtainedMarks / totalMarks) * 100)
    )
  : 0;




  // Calculate Class Average Percentage
const classAveragePercentage = (() => {
  const examResults = results.filter((result) => {
    const examId =
      result?.exam_schedule_id?._id ||
      result?.exam_schedule_id;

    return (
      String(examId) === String(selectedExamId) &&
      result?.total_score !== null &&
      result?.total_score !== undefined
    );
  });

  const percentages = examResults
    .map((result) => {
      const examId =
        result?.exam_schedule_id?._id ||
        result?.exam_schedule_id;

      const examDetails =
        typeof result?.exam_schedule_id === 'object'
          ? result.exam_schedule_id
          : assignedExams.find(
              (exam) => String(exam._id) === String(examId)
            );

      const answersTotal = Array.isArray(result?.answers)
        ? result.answers.reduce((sum, answer) => {
            const marks = Number(
              answer?.question_id?.total_marks ?? 0
            );

            return sum + (
              Number.isFinite(marks) && marks > 0 ? marks : 0
            );
          }, 0)
        : 0;

      const total = Number(
        result?.total_exam_marks ??
        examDetails?.total_exam_marks ??
        examDetails?.total_marks ??
        (answersTotal > 0 ? answersTotal : 0)
      );

      const obtained = Number(result.total_score);

      if (
        !Number.isFinite(total) ||
        total <= 0 ||
        !Number.isFinite(obtained)
      ) {
        return null;
      }

      return (obtained / total) * 100;
    })
    .filter((percentage) => percentage !== null);

  if (percentages.length === 0) return null;

  return percentages.reduce(
    (sum, percentage) => sum + percentage,
    0
  ) / percentages.length;
})();





// Calculate Class Highest and Lowest Percentages
const classPercentages = (Array.isArray(results) ? results : [])
  .filter((result) => {
    const examId =
      result?.exam_schedule_id?._id ||
      result?.exam_schedule_id;

    return (
      String(examId) === String(selectedExamId) &&
      result?.total_score !== null &&
      result?.total_score !== undefined
    );
  })
  .map((result) => {
    const examId =
      result?.exam_schedule_id?._id ||
      result?.exam_schedule_id;

    const examDetails =
      typeof result?.exam_schedule_id === 'object'
        ? result.exam_schedule_id
        : assignedExams.find(
            (exam) => String(exam._id) === String(examId)
          );

    const answersTotal = Array.isArray(result?.answers)
      ? result.answers.reduce((sum, answer) => {
          const marks = Number(
            answer?.question_id?.total_marks ?? 0
          );

          return sum + (
            Number.isFinite(marks) && marks > 0 ? marks : 0
          );
        }, 0)
      : 0;

    const total = Number(
      result?.total_exam_marks ??
      examDetails?.total_exam_marks ??
      examDetails?.total_marks ??
      (answersTotal > 0 ? answersTotal : 0)
    );

    const obtained = Number(result.total_score);

    if (
      !Number.isFinite(total) ||
      total <= 0 ||
      !Number.isFinite(obtained)
    ) {
      return null;
    }

    return (obtained / total) * 100;
  })
  .filter((percentage) => percentage !== null);

const classHighestScore =
  classPercentages.length > 0
    ? Math.max(...classPercentages)
    : null;

const classLowestScore =
  classPercentages.length > 0
    ? Math.min(...classPercentages)
    : null;




const selectedGrade = !validTotalMarks
  ? 'N/A'
  : scorePercentage >= 85
    ? 'A'
    : scorePercentage >= 80
      ? 'A-'
      : scorePercentage >= 75
        ? 'B+'
        : scorePercentage >= 71
          ? 'B'
          : scorePercentage >= 68
            ? 'B-'
            : scorePercentage >= 61
              ? 'C'
              : scorePercentage >= 50
                ? 'D'
                : 'F';

const selectedResultStatus = validTotalMarks
  ? scorePercentage >= 50
    ? 'Passed'
    : 'Failed'
  : 'N/A';


// Chart data for all attempted exams
const allExamChartData = (Array.isArray(results) ? results : [])
  .map((result) => {
    const examId =
      result?.exam_schedule_id?._id ||
      result?.exam_schedule_id;

    const examDetails =
      typeof result?.exam_schedule_id === 'object'
        ? result.exam_schedule_id
        : assignedExams.find(
            (exam) => String(exam._id) === String(examId)
          );

    const answersTotal = Array.isArray(result?.answers)
      ? result.answers.reduce((sum, answer) => {
          const marks = Number(
            answer?.question_id?.total_marks ?? 0
          );

          return sum + (
            Number.isFinite(marks) && marks > 0 ? marks : 0
          );
        }, 0)
      : 0;

    const totalMarks = Number(
      result?.total_exam_marks ??
      examDetails?.total_exam_marks ??
      examDetails?.total_marks ??
      (answersTotal > 0 ? answersTotal : 0)
    );

    const obtainedMarks = Number(result?.total_score);

    if (
      !Number.isFinite(totalMarks) ||
      totalMarks <= 0 ||
      !Number.isFinite(obtainedMarks)
    ) {
      return null;
    }

    return {
      name: examDetails?.exam_name || 'Exam',
      totalMarks,
      obtainedMarks
    };
  })
  .filter(Boolean);

  return (
      <div className="student-analytics-dashboard">

    <div className="student-analytics-header">
      <div>
        <h2>Student Performance Dashboard</h2>
        <p>
          Welcome back, {studentUser.name || user?.name}!
          Review your academic performance.
        </p>
      </div>

      <div className="student-exam-filter">
        {resultsLoading && <p role="status">Loading results...</p>}
        {resultsError && (
          <div role="alert">
            <p>{resultsError}</p>
            <button type="button" onClick={fetchResults}>Retry</button>
          </div>
        )}
        <label htmlFor="student-exam-select">
          Select Exam
        </label>

        <select
          id="student-exam-select"
          value={selectedResultExamId}
          onChange={(event) =>
            setSelectedResultExamId(event.target.value)
          }
        >
          {resultExamOptions.length === 0 && (
            <option value="">No results available</option>
          )}

          {resultExamOptions.map((result) => {
            const exam = result.exam_schedule_id;
            const examId =
              exam?._id || exam;

            return (
              <option
                key={result._id}
                value={String(examId)}
              >
                {exam?.exam_name || 'Exam'}
              </option>
            );
          })}
        </select>
      </div>
    </div>






{/* THREE SUMMARY CARDS */}
<div className="student-performance-cards">

  {/* Card 1: Score + Grade */}
  <div className="student-performance-card score-card">
    <h4>Your Score</h4>

<h2>
  {selectedExamResult ? (
    <>
      <span style={{ fontSize: '28px', fontWeight: '700' }}>
        {obtainedMarks}
      </span>
      <span style={{ fontSize: '16px', fontWeight: '400', color: '#3f4956' }}>
        {' / '}
        {validTotalMarks ? totalMarks : 'N/A'}
      </span>
    </>
  ) : (
    'N/A'
  )}
</h2>

    <p>
      Grade: {selectedGrade}
    </p>
  </div>

  {/* Card 2: Result Status */}
  <div className="student-performance-card status-card">
    <h4>Result Status</h4>

    <h2
      className={
        selectedResultStatus === 'Passed'
          ? 'student-status-passed'
          : selectedResultStatus === 'Failed'
            ? 'student-status-failed'
            : ''
      }
    >
      {selectedResultStatus}
    </h2>

    <p>Passing Marks: 50</p>
  </div>

  {/* Card 3: Class Average */}
  <div className="student-performance-card class-average-summary-card">
    <h4>Class Average</h4>

    <h2>
      {classAveragePercentage != null &&
      Number.isFinite(classAveragePercentage)
        ? `${classAveragePercentage.toFixed(1)}%`
        : 'N/A'}
    </h2>


<p>
  Highest: {
    classHighestScore !== null
      ? `${classHighestScore.toFixed(1)}%`
      : 'N/A'
  }
  {' | '}
  Lowest: {
    classLowestScore !== null
      ? `${classLowestScore.toFixed(1)}%`
      : 'N/A'
  }
</p>

    
  </div>

</div>





  







{/* FULL-WIDTH MARKS CHART - ALL EXAMS */}

<div className="student-marks-chart-card">
  <div className="student-marks-chart-heading">
    <div>
      <h3>Exam Marks Analysis</h3>
      <p>All Exams — Total Marks versus Obtained Marks</p>
    </div>
  </div>

  <div className="student-marks-chart">
    {allExamChartData.length > 0 ? (
      <div className="student-marks-chart-scroll">
        <div
          className="student-marks-chart-inner"
          style={{
            width: `${Math.max(
              800,
              allExamChartData.length * 180
            )}px`
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={allExamChartData}
              margin={{ top: 0, right: 20, left: 0, bottom: 5 }}
              barCategoryGap="25%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                interval={0}
                tick={{
                  fontSize: 14,
                  fill: '#475569',
                  fontWeight: 700
                }}
                angle={0}
                textAnchor="middle"
                height={25}
              />

              <YAxis
                type="number"
                allowDecimals={false}
                domain={[0, 'auto']}
              />

              <Tooltip />

              <Legend
                verticalAlign="top"
                align="left"
                
                content={() => (
                  <div className="student-marks-chart-legend">
                    <span className="legend-total">
                      <span className="legend-square">■</span>
                      Total Marks
                    </span>

                    <span className="legend-obtained">
                      <span className="legend-square">■</span>
                      Obtained Marks
                    </span>
                  </div>
                )}
              />

              <Bar
                dataKey="totalMarks"
                name="Total Marks"
                fill="#3b82f6"
                radius={[5, 5, 0, 0]}
                maxBarSize={40}
                isAnimationActive={false}
                label={{
                  position: 'top',
                  fill: '#3b82f6',
                  fontSize: 14,
                  fontWeight: 700,
                  offset: 5
                }}
              />

              <Bar
                dataKey="obtainedMarks"
                name="Obtained Marks"
                fill="#f97316"
                radius={[5, 5, 0, 0]}
                maxBarSize={40}
                isAnimationActive={false}
                label={{
                  position: 'top',
                  fill: '#f97316',
                  fontSize: 14,
                  fontWeight: 700,
                  offset: 5
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    ) : (
      <div className="student-analytics-empty">
        No exam results available yet.
      </div>
    )}
  </div>
</div>





</div>

  );
};

export default StudentDashboardAnalytics;
