import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { all, insert, one, remove, rows, scalar, update } from './db.js';
import { publicDbConfig } from './db-config.js';
import { ReportFactory } from './reports/ReportFactory.js';

const port = Number(process.env.PORT || 3001);
const execFileAsync = promisify(execFile);
const allowedOrigins = (process.env.FRONTEND_URL || 'http://127.0.0.1:5173,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigin = (req) => {
  const origin = req.headers.origin;
  if (!origin) return allowedOrigins[0] || '*';
  if (allowedOrigins.includes(origin)) return origin;
  if (process.env.NODE_ENV !== 'production') return origin;
  return allowedOrigins[0] || 'null';
};

const resources = {
  institutions: {
    table: 'institutions',
    fields: ['name', 'type', 'city', 'status'],
    defaults: { type: 'madarsa', status: 'Active' },
    numbers: [],
  },
  students: {
    table: 'students',
    fields: ['institutionId', 'name', 'grade', 'age', 'guardianName', 'phone', 'email', 'address', 'dateOfBirth', 'admissionDate', 'emergencyContact', 'medicalInfo', 'status', 'subjects'],
    defaults: { institutionId: 1, status: 'Active', subjects: 0 },
    numbers: ['institutionId', 'age', 'subjects'],
  },
  teachers: {
    table: 'teachers',
    fields: ['institutionId', 'name', 'subject', 'qualification', 'experience', 'phone', 'email', 'address', 'dateOfBirth', 'joinDate', 'salary', 'emergencyContact', 'specializations', 'status', 'classes'],
    defaults: { institutionId: 1, status: 'Active', classes: 0 },
    numbers: ['institutionId', 'experience', 'classes'],
  },
  courses: {
    table: 'courses',
    fields: ['institutionId', 'name', 'grade', 'teacher', 'description', 'students', 'duration', 'schedule', 'maxStudents', 'startDate', 'endDate', 'syllabus', 'prerequisites', 'status'],
    defaults: { institutionId: 1, status: 'Active', students: 0 },
    numbers: ['institutionId', 'students', 'maxStudents'],
  },
  exams: {
    table: 'exams',
    fields: ['institutionId', 'title', 'course', 'grade', 'teacher', 'date', 'time', 'duration', 'students', 'totalMarks', 'passingMarks', 'examType', 'instructions', 'syllabus', 'venue', 'status'],
    defaults: { institutionId: 1, status: 'Scheduled', examType: 'Written', students: 0 },
    numbers: ['institutionId', 'duration', 'students', 'totalMarks', 'passingMarks'],
  },
};

const send = (req, res, status, payload) => {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': corsOrigin(req),
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(payload));
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

const normalize = (config, body) => {
  const data = { ...config.defaults };
  for (const field of config.fields) {
    if (body[field] !== undefined) {
      data[field] = body[field] === '' ? null : body[field];
    }
  }
  for (const field of config.numbers) {
    if (data[field] !== undefined && data[field] !== null) {
      data[field] = Number(data[field]);
    }
  }
  return data;
};

const roleLabels = {
  admin: 'Admin',
  principal: 'Principal',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
};

const hashPassword = (password) => `sha256$${createHash('sha256').update(password).digest('hex')}`;

const passwordMatches = (submittedPassword, storedPassword) => {
  if (!storedPassword) return false;
  if (storedPassword.startsWith('sha256$')) return hashPassword(submittedPassword) === storedPassword;
  return submittedPassword === storedPassword;
};

const userPayload = (user) => ({
  email: user.email,
  name: user.name,
  role: user.role,
  label: roleLabels[user.role] || user.role,
  institutionId: Number(user.institutionId || 1),
  institutionName: user.institutionName || undefined,
  linkedStudentName: user.linkedStudentName || undefined,
  linkedTeacherName: user.linkedTeacherName || undefined,
});

const login = async (body) => {
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const institutionId = Number(body.institutionId || 0);
  if (!email || !password) throw new Error('Email and password are required');

  const matches = await rows(`
    SELECT users.*, institutions.name AS institutionName
    FROM users
    LEFT JOIN institutions ON institutions.id = users.institutionId
    WHERE LOWER(users.email) = :email AND users.status = 'Active'
    LIMIT 1
  `, { email });
  const user = matches[0];
  if (!user || !passwordMatches(password, user.password)) throw new Error('Invalid email or password');

  if (user.role === 'admin' && institutionId) {
    const selected = await rows('SELECT id, name FROM institutions WHERE id = :institutionId AND status = :status LIMIT 1', {
      institutionId,
      status: 'Active',
    });
    if (!selected[0]) throw new Error('Selected institution is not active');
    return userPayload({ ...user, institutionId, institutionName: selected[0].name });
  }

  return userPayload(user);
};

