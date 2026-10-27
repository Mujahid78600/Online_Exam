const ExamSchedule = require('../models/ExamSchedule');
const ExamQuestions = require('../models/ExamQuestions');
const StudentExam = require('../models/StudentExam');
const QuestionBank = require('../models/QuestionBank');

// 1. Schedule New Exam & Assign Students
exports.scheduleExam = async (req, res) => {
  try {
    const { exam_name, start_time, end_time, assigned_students, passing_marks } = req.body;

    const exam = await ExamSchedule.create({
      instructor_id: req.user._id,
      exam_name,
      start_time,
      end_time,
      passing_marks: Number(passing_marks),
      assigned_students: assigned_students || []
    });

    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Get Scheduled Exams With Dynamic Total Marks & Questions Count
exports.getExams = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'instructor') {
      query.instructor_id = req.user._id;
    } else if (req.user.role === 'student') {
      query.assigned_students = req.user._id;
    }

    const exams = await ExamSchedule.find(query)
      .populate('assigned_students', 'name email department class')
      .populate('instructor_id', 'name email')
      .lean();

    const examsWithDetails = await Promise.all(exams.map(async (exam) => {
      // Mapped questions fetch karein aur unke marks dynamically sum karein
      const mappedQuestions = await ExamQuestions.find({ exam_schedule_id: exam._id }).populate('question_id');
      
      let totalMarks = 0;
      mappedQuestions.forEach(m => {
        if (m.question_id && m.question_id.total_marks) {
          totalMarks += Number(m.question_id.total_marks) || 0;
        }
      });

      
      const qCount = mappedQuestions.length;

      return { 
        ...exam, 
        questions_count: qCount,
        total_exam_marks: totalMarks,
        passing_marks: exam.passing_marks ?? 0
      };
    }));

    res.json(examsWithDetails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Update Scheduled Exam (Fixed: Missing fields purana data delete nahi karengi)
exports.updateExam = async (req, res) => {
  try {
    const { exam_name, start_time, end_time, assigned_students, passing_marks } = req.body;

    // Pehle existing exam fetch karein taake purana data secure rahay
    const existingExam = await ExamSchedule.findById(req.params.id);
    if (!existingExam) {
      return res.status(404).json({ message: 'Exam schedule not found' });
    }

    // Agar request mein assigned_students nahi aaye ya empty hain, tou purane wale retain rakhein
    const finalStudents = (assigned_students && assigned_students.length > 0) 
      ? assigned_students 
      : existingExam.assigned_students;

    const updatedExam = await ExamSchedule.findByIdAndUpdate(
      req.params.id,
      {
        exam_name: exam_name || existingExam.exam_name,
        start_time: start_time || existingExam.start_time,
        end_time: end_time || existingExam.end_time,
        assigned_students: finalStudents,
        passing_marks: passing_marks !== undefined ? Number(passing_marks) : existingExam.passing_marks
      },
      { new: true, runValidators: true }
    );

    res.json(updatedExam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. Delete Scheduled Exam
exports.deleteExam = async (req, res) => {
  try {
    const exam = await ExamSchedule.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam schedule not found' });
    }

    await ExamQuestions.deleteMany({ exam_schedule_id: req.params.id });

    res.json({ message: 'Exam schedule deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. Add / Map Questions to Exam (Fixed: Students remove nahi honge)
exports.addQuestionsToExam = async (req, res) => {
  try {
    const { exam_schedule_id, question_ids } = req.body;

    // Sirf purane mapped questions delete honge, ExamSchedule ya students bilkul safe rahenge
    await ExamQuestions.deleteMany({ exam_schedule_id });

    const records = question_ids.map(qid => ({
      exam_schedule_id,
      question_id: qid
    }));

    await ExamQuestions.insertMany(records);
    res.json({ message: 'Questions mapped to exam successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Existing Mapped Questions for Selected Exam
exports.getMappedQuestionsByExam = async (req, res) => {
  try {
    const mapped = await ExamQuestions.find({ exam_schedule_id: req.params.examId });
    const questionIds = mapped.map(m => m.question_id);
    res.json(questionIds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 6. Get Exam Paper Questions for Student Attempt
exports.getExamPaper = async (req, res) => {
  try {
    const questions = await ExamQuestions.find({ exam_schedule_id: req.params.examId })
      .populate('question_id');

    const paper = questions.map(q => q.question_id).filter(q => q !== null);

    res.json(paper);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 7. Submit Exam (Auto-check MCQs/True-False with robust matching)
exports.submitExam = async (req, res) => {
  try {
    const { exam_schedule_id, answers } = req.body;

    let totalScore = 0;

    const processedAnswers = await Promise.all(answers.map(async (ans) => {
      const qDetails = await QuestionBank.findById(ans.question_id);
      let autoMarks = 0;

      if (qDetails && (qDetails.type === 'MCQS' || qDetails.type === 'True/False')) {
        const studentAns = String(ans.student_answer || '').trim();
        const correctAns = String(qDetails.correct_answer || '').trim();

        let isCorrect = (studentAns.toLowerCase() === correctAns.toLowerCase());

        if (!isCorrect && qDetails.type === 'MCQS' && qDetails.options) {
          const correctKeyMap = {
            'option a': qDetails.options.option_a,
            'option b': qDetails.options.option_b,
            'option c': qDetails.options.option_c,
            'option d': qDetails.options.option_d
          };
          const actualTextValue = correctKeyMap[correctAns.toLowerCase()];
          if (actualTextValue && studentAns.toLowerCase() === String(actualTextValue).trim().toLowerCase()) {
            isCorrect = true;
          }
        }

        if (isCorrect) {
          autoMarks = qDetails.total_marks || 0;
          totalScore += autoMarks;
        }
      }

      return {
        question_id: ans.question_id,
        student_answer: ans.student_answer,
        auto_marks_obtained: autoMarks,
        manual_marks_obtained: 0,
        instructor_remarks: ''
      };
    }));

    const studentExam = await StudentExam.create({
      student_id: req.user._id,
      exam_schedule_id,
      answers: processedAnswers,
      total_score: totalScore,
      status: 'Submitted'
    });

    res.status(201).json(studentExam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 8. Evaluate Short/Long Questions & Add Remarks
exports.evaluateExam = async (req, res) => {
  try {
    const { examAttemptId, evaluatedAnswers } = req.body;

    const attempt = await StudentExam.findById(examAttemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Exam attempt not found' });
    }

    let totalScore = 0;

    attempt.answers.forEach(ans => {
      const evalData = evaluatedAnswers.find(
        e => e.question_id.toString() === ans.question_id.toString()
      );

      if (evalData) {
        ans.manual_marks_obtained = Number(evalData.manual_marks_obtained || 0);
        ans.instructor_remarks = evalData.instructor_remarks || '';
      }

      totalScore += (ans.auto_marks_obtained + ans.manual_marks_obtained);
    });

    attempt.total_score = totalScore;
    attempt.status = 'Evaluated';
    await attempt.save();

    res.json({ message: 'Exam evaluated successfully', attempt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};