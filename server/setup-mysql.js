import 'dotenv/config';
import mysql from 'mysql2/promise';
import { dbConfig, dbName } from './db-config.js';

const connection = await mysql.createConnection({
  ...dbConfig,
  multipleStatements: true,
});

await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await connection.query(`USE \`${dbName}\``);

await connection.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institutionId INT NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'principal', 'teacher', 'student', 'parent') NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    linkedStudentName VARCHAR(255),
    linkedTeacherName VARCHAR(255)
  );

  CREATE TABLE IF NOT EXISTS institutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('university', 'school', 'madarsa') NOT NULL DEFAULT 'madarsa',
    city VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institutionId INT NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    grade VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    guardianName VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    dateOfBirth DATE,
    admissionDate DATE,
    emergencyContact VARCHAR(255),
    medicalInfo TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    subjects INT NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institutionId INT NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    experience INT NOT NULL DEFAULT 0,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    dateOfBirth DATE,
    joinDate DATE,
    salary VARCHAR(50),
    emergencyContact VARCHAR(255),
    specializations TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    classes INT NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institutionId INT NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    grade VARCHAR(100) NOT NULL,
    teacher VARCHAR(255) NOT NULL,
    description TEXT,
    students INT NOT NULL DEFAULT 0,
    duration VARCHAR(100),
    schedule VARCHAR(255),
    maxStudents INT,
    startDate DATE,
    endDate DATE,
    syllabus TEXT,
    prerequisites TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institutionId INT NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    course VARCHAR(255) NOT NULL,
    grade VARCHAR(100) NOT NULL,
    teacher VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(50) NOT NULL,
    duration INT NOT NULL,
    students INT NOT NULL DEFAULT 0,
    totalMarks INT NOT NULL,
    passingMarks INT,
    examType VARCHAR(50) NOT NULL DEFAULT 'Written',
    instructions TEXT,
    syllabus TEXT,
    venue VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled'
  );

  CREATE TABLE IF NOT EXISTS fee_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institutionId INT NOT NULL DEFAULT 1,
    studentName VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    paidDate DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Paid',
    category VARCHAR(100) NOT NULL DEFAULT 'Tuition'
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institutionId INT NOT NULL DEFAULT 1,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expenseDate DATE NOT NULL,
    notes VARCHAR(255)
  );

  CREATE TABLE IF NOT EXISTS attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institutionId INT NOT NULL DEFAULT 1,
    studentName VARCHAR(255) NOT NULL,
    grade VARCHAR(100) NOT NULL,
    attendanceDate DATE NOT NULL,
    status ENUM('Present', 'Absent') NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exam_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institutionId INT NOT NULL DEFAULT 1,
    studentName VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    marksObtained DECIMAL(6,2) NOT NULL,
    totalMarks DECIMAL(6,2) NOT NULL,
    resultDate DATE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institutionId INT NOT NULL DEFAULT 1,
    studentName VARCHAR(255) NOT NULL,
    grade VARCHAR(100) NOT NULL DEFAULT 'Unassigned',
    requesterRole ENUM('student', 'parent') NOT NULL,
    requesterName VARCHAR(255) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    teacherName VARCHAR(255),
    teacherResponse TEXT,
    decidedBy VARCHAR(255),
    decidedAt DATETIME,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institutionId INT NOT NULL DEFAULT 1,
    recipientRole ENUM('student', 'parent', 'teacher', 'principal', 'admin') NOT NULL,
    recipientName VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('Unread', 'Read') NOT NULL DEFAULT 'Unread',
    relatedType VARCHAR(100),
    relatedId INT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const addColumnIfMissing = async (table, column, definition) => {
  const [[existing]] = await connection.query(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `,
    [dbName, table, column],
  );

  if (existing.count === 0) {
    await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN ${column} ${definition}`);
  }
};