const register = async (body) => {
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const role = String(body.role || 'student');
  const institutionId = Number(body.institutionId || 1);
  const allowedRoles = ['teacher', 'student', 'parent'];

  if (!name || !email || !password) throw new Error('Name, email, and password are required');
  if (password.length < 6) throw new Error('Password must be at least 6 characters');
  if (!allowedRoles.includes(role)) throw new Error('Only teacher, student, and parent registration is allowed');

  const existing = await rows('SELECT id FROM users WHERE LOWER(email) = :email LIMIT 1', { email });
  if (existing[0]) throw new Error('Email is already registered');

  const institution = await rows('SELECT id, name FROM institutions WHERE id = :institutionId AND status = :status LIMIT 1', {
    institutionId,
    status: 'Active',
  });
  if (!institution[0]) throw new Error('Selected institution is not active');

  let linkedStudentName = role === 'student' ? name : String(body.linkedStudentName || '').trim() || null;
  if (role === 'parent') {
    if (!linkedStudentName) throw new Error('Parent registration requires a linked student');
    const [linkedStudent] = await rows('SELECT name, grade, guardianName FROM students WHERE institutionId = :institutionId AND name = :linkedStudentName LIMIT 1', {
      institutionId,
      linkedStudentName,
    });
    if (!linkedStudent) throw new Error('Linked student must exist in the selected institution');
  }

  const created = await insert('users', {
    institutionId,
    name,
    email,
    password: hashPassword(password),
    role,
    status: role === 'teacher' ? 'Active' : 'Pending',
    linkedStudentName,
    linkedTeacherName: role === 'teacher' ? name : null,
  });

  if (role === 'student') {
    const existingStudent = await rows('SELECT id FROM students WHERE institutionId = :institutionId AND (LOWER(email) = :email OR name = :name) LIMIT 1', {
      institutionId,
      email,
      name,
    });

    let studentRecord = existingStudent[0];
    if (!studentRecord) {
      studentRecord = await insert('students', {
        institutionId,
        name,
        grade: String(body.grade || 'Pending Assignment'),
        age: Number(body.age || 0),
        guardianName: String(body.guardianName || 'Pending Verification'),
        phone: String(body.phone || 'Pending'),
        email,
        address: String(body.address || ''),
        dateOfBirth: null,
        admissionDate: new Date(),
        emergencyContact: String(body.emergencyContact || ''),
        medicalInfo: String(body.medicalInfo || ''),
        status: 'Pending',
        subjects: 0,
      });
    }

    await insert('notifications', {
      institutionId,
      recipientRole: 'admin',
      recipientName: null,
      title: 'Student verification required',
      message: name + ' (' + email + ') registered as a student. Please verify details and assign grade/courses manually.',
      status: 'Unread',
      relatedType: 'student_registration',
      relatedId: studentRecord.id,
    });
  }

  if (role === 'parent') {
    await insert('notifications', {
      institutionId,
      recipientRole: 'admin',
      recipientName: null,
      title: 'Parent verification required',
      message: name + ' (' + email + ') registered as parent for ' + linkedStudentName + '. Please manually verify the parent-child relationship.',
      status: 'Unread',
      relatedType: 'parent_registration',
      relatedId: created.id,
    });
  }

  return userPayload({ ...created, institutionName: institution[0].name });
};

const leaveRequestPayload = async (body) => {
  const studentName = String(body.studentName || '').trim();
  const institutionId = Number(body.institutionId || 1);
  if (!studentName) throw new Error('Student name is required');
  if (!body.startDate || !body.endDate) throw new Error('Start date and end date are required');
  if (!String(body.reason || '').trim()) throw new Error('Leave reason is required');

  const [student] = await rows('SELECT grade, guardianName FROM students WHERE institutionId = :institutionId AND name = :studentName LIMIT 1', {
    institutionId,
    studentName,
  });

  return {
    institutionId,
    studentName,
    grade: student?.grade || String(body.grade || 'Unassigned'),
    requesterRole: body.requesterRole === 'parent' ? 'parent' : 'student',
    requesterName: String(body.requesterName || studentName).trim(),
    startDate: body.startDate,
    endDate: body.endDate,
    reason: String(body.reason || '').trim(),
    status: 'Pending',
    teacherName: String(body.teacherName || '').trim() || null,
    teacherResponse: null,
    decidedBy: null,
    decidedAt: null,
  };
};

const leaveRequests = async (url) => {
  const role = url.searchParams.get('role') || 'admin';
  const institutionId = Number(url.searchParams.get('institutionId') || 1);
  const studentName = url.searchParams.get('studentName') || '';
  const teacherName = url.searchParams.get('teacherName') || '';
  const conditions = ['institutionId = :institutionId'];
  const params = { institutionId };

  if (role === 'student' || role === 'parent') {
    conditions.push('studentName = :studentName');
    params.studentName = studentName;
  }

  if (role === 'teacher' && teacherName) {
    conditions.push("(teacherName = :teacherName OR teacherName IS NULL OR teacherName = '')");
    params.teacherName = teacherName;
  }

  const sql = 'SELECT * FROM leave_requests WHERE ' + conditions.join(' AND ') + ' ORDER BY createdAt DESC, id DESC';
  return rows(sql, params);
};

