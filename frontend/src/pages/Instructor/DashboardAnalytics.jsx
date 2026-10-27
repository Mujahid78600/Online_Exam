import React, { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const PAGE_SIZE = 7;
const PASS_COLOR = '#16a34a';
const FAIL_COLOR = '#ef4444';

const getId = (value) => {
  if (value === null || value === undefined) return '';

  if (typeof value === 'object') {
    return String(value._id ?? value.id ?? '');
  }

  return String(value);
};

const normalize = (value) =>
  String(value ?? '').trim().toLowerCase();

const getGrade = (percentage) => {
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 75) return 'B+';
  if (percentage >= 71) return 'B';
  if (percentage >= 68) return 'B-';
  if (percentage >= 61) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

const getGradeClass = (grade) =>
  `grade-${grade.replace('+', 'plus').replace('-', 'minus')}`;

const DashboardAnalytics = ({
  submittedExams = [],
  studentsList = [],
  exams = []
}) => {
  const [department, setDepartment] = useState('');
  const [className, setClassName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [department, className, studentId]);

  // Students indexed by ID
  const studentsById = useMemo(() => {
    return new Map(
      studentsList.map((student) => [
        getId(student._id),
        student
      ])
    );
  }, [studentsList]);

  // Exams indexed by ID
  const examsById = useMemo(() => {
    return new Map(
      exams.map((exam) => [
        getId(exam._id),
        exam
      ])
    );
  }, [exams]);

  // Department dropdown options
  const departments = useMemo(() => {
    return [
      ...new Set(
        studentsList
          .map((student) => student.department)
          .filter((value) => String(value ?? '').trim() !== '')
      )
    ].sort((a, b) => String(a).localeCompare(String(b)));
  }, [studentsList]);

  // Class dropdown options depend on department
  const availableClasses = useMemo(() => {
    return [
      ...new Set(
        studentsList
          .filter((student) =>
            !department ||
            normalize(student.department) === normalize(department)
          )
          .map((student) => student.class)
          .filter((value) => String(value ?? '').trim() !== '')
      )
    ].sort((a, b) => String(a).localeCompare(String(b)));
  }, [studentsList, department]);

  // Student dropdown options depend on department and class
  const availableStudents = useMemo(() => {
    return studentsList.filter((student) =>
      (!department ||
        normalize(student.department) === normalize(department)) &&
      (!className ||
        normalize(student.class) === normalize(className))
    );
  }, [studentsList, department, className]);

  // Prepare all submitted exam results
  const allResults = useMemo(() => {
    return submittedExams.map((submission, index) => {
      const studentRef = submission.student_id;
      const resolvedStudentId = getId(studentRef);

      const listedStudent =
        studentsById.get(resolvedStudentId) || {};

      const populatedStudent =
        studentRef && typeof studentRef === 'object'
          ? studentRef
          : {};

      const student = {
        ...listedStudent,
        ...populatedStudent,
        name:
          populatedStudent.name ||
          listedStudent.name ||
          'Unknown Student',
        department:
          populatedStudent.department ||
          listedStudent.department ||
          '',
        class:
          populatedStudent.class ||
          listedStudent.class ||
          ''
      };

      const examRef = submission.exam_schedule_id;
      const resolvedExamId = getId(examRef);

      const scheduledExam =
        examsById.get(resolvedExamId) || {};

      const populatedExam =
        examRef && typeof examRef === 'object'
          ? examRef
          : {};

      const exam = {
        ...scheduledExam,
        ...populatedExam,
        exam_name:
          populatedExam.exam_name ||
          scheduledExam.exam_name ||
          'Unknown Exam',
        passing_marks:
          populatedExam.passing_marks ??
          scheduledExam.passing_marks,
        total_exam_marks:
          populatedExam.total_exam_marks ??
          scheduledExam.total_exam_marks
      };

      const rawScore = Number(submission.total_score);
      const score = Number.isFinite(rawScore) ? rawScore : 0;

      const totalMarksValue =
        exam.total_exam_marks ??
        submission.total_exam_marks;

      const parsedTotalMarks = Number(totalMarksValue);

      const totalMarks =
        totalMarksValue !== null &&
        totalMarksValue !== undefined &&
        totalMarksValue !== '' &&
        Number.isFinite(parsedTotalMarks) &&
        parsedTotalMarks > 0
          ? parsedTotalMarks
          : null;

      const percentage = totalMarks !== null
        ? Math.max(
            0,
            Math.min(100, (score / totalMarks) * 100)
          )
        : null;

      const passingMarksValue = exam.passing_marks;
      const passingMarks = Number(passingMarksValue);

      const hasPassingMarks =
        passingMarksValue !== null &&
        passingMarksValue !== undefined &&
        passingMarksValue !== '' &&
        Number.isFinite(passingMarks);

      let result = 'Pending';

      if (hasPassingMarks) {
        result = score >= passingMarks ? 'Pass' : 'Fail';
      } else {
        const status = normalize(submission.status);

        if (status === 'passed' || status === 'pass') {
          result = 'Pass';
        } else if (status === 'failed' || status === 'fail') {
          result = 'Fail';
        }
      }

      return {
        id: getId(submission._id) || `submission-${index}`,
        studentId: resolvedStudentId,
        studentName: student.name,
        department: student.department,
        className: student.class,
        examId: resolvedExamId,
        examName: exam.exam_name,
        score,
        totalMarks,
        percentage,
        result,
        grade: percentage !== null
          ? getGrade(percentage)
          : 'N/A'
      };
    });
  }, [submittedExams, studentsById, examsById]);

  // Apply filters and calculate ranks
  const filteredResults = useMemo(() => {
    return allResults
      .filter((row) =>
        (!department ||
          normalize(row.department) === normalize(department)) &&
        (!className ||
          normalize(row.className) === normalize(className)) &&
        (!studentId || row.studentId === studentId)
      )
      .sort((a, b) => {
        const percentageA = a.percentage ?? -1;
        const percentageB = b.percentage ?? -1;

        return (
          percentageB - percentageA ||
          a.studentName.localeCompare(b.studentName)
        );
      })
      .map((row, index) => ({
        ...row,
        rank: index + 1
      }));
  }, [allResults, department, className, studentId]);

  // Average percentage for each exam
  const barData = useMemo(() => {
    const groups = new Map();

    filteredResults.forEach((row) => {
      if (row.percentage === null) return;

      if (!groups.has(row.examId)) {
        groups.set(row.examId, {
          examId: row.examId,
          examName: row.examName,
          totalPercentage: 0,
          count: 0
        });
      }

      const group = groups.get(row.examId);

      group.totalPercentage += row.percentage;
      group.count += 1;
    });

    return [...groups.values()].map((group) => ({
      examId: group.examId,
      examName: group.examName,
      average: Number(
        (group.totalPercentage / group.count).toFixed(1)
      )
    }));
  }, [filteredResults]);

  // Pass / Fail analysis
  const passCount = filteredResults.filter(
    (row) => row.result === 'Pass'
  ).length;

  const failCount = filteredResults.filter(
    (row) => row.result === 'Fail'
  ).length;

  const evaluatedCount = passCount + failCount;

  const passPercentage = evaluatedCount > 0
    ? Math.round((passCount / evaluatedCount) * 100)
    : 0;

  const pieData = [
    { name: 'Pass', value: passCount },
    { name: 'Fail', value: failCount }
  ];

  // Pagination: 7 rows per page
  const totalPages = Math.max(
    1,
    Math.ceil(filteredResults.length / PAGE_SIZE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const pageResults = filteredResults.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const resetFilters = () => {
    setDepartment('');
    setClassName('');
    setStudentId('');
    setCurrentPage(1);
  };

  return (
    <div className="analytics-dashboard">

      {/* FILTERS */}
      <div className="analytics-filter-card">
        <div className="analytics-section-heading">
          <div>
            <h3>Student Performance Dashboard</h3>
            <p>
              Filter exam results by department, class or student.
            </p>
          </div>

          <button
            type="button"
            className="analytics-reset-btn"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>

        <div className="analytics-filter-grid">
          <div className="analytics-field">
            <label htmlFor="analytics-department">
              Department
            </label>

            <select
              id="analytics-department"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setClassName('');
                setStudentId('');
              }}
            >
              <option value="">All Departments</option>

              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="analytics-field">
            <label htmlFor="analytics-class">Class</label>

            <select
              id="analytics-class"
              value={className}
              onChange={(e) => {
                setClassName(e.target.value);
                setStudentId('');
              }}
            >
              <option value="">All Classes</option>

              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div className="analytics-field">
            <label htmlFor="analytics-student">Student</label>

            <select
              id="analytics-student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">All Students</option>

              {availableStudents.map((student) => (
                <option
                  key={getId(student._id)}
                  value={getId(student._id)}
                >
                  {student.name || 'Unknown Student'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="analytics-chart-grid">

        {/* EXAM PERFORMANCE */}
        <div className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h3>Exam Performance</h3>
              <p>Average marks percentage per exam</p>
            </div>
          </div>

          <div className="analytics-bar-scroll">
            {barData.length > 0 ? (
              <div
                className="analytics-bar-inner"
                style={{
                  width: `${Math.max(barData.length, 5) * 120}px`
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{
                      top: 20,
                      right: 15,
                      left: 0,
                      bottom: 5
                    }}
                    barCategoryGap="35%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="examName"
                      interval={0}
                      angle={0}
                      textAnchor="middle"
                      height={25}
                      tickMargin={8}
                      tick={{ fontSize: 16, fill: '#022a61' }}
                    />

                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      width={45}
                    />

                    <Tooltip
                      formatter={(value) => [
                        `${value}%`,
                        'Average'
                      ]}
                      labelFormatter={(label) => `Exam: ${label}`}
                    />

                    <Bar
                      dataKey="average"
                      name="Average Percentage"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                      label={{
                        position: 'top',
                        formatter: (value) => `${value}%`,
                        fontSize: 14, fontWeight: 700,
                        fill: '#02204a'
                        
                      }}
                    >
                      {barData.map((entry, index) => (
                        <Cell
                          key={entry.examId || entry.examName}
                          fill={
                            index % 2 === 0
                              ? '#3b82f6'
                              : '#f97316'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="analytics-empty">
                No exam results with valid total marks were found.
              </div>
            )}
          </div>
        </div>

        {/* PASS / FAIL ANALYSIS */}
        <div className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h3>Pass / Fail Analysis</h3>
              <p>Based on exam passing marks</p>
            </div>
          </div>

          <div className="analytics-donut-wrap">
            {evaluatedCount > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="90%"
                      paddingAngle={1}
                      stroke="none"
                    >
                      <Cell fill={PASS_COLOR} />
                      <Cell fill={FAIL_COLOR} />
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="analytics-donut-center">
                  <strong>{passPercentage}%</strong>
                  <span>Passed</span>
                </div>
              </>
            ) : (
              <div className="analytics-empty">
                No evaluated results available.
              </div>
            )}
          </div>

          <div className="analytics-chart-legend">
            <span>
              <i className="legend-pass" />
              Passed: {passCount}
            </span>

            <span>
              <i className="legend-fail" />
              Failed: {failCount}
            </span>
          </div>
        </div>
      </div>




      {/* STUDENT RESULTS TABLE */}
      <div className="analytics-panel analytics-results-panel">
        <div className="analytics-panel-heading analytics-results-heading">
          <div>
            <h3>Student Results</h3>
            <p>{filteredResults.length} result(s) found</p>
          </div>
        </div>

        <div>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student Name</th>
                <th>Department</th>
                <th>Class</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Result</th>
              </tr>
            </thead>

            <tbody>
              {pageResults.length > 0 ? (
                pageResults.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="analytics-rank">
                        {row.rank}
                      </span>
                    </td>

                    <td>
                      <strong>{row.studentName}</strong>
                    </td>

                    <td>{row.department || 'N/A'}</td>

                    <td>{row.className || 'N/A'}</td>

                    <td>
                      <div className="analytics-score">
                        <strong>
                          {row.percentage !== null
                            ? `${row.percentage.toFixed(1)}%`
                            : 'N/A'}
                        </strong>

                        <span>
                          {row.score} / {row.totalMarks ?? 'N/A'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`analytics-grade ${
                          row.grade === 'N/A'
                            ? 'grade-na'
                            : getGradeClass(row.grade)
                        }`}
                      >
                        {row.grade}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`analytics-result result-${row.result.toLowerCase()}`}
                      >
                        {row.result}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="analytics-no-data"
                  >
                    No student results found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="analytics-pagination">
          <span>
            {filteredResults.length > 0
              ? `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(
                  safePage * PAGE_SIZE,
                  filteredResults.length
                )} of ${filteredResults.length}`
              : 'Showing 0 results'}
          </span>

          <div className="analytics-pagination-buttons">
            <button
              type="button"
              aria-label="Previous page"
              disabled={safePage === 1}
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
            >
              ‹
            </button>

            <span>
              {safePage} / {totalPages}
            </span>

            <button
              type="button"
              aria-label="Next page"
              disabled={safePage >= totalPages}
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1)
                )
              }
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;
