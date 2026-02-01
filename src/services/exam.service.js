const Exam = require('../models/Exam');
const Result = require('../models/Result');
const ReportCard = require('../models/ReportCard');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

// Exam Services
exports.getExams = async (institutionId, query) => {
  const { page = 1, limit = 20, class: classId, subject, examType, status, term, academicYear, startDate, endDate, search } = query;
  
  const filter = { institution: institutionId };
  if (classId) filter.class = classId;
  if (subject) filter.subject = subject;
  if (examType) filter.examType = examType;
  if (status) filter.status = status;
  if (term) filter.term = term;
  if (academicYear) filter.academicYear = academicYear;
  if (startDate && endDate) {
    filter.examDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;
  const [exams, total] = await Promise.all([
    Exam.find(filter)
      .populate('class', 'name code')
      .populate('section', 'name')
      .populate('subject', 'name code')
      .populate('invigilator', 'firstName lastName email name')
      .sort({ examDate: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Exam.countDocuments(filter)
  ]);

  return {
    data: exams,
    meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
  };
};

exports.getExamById = async (id, institutionId) => {
  const exam = await Exam.findOne({ _id: id, institution: institutionId })
    .populate('class', 'name code')
    .populate('section', 'name')
    .populate('subject', 'name code')
    .populate('invigilator', 'firstName lastName email name')
    .populate('createdBy', 'firstName lastName');
  if (!exam) throw ApiError.notFound('Exam not found');
  return exam;
};

exports.createExam = async (data, institutionId) => {
  // Clean empty strings for optional ObjectId fields
  const cleanData = { ...data, institution: institutionId };
  if (!cleanData.section) delete cleanData.section;
  if (!cleanData.invigilator) delete cleanData.invigilator;
  
  const exam = await Exam.create(cleanData);
  return exam.populate([
    { path: 'class', select: 'name code' },
    { path: 'section', select: 'name' },
    { path: 'subject', select: 'name code' },
    { path: 'invigilator', select: 'firstName lastName email name' }
  ]);
};

exports.updateExam = async (id, data, institutionId) => {
  // Clean empty strings for optional ObjectId fields
  const cleanData = { ...data };
  if (!cleanData.section) cleanData.section = null;
  if (!cleanData.invigilator) cleanData.invigilator = null;
  
  const exam = await Exam.findOneAndUpdate(
    { _id: id, institution: institutionId },
    cleanData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'class', select: 'name code' },
    { path: 'section', select: 'name' },
    { path: 'subject', select: 'name code' },
    { path: 'invigilator', select: 'firstName lastName email name' }
  ]);
  if (!exam) throw ApiError.notFound('Exam not found');
  return exam;
};

exports.deleteExam = async (id, institutionId) => {
  const exam = await Exam.findOneAndDelete({ _id: id, institution: institutionId });
  if (!exam) throw ApiError.notFound('Exam not found');
  await Result.deleteMany({ exam: id });
  return { message: 'Exam and associated results deleted' };
};

// Result Services
exports.getResults = async (institutionId, query) => {
  const { page = 1, limit = 20, exam, student, class: classId, section, subject, status, term, academicYear, search } = query;
  
  const filter = { institution: institutionId };
  if (exam) filter.exam = exam;
  if (student) filter.student = student;
  if (classId) filter.class = classId;
  if (section) filter.section = section;
  if (subject) filter.subject = subject;
  if (status) filter.status = status;
  if (term) filter.term = term;
  if (academicYear) filter.academicYear = academicYear;

  // If search is provided, find matching students first
  let studentIds = null;
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    const matchingStudents = await User.find({
      institution: institutionId,
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { name: searchRegex },
        { admissionNumber: searchRegex }
      ]
    }).select('_id');
    studentIds = matchingStudents.map(s => s._id);
    filter.student = { $in: studentIds };
  }

  const skip = (page - 1) * limit;
  const [results, total] = await Promise.all([
    Result.find(filter)
      .populate('exam', 'name examType examDate totalMarks')
      .populate('student', 'firstName lastName email name admissionNumber studentData')
      .populate('class', 'name')
      .populate('section', 'name')
      .populate('subject', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Result.countDocuments(filter)
  ]);

  return {
    data: results,
    meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
  };
};