const createLeaveRequest = async (body) => {
  const payload = await leaveRequestPayload(body);
  const request = await insert('leave_requests', payload);
  await insert('notifications', {
    institutionId: payload.institutionId,
    recipientRole: 'teacher',
    recipientName: payload.teacherName,
    title: 'New leave request',
    message: payload.studentName + ' requested leave from ' + payload.startDate + ' to ' + payload.endDate + '. Reason: ' + payload.reason,
    status: 'Unread',
    relatedType: 'leave_request',
    relatedId: request.id,
  });
  return request;
};

const decideLeaveRequest = async (id, body) => {
  const status = body.status === 'Approved' ? 'Approved' : body.status === 'Rejected' ? 'Rejected' : '';
  if (!status) throw new Error('Decision must be Approved or Rejected');

  const existing = await one('leave_requests', id);
  if (!existing) throw new Error('Leave request not found');

  const decided = await update('leave_requests', id, {
    institutionId: existing.institutionId,
    studentName: existing.studentName,
    grade: existing.grade,
    requesterRole: existing.requesterRole,
    requesterName: existing.requesterName,
    startDate: existing.startDate,
    endDate: existing.endDate,
    reason: existing.reason,
    status,
    teacherName: existing.teacherName || String(body.teacherName || '').trim() || null,
    teacherResponse: String(body.teacherResponse || '').trim() || null,
    decidedBy: String(body.decidedBy || '').trim() || null,
    decidedAt: new Date(),
  });

  const [student] = await rows('SELECT guardianName FROM students WHERE institutionId = :institutionId AND name = :studentName LIMIT 1', {
    institutionId: existing.institutionId,
    studentName: existing.studentName,
  });
  const parentName = student?.guardianName || null;
  const responseText = decided.teacherResponse ? ' Teacher note: ' + decided.teacherResponse : '';
  const message = 'Leave request for ' + existing.studentName + ' from ' + existing.startDate + ' to ' + existing.endDate + ' was ' + status.toLowerCase() + '.' + responseText;

  await insert('notifications', {
    institutionId: existing.institutionId,
    recipientRole: 'parent',
    recipientName: parentName,
    title: 'Leave ' + status,
    message,
    status: 'Unread',
    relatedType: 'leave_request',
    relatedId: id,
  });

  await insert('notifications', {
    institutionId: existing.institutionId,
    recipientRole: 'student',
    recipientName: existing.studentName,
    title: 'Leave ' + status,
    message,
    status: 'Unread',
    relatedType: 'leave_request',
    relatedId: id,
  });

  return decided;
};

const notifications = async (url) => {
  const role = url.searchParams.get('role') || 'admin';
  const institutionId = Number(url.searchParams.get('institutionId') || 1);
  const recipientName = url.searchParams.get('recipientName') || '';
  const conditions = ['institutionId = :institutionId'];
  const params = { institutionId };

  if (role !== 'admin' && role !== 'principal') {
    conditions.push('recipientRole = :role');
    params.role = role;
    if (recipientName) {
      conditions.push('(recipientName = :recipientName OR recipientName IS NULL)');
      params.recipientName = recipientName;
    }
  }

  const sql = 'SELECT * FROM notifications WHERE ' + conditions.join(' AND ') + ' ORDER BY createdAt DESC, id DESC LIMIT 50';
  return rows(sql, params);
};

const pendingVerifications = async (url) => {
  const institutionId = Number(url.searchParams.get('institutionId') || 1);
  const pendingStudents = await rows(
    `SELECT students.*
     FROM students
     WHERE institutionId = :institutionId AND status = 'Pending'
     ORDER BY id DESC`,
    { institutionId },
  );
  const pendingParents = await rows(
    `SELECT users.id, users.name, users.email, users.linkedStudentName, users.institutionId, users.status, notifications.id AS notificationId, notifications.message
     FROM notifications
     JOIN users ON users.id = notifications.relatedId
     WHERE notifications.institutionId = :institutionId
       AND notifications.relatedType = 'parent_registration'
       AND notifications.status = 'Unread'
       AND users.role = 'parent'
     ORDER BY notifications.id DESC`,
    { institutionId },
  );
  return { pendingStudents, pendingParents };
};