for (const table of ['users', 'students', 'teachers', 'courses', 'exams', 'leave_requests', 'notifications']) {
  await addColumnIfMissing(table, 'institutionId', 'INT NOT NULL DEFAULT 1 AFTER id');
  await connection.query(`UPDATE \`${table}\` SET institutionId = 1 WHERE institutionId IS NULL`);
}
await connection.query("ALTER TABLE institutions MODIFY type ENUM('university', 'school', 'madarsa') NOT NULL DEFAULT 'madarsa'");

const seed = async (table, rows) => {
  const [[{ count }]] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
  if (count > 0) return;

  for (const row of rows) {
    const keys = Object.keys(row);
    const columns = keys.map((key) => `\`${key}\``).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    await connection.execute(
      `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`,
      keys.map((key) => row[key]),
    );
  }
};

const seedMinimum = async (table, targetCount, makeRow) => {
  const [[{ count }]] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
  for (let index = count; index < targetCount; index += 1) {
    const row = makeRow(index);
    const keys = Object.keys(row);
    const columns = keys.map((key) => `\`${key}\``).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    await connection.execute(
      `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`,
      keys.map((key) => row[key]),
    );
  }
};

const insertRow = async (table, row) => {
  const keys = Object.keys(row);
  const columns = keys.map((key) => `\`${key}\``).join(', ');
  const placeholders = keys.map(() => '?').join(', ');
  await connection.execute(
    `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`,
    keys.map((key) => row[key]),
  );
};

const pad = (value) => String(value).padStart(3, '0');
const institutions = [
  { id: 1, name: 'Abd Madarsa Main Campus', type: 'madarsa', city: 'Hyderabad' },
  { id: 2, name: 'Noor Public School', type: 'school', city: 'Mumbai' },
  { id: 3, name: 'Rahma Girls Madarsa', type: 'madarsa', city: 'Lucknow' },
  { id: 4, name: 'Iqra Community University', type: 'university', city: 'Delhi' },
];
const subjects = ['Quran & Tajweed', 'Arabic Literature', 'Islamic History', 'Hadith Studies', 'Fiqh & Jurisprudence', 'Mathematics', 'Science', 'English'];
const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
const statuses = ['Active', 'Active', 'Active', 'Inactive'];

await seed('students', [
  { name: 'Ahmed Hassan Ali', grade: 'Grade 5', age: 12, guardianName: 'Hassan Ali', phone: '+966-501234567', email: 'hassan.ali@email.com', status: 'Active', admissionDate: '2023-09-01', subjects: 5 },
  { name: 'Fatima Muhammad', grade: 'Grade 3', age: 10, guardianName: 'Muhammad Ahmad', phone: '+966-502345678', email: 'muhammad.ahmad@email.com', status: 'Active', admissionDate: '2023-09-01', subjects: 4 },
  { name: 'Omar Abdullah', grade: 'Grade 7', age: 14, guardianName: 'Abdullah Omar', phone: '+966-503456789', email: 'abdullah.omar@email.com', status: 'Active', admissionDate: '2022-09-01', subjects: 6 },
  { name: 'Aisha Ibrahim', grade: 'Grade 4', age: 11, guardianName: 'Ibrahim Yusuf', phone: '+966-504567890', email: 'ibrahim.yusuf@email.com', status: 'Active', admissionDate: '2023-09-01', subjects: 5 },
  { name: 'Khalid Rahman', grade: 'Grade 6', age: 13, guardianName: 'Rahman Khalid', phone: '+966-505678901', email: 'rahman.khalid@email.com', status: 'Inactive', admissionDate: '2022-09-01', subjects: 5 },
]);

await seed('users', [
  { name: 'Abdullah Boss', email: 'abdullahboss1900@gmail.com', password: 'Admin@1900', role: 'admin', status: 'Active' },
  { name: 'Dr. Sameer Khan', email: 'principal@madarsa.edu', password: 'Principal@123', role: 'principal', status: 'Active' },
  { name: 'Ustadha Fatima Al-Zahra', email: 'teacher@madarsa.edu', password: 'Teacher@123', role: 'teacher', status: 'Active', linkedTeacherName: 'Ustadha Fatima Al-Zahra' },
  { name: 'Ahmed Hassan Ali', email: 'student@madarsa.edu', password: 'Student@123', role: 'student', status: 'Active', linkedStudentName: 'Ahmed Hassan Ali' },
  { name: 'Hassan Ali', email: 'parent@madarsa.edu', password: 'Parent@123', role: 'parent', status: 'Active', linkedStudentName: 'Ahmed Hassan Ali' },
]);

