import { createServer } from 'node:http';
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
    if (parts[1] === 'debug' && parts[2] === 'db') return send(req, res, 200, await dbDebug());
    if (parts[1] === 'setup' && parts[2] === 'database') {
      const result = await setupDatabase(url);
      return send(req, res, result.status, result.payload);
    }
    if (parts[1] === 'dashboard') return send(req, res, 200, await dashboard());
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