const decideVerification = async (type, id, body) => {
  const decision = body.decision === 'approve' ? 'approve' : body.decision === 'reject' ? 'reject' : '';
  if (!decision) throw new Error('Decision must be approve or reject');
  const decidedBy = String(body.decidedBy || 'Admin').trim();

  if (type === 'student') {
    const student = await one('students', id);
    if (!student) throw new Error('Student not found');
    const status = decision === 'approve' ? 'Active' : 'Rejected';
    const saved = await update('students', id, { ...student, status });
    await rows(
      `UPDATE users SET status = :userStatus WHERE role = 'student' AND institutionId = :institutionId AND (LOWER(email) = LOWER(:email) OR name = :name)`,
      { userStatus: decision === 'approve' ? 'Active' : 'Inactive', institutionId: student.institutionId, email: student.email || '', name: student.name },
    );
    await insert('notifications', {
      institutionId: student.institutionId,
      recipientRole: 'student',
      recipientName: student.name,
      title: decision === 'approve' ? 'Student registration approved' : 'Student registration rejected',
      message: decision === 'approve'
        ? 'Your student registration has been verified by ' + decidedBy + '.'
        : 'Your student registration was rejected by ' + decidedBy + '.',
      status: 'Unread',
      relatedType: 'student_verification',
      relatedId: id,
    });
    return saved;
  }

  if (type === 'parent') {
    const user = await one('users', id);
    if (!user || user.role !== 'parent') throw new Error('Parent account not found');
    await rows('UPDATE users SET status = :status WHERE id = :id', {
      id,
      status: decision === 'approve' ? 'Active' : 'Inactive',
    });
    await rows(
      `UPDATE notifications SET status = 'Read' WHERE relatedType = 'parent_registration' AND relatedId = :id`,
      { id },
    );
    await insert('notifications', {
      institutionId: user.institutionId,
      recipientRole: 'parent',
      recipientName: user.name,
      title: decision === 'approve' ? 'Parent account approved' : 'Parent account rejected',
      message: decision === 'approve'
        ? 'Your parent account for ' + user.linkedStudentName + ' has been verified by ' + decidedBy + '.'
        : 'Your parent account verification was rejected by ' + decidedBy + '.',
      status: 'Unread',
      relatedType: 'parent_verification',
      relatedId: id,
    });
    return { ...user, status: decision === 'approve' ? 'Active' : 'Inactive' };
  }

  throw new Error('Unknown verification type');
};

const studentList = async () => rows(`
  SELECT
    students.*,
    assignments.teacherId AS assignedTeacherId,
    assignments.teacherName AS assignedTeacherName,
    assignments.courseId AS assignedCourseId,
    assignments.courseName AS assignedCourseName
  FROM students
  LEFT JOIN (
    SELECT a.*
    FROM student_teacher_assignments a
    JOIN (
      SELECT institutionId, studentId, MAX(id) AS id
      FROM student_teacher_assignments
      WHERE status = 'Active'
      GROUP BY institutionId, studentId
    ) latest ON latest.id = a.id
  ) assignments ON assignments.institutionId = students.institutionId AND assignments.studentId = students.id
  ORDER BY students.id DESC
`);

const saveStudent = async (id, body) => {
  const studentData = normalize(resources.students, body);
  const assignedTeacherId = Number(body.assignedTeacherId || 0);
  if (!assignedTeacherId) throw new Error('Assigned teacher is required for student admission');

  const [teacher] = await rows(
    'SELECT id, name FROM teachers WHERE institutionId = :institutionId AND id = :teacherId AND status = :status LIMIT 1',
    { institutionId: Number(studentData.institutionId || 1), teacherId: assignedTeacherId, status: 'Active' },
  );
  if (!teacher) throw new Error('Active assigned teacher not found');

  const saved = id ? await update('students', id, studentData) : await insert('students', studentData);
  await rows(
    `UPDATE student_teacher_assignments
     SET status = 'Inactive'
     WHERE institutionId = :institutionId AND studentId = :studentId AND status = 'Active'`,
    { institutionId: saved.institutionId, studentId: saved.id },
  );
  await createStudentTeacherAssignment({
    institutionId: saved.institutionId,
    studentId: saved.id,
    teacherId: assignedTeacherId,
    courseId: body.assignedCourseId ? Number(body.assignedCourseId) : null,
    assignedBy: String(body.assignedBy || 'Principal').trim(),
    notes: id ? 'Teacher assignment updated from student profile' : 'Initial teacher assignment from admission',
  });

  return (await rows(
    `SELECT students.*, assignments.teacherId AS assignedTeacherId, assignments.teacherName AS assignedTeacherName, assignments.courseId AS assignedCourseId, assignments.courseName AS assignedCourseName
     FROM students
     LEFT JOIN student_teacher_assignments assignments ON assignments.institutionId = students.institutionId AND assignments.studentId = students.id AND assignments.status = 'Active'
     WHERE students.id = :id
     ORDER BY assignments.id DESC
     LIMIT 1`,
    { id: saved.id },
  ))[0] || saved;
};