await seed('institutions', [
  { name: 'Abd Madarsa Main Campus', type: 'madarsa', city: 'Hyderabad', status: 'Active' },
]);

await seed('teachers', [
  { name: 'Dr. Abdullah Rahman', subject: 'Quran & Tajweed', qualification: 'PhD in Islamic Studies', experience: 15, phone: '+966-511234567', email: 'abdullah.rahman@madarsa.edu', status: 'Active', salary: '8000', classes: 4 },
  { name: 'Ustadha Fatima Al-Zahra', subject: 'Arabic Literature', qualification: 'Masters in Arabic', experience: 8, phone: '+966-512345678', email: 'fatima.alzahra@madarsa.edu', status: 'Active', salary: '6500', classes: 3 },
  { name: 'Sheikh Omar Ibn Khalid', subject: 'Islamic History', qualification: 'Masters in History', experience: 12, phone: '+966-513456789', email: 'omar.khalid@madarsa.edu', status: 'Active', salary: '7500', classes: 5 },
  { name: 'Ustadha Aisha Mahmoud', subject: 'Hadith Studies', qualification: 'PhD in Hadith Sciences', experience: 10, phone: '+966-514567890', email: 'aisha.mahmoud@madarsa.edu', status: 'Active', salary: '7800', classes: 3 },
  { name: 'Dr. Hassan Al-Qadri', subject: 'Fiqh & Jurisprudence', qualification: 'PhD in Islamic Law', experience: 20, phone: '+966-515678901', email: 'hassan.qadri@madarsa.edu', status: 'Leave', salary: '9000', classes: 4 },
]);

await seed('courses', [
  { name: 'Quran Memorization Level 1', grade: 'Grade 1-2', teacher: 'Dr. Abdullah Rahman', students: 25, duration: '120 hours', schedule: 'Sun-Thu 8:00-9:30 AM', status: 'Active', description: 'Basic Quran memorization with proper Tajweed' },
  { name: 'Arabic Grammar Fundamentals', grade: 'Grade 3-4', teacher: 'Ustadha Fatima Al-Zahra', students: 22, duration: '80 hours', schedule: 'Sun-Thu 10:00-11:00 AM', status: 'Active', description: 'Foundation of Arabic grammar and syntax' },
  { name: 'Islamic History & Civilization', grade: 'Grade 5-6', teacher: 'Sheikh Omar Ibn Khalid', students: 28, duration: '100 hours', schedule: 'Sun-Thu 11:30 AM-12:30 PM', status: 'Active', description: 'History of Islamic civilization and notable figures' },
  { name: 'Hadith Studies Advanced', grade: 'Grade 7-8', teacher: 'Ustadha Aisha Mahmoud', students: 18, duration: '150 hours', schedule: 'Sun-Thu 2:00-3:30 PM', status: 'Active', description: 'Advanced study of Prophetic traditions' },
  { name: 'Fiqh & Islamic Law', grade: 'Grade 6-8', teacher: 'Dr. Hassan Al-Qadri', students: 20, duration: '180 hours', schedule: 'Mon-Wed 1:00-2:30 PM', status: 'Pending', description: 'Islamic jurisprudence and legal principles' },
]);