exports.getResultById = async (id, institutionId) => {
  const result = await Result.findOne({ _id: id, institution: institutionId })
    .populate('exam')
    .populate('student', 'firstName lastName email name admissionNumber studentData')
    .populate('class', 'name')
    .populate('section', 'name')
    .populate('subject', 'name code')
    .populate('enteredBy', 'firstName lastName')
    .populate('verifiedBy', 'firstName lastName');
  if (!result) throw ApiError.notFound('Result not found');
  return result;
};

exports.getStudentResults = async (studentId, institutionId, query) => {
  const { term, academicYear } = query;
  const filter = { student: studentId, institution: institutionId };
  if (term) filter.term = term;
  if (academicYear) filter.academicYear = academicYear;

  return Result.find(filter)
    .populate('exam', 'name examType examDate totalMarks')
    .populate('subject', 'name code')
    .sort({ 'exam.examDate': -1 });
};

exports.createResult = async (data, institutionId) => {
  const existing = await Result.findOne({ exam: data.exam, student: data.student });
  if (existing) throw ApiError.badRequest('Result already exists for this student in this exam');
  
  const exam = await Exam.findById(data.exam);
  if (!exam) throw ApiError.notFound('Exam not found');
  
  const result = await Result.create({
    ...data,
    institution: institutionId,
    totalMarks: exam.totalMarks,
    class: exam.class,
    section: exam.section,
    subject: exam.subject,
    term: exam.term,
    academicYear: exam.academicYear,
    status: data.marksObtained >= exam.passingMarks ? 'pass' : 'fail'
  });
  return result;
};

exports.createBulkResults = async (results, userId, institutionId) => {
  const exam = await Exam.findById(results[0]?.exam);
  if (!exam) throw ApiError.notFound('Exam not found');

  const bulkResults = results.map(r => ({
    ...r,
    institution: institutionId,
    enteredBy: userId,
    totalMarks: exam.totalMarks,
    class: exam.class,
    section: exam.section,
    subject: exam.subject,
    term: exam.term,
    academicYear: exam.academicYear,
    status: r.marksObtained >= exam.passingMarks ? 'pass' : 'fail'
  }));

  return Result.insertMany(bulkResults, { ordered: false });
};

exports.updateResult = async (id, data, institutionId) => {
  const result = await Result.findOneAndUpdate(
    { _id: id, institution: institutionId },
    data,
    { new: true, runValidators: true }
  ).populate(['exam', 'student', 'subject']);
  if (!result) throw ApiError.notFound('Result not found');
  return result;
};

exports.deleteResult = async (id, institutionId) => {
  const result = await Result.findOneAndDelete({ _id: id, institution: institutionId });
  if (!result) throw ApiError.notFound('Result not found');
};

exports.verifyResults = async (resultIds, userId, institutionId) => {
  return Result.updateMany(
    { _id: { $in: resultIds }, institution: institutionId },
    { isVerified: true, verifiedBy: userId }
  );
};

// Report Card Services
exports.getReportCards = async (institutionId, query) => {
  const { page = 1, limit = 20, class: classId, section, term, academicYear, status, student, search } = query;
  
  const filter = { institution: institutionId };
  if (classId) filter.class = classId;
  if (section) filter.section = section;
  if (term) filter.term = term;
  if (academicYear) filter.academicYear = academicYear;
  if (status) filter.status = status;
  if (student) filter.student = student;

  // If search is provided, find matching students first
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    const matchingStudents = await User.find({
      institution: institutionId,
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { name: searchRegex },
        { admissionNumber: searchRegex }
      ]
    }).select('_id');
    filter.student = { $in: matchingStudents.map(s => s._id) };
  }

  const skip = (page - 1) * limit;
  const [reportCards, total] = await Promise.all([
    ReportCard.find(filter)
      .populate('student', 'firstName lastName email name admissionNumber studentData profileImage')
      .populate('class', 'name code')
      .populate('section', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    ReportCard.countDocuments(filter)
  ]);

  return {
    data: reportCards,
    meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
  };
};