const courseFlow = async (url) => {
  const institutionId = Number(url.searchParams.get('institutionId') || 1);
  const role = url.searchParams.get('role') || 'principal';
  const teacherName = url.searchParams.get('teacherName') || '';
  const teacherOnly = role === 'teacher' && teacherName;
  const studentSql = teacherOnly
    ? `SELECT DISTINCT students.id, students.name, students.grade, students.guardianName, students.status
       FROM students
       JOIN student_teacher_assignments assignments ON assignments.institutionId = students.institutionId AND assignments.studentId = students.id AND assignments.status = 'Active'
       WHERE students.institutionId = :institutionId AND students.status = 'Active' AND assignments.teacherName = :teacherName
       ORDER BY students.name`
    : `SELECT id, name, grade, guardianName, status
       FROM students
       WHERE institutionId = :institutionId AND status = 'Active'
       ORDER BY name`;
  const courseSql = teacherOnly
    ? `SELECT id, name, grade, teacher, status
       FROM courses
       WHERE institutionId = :institutionId AND status = 'Active' AND teacher = :teacherName
       ORDER BY name`
    : `SELECT id, name, grade, teacher, status
       FROM courses
       WHERE institutionId = :institutionId AND status = 'Active'
       ORDER BY name`;
  const scopedParams = teacherOnly ? { institutionId, teacherName } : { institutionId };
  const [studentRows, teacherRows, courseRows, requestRows, assignmentRows] = await Promise.all([
    rows(studentSql, scopedParams),
    rows(
      `SELECT id, name, subject, status
       FROM teachers
       WHERE institutionId = :institutionId AND status = 'Active'
       ORDER BY name`,
      { institutionId },
    ),
    rows(courseSql, scopedParams),
    rows(
      `SELECT *
       FROM student_course_requests
       WHERE institutionId = :institutionId
       ORDER BY createdAt DESC, id DESC
       LIMIT 100`,
      { institutionId },
    ),
    rows(
      `SELECT *
       FROM student_teacher_assignments
       WHERE institutionId = :institutionId AND status = 'Active'
       ORDER BY createdAt DESC, id DESC
       LIMIT 100`,
      { institutionId },
    ),
  ]);

  return { students: studentRows, teachers: teacherRows, courses: courseRows, requests: requestRows, assignments: assignmentRows };
};

const createCourseRequest = async (body) => {
  const institutionId = Number(body.institutionId || 1);
  const studentId = Number(body.studentId || 0);
  const courseId = Number(body.courseId || 0);
  const teacherName = String(body.teacherName || '').trim();
  if (!studentId) throw new Error('Student is required');
  if (!courseId) throw new Error('Course is required');
  if (!teacherName) throw new Error('Teacher name is required');

  const [student] = await rows(
    'SELECT id, name FROM students WHERE institutionId = :institutionId AND id = :studentId AND status = :status LIMIT 1',
    { institutionId, studentId, status: 'Active' },
  );
  if (!student) throw new Error('Active student not found');

  const [course] = await rows(
    'SELECT id, name, teacher FROM courses WHERE institutionId = :institutionId AND id = :courseId AND status = :status LIMIT 1',
    { institutionId, courseId, status: 'Active' },
  );
  if (!course) throw new Error('Active course not found');
  if (course.teacher !== teacherName) throw new Error('Teacher can request only courses assigned to their competency');

  const [teacher] = await rows(
    'SELECT id, name FROM teachers WHERE institutionId = :institutionId AND name = :teacherName AND status = :status LIMIT 1',
    { institutionId, teacherName, status: 'Active' },
  );
  if (!teacher) throw new Error('Active teacher not found');

  const [assignment] = await rows(
    `SELECT id
     FROM student_teacher_assignments
     WHERE institutionId = :institutionId AND studentId = :studentId AND teacherId = :teacherId AND status = 'Active'
     LIMIT 1`,
    { institutionId, studentId, teacherId: teacher.id },
  );
  if (!assignment) throw new Error('Teacher can request courses only for assigned students');

  const request = await insert('student_course_requests', {
    institutionId,
    studentId,
    studentName: student.name,
    courseId,
    courseName: course.name,
    teacherId: teacher?.id || null,
    teacherName,
    reason: String(body.reason || '').trim() || null,
    status: 'Pending',
    decidedBy: null,
    decidedAt: null,
  });

  await insert('notifications', {
    institutionId,
    recipientRole: 'principal',
    recipientName: null,
    title: 'Course need approval required',
    message: teacherName + ' requested ' + course.name + ' for ' + student.name + '.',
    status: 'Unread',
    relatedType: 'student_course_request',
    relatedId: request.id,
  });

  return request;
};