await seed('leave_requests', [
  { institutionId: 1, studentName: 'Ahmed Hassan Ali', grade: 'Grade 5', requesterRole: 'parent', requesterName: 'Hassan Ali', startDate: '2026-08-29', endDate: '2026-08-30', reason: 'Family medical appointment', status: 'Pending', teacherName: 'Ustadha Fatima Al-Zahra' },
  { institutionId: 1, studentName: 'Fatima Muhammad', grade: 'Grade 3', requesterRole: 'student', requesterName: 'Fatima Muhammad', startDate: '2026-08-26', endDate: '2026-08-26', reason: 'Fever and doctor advised rest', status: 'Approved', teacherName: 'Ustadha Fatima Al-Zahra', teacherResponse: 'Approved. Please submit missed classwork after returning.', decidedBy: 'Ustadha Fatima Al-Zahra', decidedAt: '2026-08-25 10:00:00' },
]);

await seed('notifications', [
  { institutionId: 1, recipientRole: 'parent', recipientName: 'Hassan Ali', title: 'Leave request pending', message: 'Leave request for Ahmed Hassan Ali is waiting for teacher approval.', status: 'Unread', relatedType: 'leave_request', relatedId: 1 },
  { institutionId: 1, recipientRole: 'student', recipientName: 'Ahmed Hassan Ali', title: 'Leave request submitted', message: 'Your leave request has been submitted to the teacher.', status: 'Unread', relatedType: 'leave_request', relatedId: 1 },
]);

await seed('exams', [
  { title: 'Quran Recitation Assessment', course: 'Quran Memorization Level 1', grade: 'Grade 1-2', date: '2024-01-15', time: '9:00 AM', duration: 60, students: 25, status: 'Upcoming', teacher: 'Dr. Abdullah Rahman', totalMarks: 100 },
  { title: 'Arabic Grammar Mid-Term', course: 'Arabic Grammar Fundamentals', grade: 'Grade 3-4', date: '2024-01-16', time: '10:00 AM', duration: 90, students: 22, status: 'Upcoming', teacher: 'Ustadha Fatima Al-Zahra', totalMarks: 100 },
  { title: 'Islamic History Quiz', course: 'Islamic History & Civilization', grade: 'Grade 5-6', date: '2024-01-12', time: '11:30 AM', duration: 45, students: 28, status: 'Completed', teacher: 'Sheikh Omar Ibn Khalid', totalMarks: 50 },
  { title: 'Hadith Studies Final Exam', course: 'Hadith Studies Advanced', grade: 'Grade 7-8', date: '2024-01-18', time: '2:00 PM', duration: 120, students: 18, status: 'Upcoming', teacher: 'Ustadha Aisha Mahmoud', totalMarks: 150 },
  { title: 'Fiqh Practical Assessment', course: 'Fiqh & Islamic Law', grade: 'Grade 6-8', date: '2024-01-20', time: '1:00 PM', duration: 90, students: 20, status: 'Scheduled', teacher: 'Dr. Hassan Al-Qadri', totalMarks: 100 },
]);

await seed('fee_transactions', [
  { studentName: 'Ahmed Hassan Ali', amount: 1200, paidDate: '2026-07-01', status: 'Paid', category: 'Tuition' },
  { studentName: 'Fatima Muhammad', amount: 1200, paidDate: '2026-07-02', status: 'Paid', category: 'Tuition' },
  { studentName: 'Omar Abdullah', amount: 1500, paidDate: '2026-07-03', status: 'Paid', category: 'Tuition' },
  { studentName: 'Aisha Ibrahim', amount: 1200, paidDate: '2026-07-04', status: 'Paid', category: 'Tuition' },
  { studentName: 'Khalid Rahman', amount: 800, paidDate: '2026-07-05', status: 'Partial', category: 'Tuition' },
]);

await seed('expenses', [
  { category: 'Teacher Salaries', amount: 39150, expenseDate: '2026-07-01', notes: 'Monthly salary batch' },
  { category: 'Operational Costs', amount: 4500, expenseDate: '2026-07-05', notes: 'Utilities and classroom supplies' },
  { category: 'Maintenance', amount: 2200, expenseDate: '2026-07-08', notes: 'Classroom repairs' },
]);