exports.getReportCardById = async (id, institutionId) => {
  const reportCard = await ReportCard.findOne({ _id: id, institution: institutionId })
    .populate('student', 'firstName lastName email name admissionNumber studentData profileImage')
    .populate('class', 'name code')
    .populate('section', 'name')
    .populate('subjectResults.subject', 'name code')
    .populate('generatedBy', 'firstName lastName')
    .populate('publishedBy', 'firstName lastName');
  if (!reportCard) throw ApiError.notFound('Report card not found');
  return reportCard;
};

exports.getStudentReportCard = async (studentId, institutionId, query) => {
  const { term, academicYear } = query;
  const filter = { student: studentId, institution: institutionId };
  if (term) filter.term = term;
  if (academicYear) filter.academicYear = academicYear;

  return ReportCard.find(filter)
    .populate('class', 'name')
    .populate('section', 'name')
    .populate('subjectResults.subject', 'name code')
    .sort({ createdAt: -1 });
};

exports.generateReportCard = async (data, userId, institutionId) => {
  const { studentId, classId, section, term, academicYear } = data;

  // Get all results for the student - try with term/year first, then without
  let results = await Result.find({
    student: studentId,
    class: classId,
    institution: institutionId,
    term,
    academicYear
  }).populate('exam subject');

  // If no results found with term/year filter, try without them
  if (results.length === 0) {
    results = await Result.find({
      student: studentId,
      class: classId,
      institution: institutionId
    }).populate('exam subject');
  }

  // If still no results, try just by student and institution
  if (results.length === 0) {
    results = await Result.find({
      student: studentId,
      institution: institutionId
    }).populate('exam subject');
  }

  // Group results by subject
  const subjectMap = {};
  results.forEach(r => {
    // Skip if subject or exam is not populated
    if (!r.subject || !r.exam) return;
    
    const subjectId = r.subject._id.toString();
    if (!subjectMap[subjectId]) {
      subjectMap[subjectId] = {
        subject: r.subject._id,
        subjectName: r.subject.name,
        results: [],
        totalMarksObtained: 0,
        totalMaxMarks: 0
      };
    }
    subjectMap[subjectId].results.push({
      examType: r.exam.examType,
      examName: r.exam.name,
      marksObtained: r.marksObtained || 0,
      totalMarks: r.totalMarks || 0,
      percentage: r.percentage || 0,
      grade: r.grade || 'N/A'
    });
    subjectMap[subjectId].totalMarksObtained += (r.marksObtained || 0);
    subjectMap[subjectId].totalMaxMarks += (r.totalMarks || 0);
  });

  // Calculate averages
  const subjectResults = Object.values(subjectMap).map(s => {
    s.averagePercentage = s.totalMaxMarks > 0 ? Math.round((s.totalMarksObtained / s.totalMaxMarks) * 100 * 100) / 100 : 0;
    if (s.averagePercentage >= 90) s.finalGrade = 'A+';
    else if (s.averagePercentage >= 80) s.finalGrade = 'A';
    else if (s.averagePercentage >= 70) s.finalGrade = 'B+';
    else if (s.averagePercentage >= 60) s.finalGrade = 'B';
    else if (s.averagePercentage >= 50) s.finalGrade = 'C+';
    else if (s.averagePercentage >= 40) s.finalGrade = 'C';
    else if (s.averagePercentage >= 33) s.finalGrade = 'D';
    else s.finalGrade = 'F';
    return s;
  });

  const totalMarksObtained = subjectResults.reduce((sum, s) => sum + s.totalMarksObtained, 0);
  const totalMaxMarks = subjectResults.reduce((sum, s) => sum + s.totalMaxMarks, 0);
  const overallPercentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100 * 100) / 100 : 0;
  
  // Calculate overall grade
  let overallGrade;
  if (overallPercentage >= 90) overallGrade = 'A+';
  else if (overallPercentage >= 80) overallGrade = 'A';
  else if (overallPercentage >= 70) overallGrade = 'B+';
  else if (overallPercentage >= 60) overallGrade = 'B';
  else if (overallPercentage >= 50) overallGrade = 'C+';
  else if (overallPercentage >= 40) overallGrade = 'C';
  else if (overallPercentage >= 33) overallGrade = 'D';
  else overallGrade = 'F';

  const reportCard = await ReportCard.findOneAndUpdate(
    { student: studentId, academicYear, term, institution: institutionId },
    {
      student: studentId,
      class: classId,
      section,
      institution: institutionId,
      academicYear,
      term,
      subjectResults,
      totalMarksObtained,
      totalMaxMarks,
      overallPercentage,
      overallGrade,
      generatedBy: userId,
      status: 'generated'
    },
    { new: true, upsert: true, runValidators: true }
  );

  return reportCard;
};