const createStudentTeacherAssignment = async (body) => {
  const institutionId = Number(body.institutionId || 1);
  const studentId = Number(body.studentId || 0);
  const teacherId = Number(body.teacherId || 0);
  const courseId = body.courseId ? Number(body.courseId) : null;
  if (!studentId) throw new Error('Student is required');
  if (!teacherId) throw new Error('Teacher is required');

  const [student] = await rows(
    'SELECT id, name FROM students WHERE institutionId = :institutionId AND id = :studentId AND status = :status LIMIT 1',
    { institutionId, studentId, status: 'Active' },
  );
  if (!student) throw new Error('Active student not found');

  const [teacher] = await rows(
    'SELECT id, name FROM teachers WHERE institutionId = :institutionId AND id = :teacherId AND status = :status LIMIT 1',
    { institutionId, teacherId, status: 'Active' },
  );
  if (!teacher) throw new Error('Active teacher not found');

  let course = null;
  if (courseId) {
    [course] = await rows(
      'SELECT id, name FROM courses WHERE institutionId = :institutionId AND id = :courseId AND status = :status LIMIT 1',
      { institutionId, courseId, status: 'Active' },
    );
    if (!course) throw new Error('Active course not found');
  }

  return insert('student_teacher_assignments', {
    institutionId,
    studentId,
    studentName: student.name,
    teacherId,
    teacherName: teacher.name,
    courseId: course?.id || null,
    courseName: course?.name || null,
    assignedBy: String(body.assignedBy || 'Principal').trim(),
    notes: String(body.notes || '').trim() || null,
    status: 'Active',
  });
};

const decideCourseRequest = async (id, body) => {
  const decision = body.decision === 'approve' ? 'Approved' : body.decision === 'reject' ? 'Rejected' : '';
  if (!decision) throw new Error('Decision must be approve or reject');

  const existing = await one('student_course_requests', id);
  if (!existing) throw new Error('Course request not found');

  const saved = await update('student_course_requests', id, {
    ...existing,
    status: decision,
    decidedBy: String(body.decidedBy || 'Principal').trim(),
    decidedAt: new Date(),
  });

  if (decision === 'Approved') {
    let teacherId = existing.teacherId;
    if (!teacherId) {
      const [teacher] = await rows(
        'SELECT id FROM teachers WHERE institutionId = :institutionId AND name = :teacherName AND status = :status LIMIT 1',
        { institutionId: existing.institutionId, teacherName: existing.teacherName, status: 'Active' },
      );
      teacherId = teacher?.id || 0;
    }
    if (teacherId) {
      await createStudentTeacherAssignment({
        institutionId: existing.institutionId,
        studentId: existing.studentId,
        teacherId,
        courseId: existing.courseId,
        assignedBy: body.decidedBy || 'Principal',
        notes: 'Approved from teacher course need request #' + id,
      });
    }
  }

  await insert('notifications', {
    institutionId: existing.institutionId,
    recipientRole: 'teacher',
    recipientName: existing.teacherName,
    title: 'Course request ' + decision.toLowerCase(),
    message: 'Your request for ' + existing.studentName + ' to take ' + existing.courseName + ' was ' + decision.toLowerCase() + '.',
    status: 'Unread',
    relatedType: 'student_course_request',
    relatedId: id,
  });

  return saved;
};

const feeMonth = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const dateOnly = (date = new Date()) => date.toISOString().slice(0, 10);
const monthlyFeeAmount = () => Number(process.env.MONTHLY_FEE_AMOUNT || 1200);

const accrueMonthlyFees = async (institutionId, now = new Date()) => {
  const month = feeMonth(now);
  if (now.getDate() < 5) return { month, applied: false, created: 0, amount: monthlyFeeAmount() };

  const students = await rows(
    "SELECT id, name FROM students WHERE institutionId = :institutionId AND status IN ('Active', 'Pending')",
    { institutionId },
  );
  let created = 0;
  for (const student of students) {
    const result = await rows(
      `INSERT IGNORE INTO fee_charges (institutionId, studentId, studentName, chargeMonth, amount, chargeDate, notes)
       VALUES (:institutionId, :studentId, :studentName, :chargeMonth, :amount, :chargeDate, :notes)`,
      {
        institutionId,
        studentId: student.id,
        studentName: student.name,
        chargeMonth: month,
        amount: monthlyFeeAmount(),
        chargeDate: dateOnly(now),
        notes: 'Auto monthly fee on/after 5th',
      },
    );
    if (result.affectedRows > 0) created += 1;
  }

  return { month, applied: true, created, amount: monthlyFeeAmount() };
};