await seed('attendance_records', [
  { studentName: 'Ahmed Hassan Ali', grade: 'Grade 5', attendanceDate: '2026-07-23', status: 'Present' },
  { studentName: 'Fatima Muhammad', grade: 'Grade 3', attendanceDate: '2026-07-23', status: 'Present' },
  { studentName: 'Omar Abdullah', grade: 'Grade 7', attendanceDate: '2026-07-23', status: 'Absent' },
  { studentName: 'Aisha Ibrahim', grade: 'Grade 4', attendanceDate: '2026-07-23', status: 'Present' },
  { studentName: 'Khalid Rahman', grade: 'Grade 6', attendanceDate: '2026-07-23', status: 'Present' },
]);

await seed('exam_results', [
  { studentName: 'Ahmed Hassan Ali', subject: 'Quran & Tajweed', marksObtained: 88, totalMarks: 100, resultDate: '2026-07-10' },
  { studentName: 'Fatima Muhammad', subject: 'Arabic Literature', marksObtained: 81, totalMarks: 100, resultDate: '2026-07-10' },
  { studentName: 'Omar Abdullah', subject: 'Islamic History', marksObtained: 76, totalMarks: 100, resultDate: '2026-07-10' },
  { studentName: 'Aisha Ibrahim', subject: 'Arabic Literature', marksObtained: 92, totalMarks: 100, resultDate: '2026-07-10' },
  { studentName: 'Khalid Rahman', subject: 'Fiqh & Jurisprudence', marksObtained: 67, totalMarks: 100, resultDate: '2026-07-10' },
]);

await seedMinimum('institutions', 4, (index) => ({
  name: institutions[index]?.name || `Training Campus ${index + 1}`,
  type: institutions[index]?.type || (index % 2 === 0 ? 'madarsa' : 'school'),
  city: institutions[index]?.city || 'Hyderabad',
  status: 'Active',
}));

await seedMinimum('students', 120, (index) => {
  const n = index + 1;
  const institutionId = (index % 3) + 1;
  const grade = grades[index % grades.length];
  return {
    institutionId,
    name: `Sample Student ${pad(n)}`,
    grade,
    age: 6 + (index % 9),
    guardianName: `Guardian ${pad(n)}`,
    phone: `+91-90000${String(10000 + n).slice(-5)}`,
    email: `student${pad(n)}@sample.local`,
    address: `Area ${institutionId}, Sample City`,
    dateOfBirth: `20${String(12 + (index % 9)).padStart(2, '0')}-${String((index % 12) + 1).padStart(2, '0')}-15`,
    admissionDate: index % 5 === 0 ? '2026-07-10' : `202${2 + (index % 4)}-06-01`,
    emergencyContact: `+91-98888${String(10000 + n).slice(-5)}`,
    medicalInfo: index % 11 === 0 ? 'Requires periodic check-in' : null,
    status: statuses[index % statuses.length],
    subjects: 4 + (index % 5),
  };
});

await seedMinimum('teachers', 35, (index) => {
  const n = index + 1;
  const subject = subjects[index % subjects.length];
  return {
    institutionId: (index % 3) + 1,
    name: `Teacher ${subject.split(' ')[0]} ${pad(n)}`,
    subject,
    qualification: index % 4 === 0 ? 'PhD' : index % 3 === 0 ? 'Masters' : 'Bachelors',
    experience: 2 + (index % 20),
    phone: `+91-91111${String(10000 + n).slice(-5)}`,
    email: `teacher${pad(n)}@sample.local`,
    address: `Faculty Housing ${index % 6}`,
    joinDate: `202${index % 6}-04-01`,
    salary: String(25000 + (index % 10) * 2500),
    emergencyContact: `+91-97777${String(10000 + n).slice(-5)}`,
    specializations: subject,
    status: index % 10 === 0 ? 'Leave' : 'Active',
    classes: 1 + (index % 6),
  };
});

