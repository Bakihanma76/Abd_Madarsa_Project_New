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

  const created = await insert('users', {
    institutionId,
    name,
    email,
    password: hashPassword(password),
    role,
    status: 'Active',
    linkedStudentName: role === 'student' ? name : String(body.linkedStudentName || '').trim() || null,
    linkedTeacherName: role === 'teacher' ? name : null,
  });

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
    if (parts[1] === 'dashboard') return send(req, res, 200, await dashboard());
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