const feeTracker = async (url) => {
  const institutionId = Number(url.searchParams.get('institutionId') || 1);
  const accrual = await accrueMonthlyFees(institutionId);
  const studentRows = await rows(
    `SELECT
      students.id AS studentId,
      students.name AS studentName,
      students.guardianName AS parentName,
      students.grade,
      students.status,
      students.email,
      COALESCE(charges.totalCharged, 0) AS totalCharged,
      COALESCE(payments.totalPaid, 0) AS totalPaid,
      COALESCE(charges.totalCharged, 0) - COALESCE(payments.totalPaid, 0) AS balance,
      payments.lastPaymentDate,
      payments.paidTillMonth
    FROM students
    LEFT JOIN (
      SELECT institutionId, studentId, SUM(amount) AS totalCharged
      FROM fee_charges
      WHERE institutionId = :institutionId
      GROUP BY institutionId, studentId
    ) charges ON charges.institutionId = students.institutionId AND charges.studentId = students.id
    LEFT JOIN (
      SELECT institutionId, studentId, SUM(amount) AS totalPaid, MAX(paymentDate) AS lastPaymentDate, MAX(paidTillMonth) AS paidTillMonth
      FROM fee_payments
      WHERE institutionId = :institutionId AND verificationStatus = 'Verified'
      GROUP BY institutionId, studentId
    ) payments ON payments.institutionId = students.institutionId AND payments.studentId = students.id
    WHERE students.institutionId = :institutionId
    ORDER BY balance DESC, students.id DESC`,
    { institutionId },
  );
  const recentPayments = await rows(
    `SELECT * FROM fee_payments WHERE institutionId = :institutionId ORDER BY paymentDate DESC, id DESC LIMIT 20`,
    { institutionId },
  );
  const summary = studentRows.reduce((acc, row) => ({
    totalCharged: acc.totalCharged + Number(row.totalCharged || 0),
    totalPaid: acc.totalPaid + Number(row.totalPaid || 0),
    totalBalance: acc.totalBalance + Number(row.balance || 0),
  }), { totalCharged: 0, totalPaid: 0, totalBalance: 0 });

  return { accrual, summary, students: studentRows, recentPayments };
};

const createFeePayment = async (body) => {
  const institutionId = Number(body.institutionId || 1);
  const studentId = Number(body.studentId || 0);
  const amount = Number(body.amount || 0);
  if (!studentId) throw new Error('Student is required');
  if (!amount || amount <= 0) throw new Error('Payment amount must be greater than zero');

  const [student] = await rows(
    'SELECT id, name, guardianName FROM students WHERE institutionId = :institutionId AND id = :studentId LIMIT 1',
    { institutionId, studentId },
  );
  if (!student) throw new Error('Student not found for selected institution');

  const paymentDate = body.paymentDate || dateOnly();
  const payment = await insert('fee_payments', {
    institutionId,
    studentId,
    studentName: student.name,
    parentName: student.guardianName,
    amount,
    fromDate: body.fromDate || null,
    tillDate: body.tillDate || null,
    paidTillMonth: body.paidTillMonth || null,
    paymentDate,
    verificationStatus: 'Verified',
    verifiedBy: String(body.verifiedBy || body.enteredBy || 'Principal').trim(),
    verifiedAt: new Date(),
    notes: String(body.notes || '').trim() || null,
  });

  await insert('fee_transactions', {
    institutionId,
    studentName: student.name,
    amount,
    paidDate: paymentDate,
    status: 'Paid',
    category: 'Tuition',
  });

  return payment;
};
const dashboard = async () => {
  const stats = {
    students: await scalar('SELECT COUNT(*) AS value FROM students'),
    activeTeachers: await scalar("SELECT COUNT(*) AS value FROM teachers WHERE status = 'Active'"),
    courses: await scalar('SELECT COUNT(*) AS value FROM courses'),
    upcomingExams: await scalar("SELECT COUNT(*) AS value FROM exams WHERE status IN ('Upcoming', 'Scheduled')"),
  };
  const upcomingExams = await rows("SELECT title AS subject, grade, date, time FROM exams WHERE status IN ('Upcoming', 'Scheduled') ORDER BY date, time LIMIT 4");
  return { stats, upcomingExams };
};

const dbDebug = async () => {
  const config = publicDbConfig();
  try {
    const result = await lookup(config.host);
    return { ...config, dns: { ok: true, address: result.address, family: result.family } };
  } catch (error) {
    return { ...config, dns: { ok: false, error: error.code || error.message } };
  }
};

const setupDatabase = async (url) => {
  const setupToken = process.env.SETUP_TOKEN;
  if (!setupToken) return { status: 403, payload: { error: 'SETUP_TOKEN is not configured.' } };
  if (url.searchParams.get('token') !== setupToken) return { status: 403, payload: { error: 'Invalid setup token.' } };

  try {
    const result = await execFileAsync(process.execPath, ['server/setup-mysql.js'], {
      cwd: process.cwd(),
      timeout: 120000,
      maxBuffer: 1024 * 1024,
    });
    return {
      status: 200,
      payload: {
        ok: true,
        stdout: result.stdout.trim(),
        stderr: result.stderr.trim(),
      },
    };
  } catch (error) {
    return {
      status: 500,
      payload: {
        ok: false,
        error: error.message,
        stdout: error.stdout?.trim(),
        stderr: error.stderr?.trim(),
      },
    };
  }
};

const report = async (type, context = {}) => {
  const provider = ReportFactory.create(type, context);
  return provider.build();
};

createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return send(req, res, 204, {});

    const url = new URL(req.url, `http://${req.headers.host}`);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'api') return send(req, res, 404, { error: 'Not found' });
    if (parts[1] === 'health') return send(req, res, 200, { ok: true });
    if (parts[1] === 'auth' && parts[2] === 'login' && req.method === 'POST') return send(req, res, 200, await login(await readBody(req)));
    if (parts[1] === 'auth' && parts[2] === 'register' && req.method === 'POST') return send(req, res, 201, await register(await readBody(req)));
    if (parts[1] === 'debug' && parts[2] === 'db') return send(req, res, 200, await dbDebug());
    if (parts[1] === 'setup' && parts[2] === 'database') {
      const result = await setupDatabase(url);
      return send(req, res, result.status, result.payload);
    }
    if (parts[1] === 'verifications' && req.method === 'GET') return send(req, res, 200, await pendingVerifications(url));
    if (parts[1] === 'verifications' && parts[4] === 'decision' && req.method === 'PUT') return send(req, res, 200, await decideVerification(parts[2], Number(parts[3]), await readBody(req)));
    if (parts[1] === 'student-course-flow' && req.method === 'GET') return send(req, res, 200, await courseFlow(url));
    if (parts[1] === 'student-course-flow' && parts[2] === 'requests' && req.method === 'POST') return send(req, res, 201, await createCourseRequest(await readBody(req)));
    if (parts[1] === 'student-course-flow' && parts[2] === 'requests' && parts[4] === 'decision' && req.method === 'PUT') return send(req, res, 200, await decideCourseRequest(Number(parts[3]), await readBody(req)));
    if (parts[1] === 'student-course-flow' && parts[2] === 'assignments' && req.method === 'POST') return send(req, res, 201, await createStudentTeacherAssignment(await readBody(req)));
    if (parts[1] === 'dashboard') return send(req, res, 200, await dashboard());
    if (parts[1] === 'fee-tracker' && req.method === 'GET') return send(req, res, 200, await feeTracker(url));
    if (parts[1] === 'fee-tracker' && parts[2] === 'payments' && req.method === 'POST') return send(req, res, 201, await createFeePayment(await readBody(req)));
    if (parts[1] === 'leave-requests' && req.method === 'GET') return send(req, res, 200, await leaveRequests(url));
    if (parts[1] === 'leave-requests' && req.method === 'POST') return send(req, res, 201, await createLeaveRequest(await readBody(req)));
    if (parts[1] === 'leave-requests' && parts[3] === 'decision' && req.method === 'PUT') return send(req, res, 200, await decideLeaveRequest(Number(parts[2]), await readBody(req)));
    if (parts[1] === 'notifications' && req.method === 'GET') return send(req, res, 200, await notifications(url));
    if (parts[1] === 'reports') {
      const type = url.searchParams.get('type') || 'academic';
      const role = url.searchParams.get('role') || 'admin';
      const studentName = url.searchParams.get('studentName') || '';
      const institutionId = Number(url.searchParams.get('institutionId') || 1);
      const restrictedRoles = ['student', 'parent'];
      if (restrictedRoles.includes(role) && !['academic', 'attendance'].includes(type)) {
        return send(req, res, 403, { error: 'This role can only view student academic and attendance reports.' });
      }
      if (role === 'teacher' && !['academic', 'attendance'].includes(type)) {
        return send(req, res, 403, { error: 'Teachers can only view academic and attendance reports.' });
      }
      return send(req, res, 200, await report(type, { role, studentName, institutionId }));
    }

    const resource = resources[parts[1]];
    if (!resource) return send(req, res, 404, { error: 'Unknown resource' });

    const id = parts[2] ? Number(parts[2]) : null;
    if (parts[1] === 'students' && req.method === 'GET' && !id) return send(req, res, 200, await studentList());
    if (parts[1] === 'students' && req.method === 'POST') return send(req, res, 201, await saveStudent(null, await readBody(req)));
    if (parts[1] === 'students' && req.method === 'PUT' && id) return send(req, res, 200, await saveStudent(id, await readBody(req)));
    if (req.method === 'GET' && !id) return send(req, res, 200, await all(resource.table));
    if (req.method === 'GET' && id) return send(req, res, 200, await one(resource.table, id));
    if (req.method === 'POST') return send(req, res, 201, await insert(resource.table, normalize(resource, await readBody(req))));
    if (req.method === 'PUT' && id) return send(req, res, 200, await update(resource.table, id, normalize(resource, await readBody(req))));
    if (req.method === 'DELETE' && id) {
      await remove(resource.table, id);
      return send(req, res, 204, {});
    }

    return send(req, res, 405, { error: 'Method not allowed' });
  } catch (error) {
    return send(req, res, 500, { error: error.message });
  }
}).listen(port, () => {
  console.log(`Backend API running at http://localhost:${port}`);
});