await seedMinimum('courses', 30, (index) => {
  const subject = subjects[index % subjects.length];
  const grade = grades[index % grades.length];
  return {
    institutionId: (index % 3) + 1,
    name: `${subject} Program ${pad(index + 1)}`,
    grade,
    teacher: `Teacher ${subject.split(' ')[0]} ${pad((index % 35) + 1)}`,
    description: `${subject} curriculum for ${grade}`,
    students: 18 + (index % 25),
    duration: `${60 + (index % 6) * 20} hours`,
    schedule: index % 2 === 0 ? 'Mon-Wed 9:00 AM' : 'Tue-Thu 11:00 AM',
    maxStudents: 45,
    startDate: '2026-07-01',
    endDate: '2027-03-31',
    syllabus: `${subject} term syllabus`,
    prerequisites: index % 3 === 0 ? 'Placement review' : null,
    status: index % 9 === 0 ? 'Pending' : 'Active',
  };
});

await seedMinimum('exams', 30, (index) => {
  const subject = subjects[index % subjects.length];
  return {
    institutionId: (index % 3) + 1,
    title: `${subject} Assessment ${pad(index + 1)}`,
    course: `${subject} Program ${pad((index % 30) + 1)}`,
    grade: grades[index % grades.length],
    teacher: `Teacher ${subject.split(' ')[0]} ${pad((index % 35) + 1)}`,
    date: `2026-0${(index % 3) + 7}-${String((index % 24) + 1).padStart(2, '0')}`,
    time: index % 2 === 0 ? '09:00 AM' : '01:30 PM',
    duration: 60 + (index % 3) * 30,
    students: 18 + (index % 25),
    totalMarks: 100,
    passingMarks: 40,
    examType: index % 4 === 0 ? 'Oral' : 'Written',
    instructions: 'Follow institution exam policy',
    syllabus: subject,
    venue: `Hall ${1 + (index % 5)}`,
    status: index % 4 === 0 ? 'Completed' : 'Scheduled',
  };
});

await seedMinimum('fee_transactions', 140, (index) => {
  const n = (index % 120) + 1;
  return {
    institutionId: (index % 3) + 1,
    studentName: `Sample Student ${pad(n)}`,
    amount: 800 + (index % 6) * 150,
    paidDate: `2026-07-${String((index % 23) + 1).padStart(2, '0')}`,
    status: index % 8 === 0 ? 'Partial' : index % 13 === 0 ? 'Pending' : 'Paid',
    category: index % 5 === 0 ? 'Transport' : index % 7 === 0 ? 'Books' : 'Tuition',
  };
});

await seedMinimum('expenses', 50, (index) => ({
  institutionId: (index % 3) + 1,
  category: ['Teacher Salaries', 'Operational Costs', 'Maintenance', 'Books & Materials', 'Transport'][index % 5],
  amount: 1200 + (index % 12) * 850,
  expenseDate: `2026-07-${String((index % 23) + 1).padStart(2, '0')}`,
  notes: `Generated expense ${pad(index + 1)}`,
}));

await seedMinimum('attendance_records', 260, (index) => {
  const n = (index % 120) + 1;
  const institutionId = ((n - 1) % 3) + 1;
  return {
    institutionId,
    studentName: `Sample Student ${pad(n)}`,
    grade: grades[(n - 1) % grades.length],
    attendanceDate: `2026-07-${String((index % 23) + 1).padStart(2, '0')}`,
    status: index % 9 === 0 ? 'Absent' : 'Present',
  };
});

await seedMinimum('exam_results', 220, (index) => {
  const n = (index % 120) + 1;
  const totalMarks = 100;
  return {
    institutionId: ((n - 1) % 3) + 1,
    studentName: `Sample Student ${pad(n)}`,
    subject: subjects[index % subjects.length],
    marksObtained: 35 + (index % 61),
    totalMarks,
    resultDate: `2026-07-${String((index % 20) + 1).padStart(2, '0')}`,
  };
});

