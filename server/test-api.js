const baseUrl = process.env.API_BASE || 'http://localhost:3001/api';

const request = async (path, expectedStatus = 200, options = {}) => {
  const response = await fetch(baseUrl + path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (response.status !== expectedStatus) {
    throw new Error(path + ' expected ' + expectedStatus + ', received ' + response.status + ': ' + text);
  }
  return body;
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const run = async () => {
  const health = await request('/health');
  assert(health.ok === true, 'Health check failed');

  const institutions = await request('/institutions');
  const students = await request('/students');
  const teachers = await request('/teachers');
  const courses = await request('/courses');
  const exams = await request('/exams');

  assert(institutions.length >= 3, 'Expected at least 3 institutions, got ' + institutions.length);
  assert(students.length >= 120, 'Expected at least 120 students, got ' + students.length);
  assert(teachers.length >= 35, 'Expected at least 35 teachers, got ' + teachers.length);
  assert(courses.length >= 30, 'Expected at least 30 courses, got ' + courses.length);
  assert(exams.length >= 30, 'Expected at least 30 exams, got ' + exams.length);

  const adminFinancial = await request('/reports?type=financial&role=admin&institutionId=1');
  assert(adminFinancial.summary.totalRevenue > 0, 'Admin financial report should have revenue');
  assert(adminFinancial.breakdown.length > 0, 'Admin financial report should have expense breakdown');

  const enrollmentOne = await request('/reports?type=enrollment&role=principal&institutionId=1');
  const enrollmentTwo = await request('/reports?type=enrollment&role=principal&institutionId=2');
  const enrollmentFour = await request('/reports?type=enrollment&role=admin&institutionId=4');
  assert(enrollmentOne.summary.totalStudents > 0, 'Institution 1 enrollment should have students');
  assert(enrollmentTwo.summary.totalStudents > 0, 'Institution 2 enrollment should have students');
  assert(enrollmentFour.summary.totalStudents > 0, 'University enrollment should have students');

  const studentAcademic = await request('/reports?type=academic&role=student&institutionId=1&studentName=Ahmed%20Hassan%20Ali');
  assert(studentAcademic.summary.studentsAssessed <= studentAcademic.summary.subjects, 'Student academic report should not include class-wide data');
  assert(studentAcademic.data.every((row) => row.students === 1), 'Student academic rows must be scoped to one learner');

  const studentAttendance = await request('/reports?type=attendance&role=parent&institutionId=1&studentName=Ahmed%20Hassan%20Ali');
  assert(studentAttendance.summary.totalGrades <= 1, 'Parent attendance report must be scoped to linked child');

  await request('/reports?type=financial&role=student&institutionId=1&studentName=Ahmed%20Hassan%20Ali', 403);
  await request('/reports?type=enrollment&role=teacher&institutionId=1', 403);

  const leave = await request('/leave-requests', 201, {
    method: 'POST',
    body: JSON.stringify({
      institutionId: 1,
      studentName: 'Ahmed Hassan Ali',
      requesterRole: 'parent',
      requesterName: 'Hassan Ali',
      startDate: '2026-09-04',
      endDate: '2026-09-04',
      reason: 'Family appointment',
    }),
  });
  assert(leave.status === 'Pending', 'New leave request should be pending');

  const decidedLeave = await request('/leave-requests/' + leave.id + '/decision', 200, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'Rejected',
      teacherName: 'Ustadha Fatima Al-Zahra',
      decidedBy: 'Ustadha Fatima Al-Zahra',
      teacherResponse: 'Please choose a non-exam day.',
    }),
  });
  assert(decidedLeave.status === 'Rejected', 'Teacher decision should update leave request');

  const parentNotifications = await request('/notifications?role=parent&institutionId=1&recipientName=Hassan%20Ali');
  assert(parentNotifications.some((note) => note.relatedId === leave.id && note.title === 'Leave Rejected'), 'Parent should receive leave decision notification');

  console.log('API E2E checks passed.');
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