exports.generateBulkReportCards = async (data, userId, institutionId) => {
  const { classId, section, term, academicYear } = data;
  
  // Get all students who have results for this class
  const resultsWithStudents = await Result.find({
    class: classId,
    institution: institutionId
  }).distinct('student');
  
  // Also get students assigned to the class in their profile
  const studentFilter = { 
    role: 'student', 
    institution: institutionId,
    $or: [
      { 'studentData.class': classId },
      { _id: { $in: resultsWithStudents } }
    ]
  };
  
  const students = await User.find(studentFilter).select('_id');
  
  if (students.length === 0) {
    // Fallback: just use students from results
    const reportCards = await Promise.all(
      resultsWithStudents.map(studentId => 
        this.generateReportCard({ studentId, classId, section, term, academicYear }, userId, institutionId)
      )
    );
    
    const sorted = reportCards.filter(rc => rc.overallPercentage > 0).sort((a, b) => b.overallPercentage - a.overallPercentage);
    await Promise.all(sorted.map((rc, idx) => 
      ReportCard.findByIdAndUpdate(rc._id, { rank: idx + 1, totalStudents: sorted.length })
    ));
    
    return { generated: reportCards.length };
  }
  
  const reportCards = await Promise.all(
    students.map(s => this.generateReportCard({ studentId: s._id, classId, section, term, academicYear }, userId, institutionId))
  );
  
  // Calculate ranks (only for those with scores)
  const sorted = reportCards.filter(rc => rc.overallPercentage > 0).sort((a, b) => b.overallPercentage - a.overallPercentage);
  await Promise.all(sorted.map((rc, idx) => 
    ReportCard.findByIdAndUpdate(rc._id, { rank: idx + 1, totalStudents: sorted.length })
  ));
  
  return { generated: reportCards.length };
};

exports.updateReportCard = async (id, data, institutionId) => {
  const reportCard = await ReportCard.findOneAndUpdate(
    { _id: id, institution: institutionId },
    data,
    { new: true, runValidators: true }
  );
  if (!reportCard) throw ApiError.notFound('Report card not found');
  return reportCard;
};

exports.publishReportCards = async (reportCardIds, userId, institutionId) => {
  return ReportCard.updateMany(
    { _id: { $in: reportCardIds }, institution: institutionId },
    { status: 'published', publishedAt: new Date(), publishedBy: userId }
  );
};

exports.deleteReportCard = async (id, institutionId) => {
  const reportCard = await ReportCard.findOneAndDelete({ _id: id, institution: institutionId });
  if (!reportCard) throw ApiError.notFound('Report card not found');
};

// Statistics
exports.getExamStats = async (institutionId, query) => {
  const { classId, term, academicYear } = query;
  const filter = { institution: institutionId };
  if (classId) filter.class = classId;
  if (term) filter.term = term;
  if (academicYear) filter.academicYear = academicYear;

  const [totalExams, results, reportCards] = await Promise.all([
    Exam.countDocuments(filter),
    Result.aggregate([
      { $match: filter },
      { $group: {
        _id: null,
        totalResults: { $sum: 1 },
        avgPercentage: { $avg: '$percentage' },
        passCount: { $sum: { $cond: [{ $eq: ['$status', 'pass'] }, 1, 0] } },
        failCount: { $sum: { $cond: [{ $eq: ['$status', 'fail'] }, 1, 0] } }
      }}
    ]),
    ReportCard.countDocuments({ ...filter, status: 'published' })
  ]);

  const resultStats = results[0] || { totalResults: 0, avgPercentage: 0, passCount: 0, failCount: 0 };
  
  return {
    totalExams,
    totalResults: resultStats.totalResults,
    averagePercentage: Math.round(resultStats.avgPercentage * 100) / 100 || 0,
    passRate: resultStats.totalResults > 0 ? Math.round((resultStats.passCount / resultStats.totalResults) * 100) : 0,
    publishedReportCards: reportCards
  };
};