const seedInstitutionScenario = async (institutionId, label, offset) => {
  const [[{ students: existingStudents }]] = await connection.query(
    'SELECT COUNT(*) AS students FROM students WHERE institutionId = ?',
    [institutionId],
  );
  if (existingStudents > 0) return;

  for (let index = 0; index < 24; index += 1) {
    const n = offset + index + 1;
    const grade = grades[index % grades.length];
    const studentName = `${label} Student ${pad(n)}`;
    await insertRow('students', {
      institutionId,
      name: studentName,
      grade,
      age: 7 + (index % 8),
      guardianName: `${label} Guardian ${pad(n)}`,
      phone: `+91-92222${String(10000 + n).slice(-5)}`,
      email: `${label.toLowerCase()}student${pad(n)}@sample.local`,
      address: `${label} Campus Area`,
      admissionDate: index % 4 === 0 ? '2026-07-12' : '2025-06-01',
      status: index % 6 === 0 ? 'Inactive' : 'Active',
      subjects: 4 + (index % 5),
    });
    await insertRow('fee_transactions', {
      institutionId,
      studentName,
      amount: 1000 + (index % 5) * 200,
      paidDate: `2026-07-${String((index % 20) + 1).padStart(2, '0')}`,
      status: index % 7 === 0 ? 'Partial' : 'Paid',
      category: index % 3 === 0 ? 'Tuition' : 'Books',
    });
    await insertRow('attendance_records', {
      institutionId,
      studentName,
      grade,
      attendanceDate: `2026-07-${String((index % 20) + 1).padStart(2, '0')}`,
      status: index % 8 === 0 ? 'Absent' : 'Present',
    });
    await insertRow('exam_results', {
      institutionId,
      studentName,
      subject: subjects[index % subjects.length],
      marksObtained: 45 + (index % 50),
      totalMarks: 100,
      resultDate: `2026-07-${String((index % 20) + 1).padStart(2, '0')}`,
    });
  }

  for (let index = 0; index < 8; index += 1) {
    const subject = subjects[index % subjects.length];
    const teacherName = `${label} Teacher ${pad(offset + index + 1)}`;
    await insertRow('teachers', {
      institutionId,
      name: teacherName,
      subject,
      qualification: index % 2 === 0 ? 'Masters' : 'PhD',
      experience: 3 + index,
      phone: `+91-93333${String(10000 + offset + index).slice(-5)}`,
      email: `${label.toLowerCase()}teacher${pad(offset + index + 1)}@sample.local`,
      status: 'Active',
      salary: String(30000 + index * 2500),
      classes: 2 + (index % 4),
    });
    await insertRow('courses', {
      institutionId,
      name: `${label} ${subject} Course`,
      grade: grades[index % grades.length],
      teacher: teacherName,
      description: `${label} campus ${subject} course`,
      students: 20 + index,
      duration: '90 hours',
      schedule: 'Mon-Wed 10:00 AM',
      maxStudents: 40,
      startDate: '2026-07-01',
      endDate: '2027-03-31',
      status: 'Active',
    });
    await insertRow('exams', {
      institutionId,
      title: `${label} ${subject} Exam`,
      course: `${label} ${subject} Course`,
      grade: grades[index % grades.length],
      teacher: teacherName,
      date: `2026-08-${String(index + 1).padStart(2, '0')}`,
      time: '10:00 AM',
      duration: 90,
      students: 20 + index,
      totalMarks: 100,
      passingMarks: 40,
      examType: 'Written',
      venue: `Room ${index + 1}`,
      status: index % 3 === 0 ? 'Completed' : 'Scheduled',
    });
  }

  for (let index = 0; index < 6; index += 1) {
    await insertRow('expenses', {
      institutionId,
      category: ['Teacher Salaries', 'Operational Costs', 'Maintenance'][index % 3],
      amount: 5000 + index * 1200,
      expenseDate: `2026-07-${String(index + 1).padStart(2, '0')}`,
      notes: `${label} scenario expense`,
    });
  }
};

await seedInstitutionScenario(4, 'University', 400);

await connection.end();
console.log(`MySQL database '${dbName}' is ready with dynamic multi-institution sample data.`);
