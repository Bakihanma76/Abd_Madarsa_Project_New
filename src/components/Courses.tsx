import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit, Eye, Trash2, Filter, BookOpen, Clock, Users, Send, UserCheck, CheckCircle, XCircle } from 'lucide-react';
import CourseModal from './CourseModal';
import { useApiResource } from '../hooks/useApiResource';
import { AppUser, canDelete, canManage, isVisibleForUser, scopeLabel } from '../access';
import { apiRequest } from '../api';

type CoursesProps = {
  user: AppUser;
};
type FlowStudent = { id: number; name: string; grade: string; guardianName: string; status: string };
type FlowTeacher = { id: number; name: string; subject: string; status: string };
type FlowCourse = { id: number; name: string; grade: string; teacher: string; status: string };
type CourseRequest = {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  teacherId?: number | null;
  teacherName: string;
  reason?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
};
type StudentTeacherAssignment = {
  id: number;
  studentName: string;
  teacherName: string;
  courseName?: string | null;
  assignedBy: string;
  createdAt: string;
};
type CourseFlowData = {
  students: FlowStudent[];
  teachers: FlowTeacher[];
  courses: FlowCourse[];
  requests: CourseRequest[];
  assignments: StudentTeacherAssignment[];
};

const Courses: React.FC<CoursesProps> = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [flow, setFlow] = useState<CourseFlowData | null>(null);
  const [flowError, setFlowError] = useState('');
  const [requestStudentId, setRequestStudentId] = useState('');
  const [requestCourseId, setRequestCourseId] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignCourseId, setAssignCourseId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const { items: courses, loading, error, save, remove } = useApiResource<any>('courses');
  const canWrite = canManage(user.role, 'courses');
  const canRemove = canDelete(user.role);
  const canUseCourseFlow = user.role === 'teacher' || user.role === 'principal' || user.role === 'admin';
  const canApproveCourseFlow = user.role === 'principal' || user.role === 'admin';
  const visibleCourses = courses.filter((course) => isVisibleForUser(user, course, 'courses'));

  const filteredCourses = visibleCourses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === '' || course.grade.includes(filterGrade);
    return matchesSearch && matchesGrade;
  });

  const loadFlow = async () => {
    if (!canUseCourseFlow) return;
    setFlowError('');
    try {
      const result = await apiRequest<CourseFlowData>('/student-course-flow?institutionId=' + String(user.institutionId || 1));
      setFlow(result);
      if (!requestStudentId && result.students[0]) setRequestStudentId(String(result.students[0].id));
      if (!requestCourseId && result.courses[0]) setRequestCourseId(String(result.courses[0].id));
      if (!assignStudentId && result.students[0]) setAssignStudentId(String(result.students[0].id));
      if (!assignTeacherId && result.teachers[0]) setAssignTeacherId(String(result.teachers[0].id));
      if (!assignCourseId && result.courses[0]) setAssignCourseId(String(result.courses[0].id));
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : 'Unable to load course assignment workflow');
    }
  };

  useEffect(() => {
    loadFlow();
  }, [user.institutionId, user.role]);

  const submitCourseNeed = async (event: React.FormEvent) => {
    event.preventDefault();
    setFlowError('');
    try {
      await apiRequest('/student-course-flow/requests', {
        method: 'POST',
        body: JSON.stringify({
          institutionId: user.institutionId || 1,
          studentId: Number(requestStudentId),
          courseId: Number(requestCourseId),
          teacherName: user.linkedTeacherName || user.name,
          reason: requestReason,
        }),
      });
      setRequestReason('');
      await loadFlow();
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : 'Unable to submit course request');
    }
  };

  const assignTeacher = async (event: React.FormEvent) => {
    event.preventDefault();
    setFlowError('');
    try {
      await apiRequest('/student-course-flow/assignments', {
        method: 'POST',
        body: JSON.stringify({
          institutionId: user.institutionId || 1,
          studentId: Number(assignStudentId),
          teacherId: Number(assignTeacherId),
          courseId: assignCourseId ? Number(assignCourseId) : undefined,
          assignedBy: user.name,
          notes: assignNotes,
        }),
      });
      setAssignNotes('');
      await loadFlow();
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : 'Unable to assign teacher');
    }
  };

  const decideRequest = async (request: CourseRequest, decision: 'approve' | 'reject') => {
    setFlowError('');
    try {
      await apiRequest('/student-course-flow/requests/' + request.id + '/decision', {
        method: 'PUT',
        body: JSON.stringify({ decision, decidedBy: user.name }),
      });
      await loadFlow();
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : 'Unable to update request');
    }
  };

  const visibleRequests = (flow?.requests || []).filter((request) => (
    canApproveCourseFlow || request.teacherName === user.name || request.teacherName === user.linkedTeacherName
  ));

  const handleAddCourse = () => {
    if (!canWrite) return;
    setSelectedCourse(null);
    setShowModal(true);
  };

  const handleEditCourse = (course: any) => {
    if (!canWrite) return;
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleViewCourse = (course: any) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleDeleteCourse = async (course: any) => {
    if (!canRemove) return;
    if (window.confirm(`Are you sure you want to delete ${course.name}?`)) {
      await remove(course.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Courses Management</h2>
          <p className="text-gray-600">{scopeLabel(user.role)}</p>
        </div>
        {canWrite && (
          <button
            onClick={handleAddCourse}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses by name or teacher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Grades</option>
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5</option>
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="bg-white rounded-lg p-4 text-gray-600 shadow-sm">Loading courses...</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}
      {flowError && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{flowError}</div>}

      {canUseCourseFlow && flow && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {user.role === 'teacher' && (
            <form onSubmit={submitCourseNeed} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">Request Course Need</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField label="Student" value={requestStudentId} onChange={setRequestStudentId} required>
                  {flow.students.map((student) => <option key={student.id} value={student.id}>{student.name} - {student.grade}</option>)}
                </SelectField>
                <SelectField label="Course needed" value={requestCourseId} onChange={setRequestCourseId} required>
                  {flow.courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
                </SelectField>
              </div>
              <TextField label="Reason" value={requestReason} onChange={setRequestReason} placeholder="Why this student needs this course" />
              <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">Send to Principal</button>
            </form>
          )}

          {canApproveCourseFlow && (
            <form onSubmit={assignTeacher} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Principal Teacher Assignment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectField label="Student" value={assignStudentId} onChange={setAssignStudentId} required>
                  {flow.students.map((student) => <option key={student.id} value={student.id}>{student.name} - {student.grade}</option>)}
                </SelectField>
                <SelectField label="Teacher" value={assignTeacherId} onChange={setAssignTeacherId} required>
                  {flow.teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} - {teacher.subject}</option>)}
                </SelectField>
                <SelectField label="Course" value={assignCourseId} onChange={setAssignCourseId}>
                  <option value="">No course</option>
                  {flow.courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
                </SelectField>
              </div>
              <TextField label="Notes" value={assignNotes} onChange={setAssignNotes} placeholder="Assignment note" />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Assign Teacher</button>
            </form>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden xl:col-span-2">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Course Need Requests</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    {canApproveCourseFlow && <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visibleRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4"><div className="font-medium text-gray-900">{request.studentName}</div><div className="text-xs text-gray-500">{request.reason || 'No reason added'}</div></td>
                      <td className="px-5 py-4 text-sm text-gray-700">{request.courseName}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{request.teacherName}</td>
                      <td className="px-5 py-4"><StatusBadge status={request.status} /></td>
                      {canApproveCourseFlow && (
                        <td className="px-5 py-4">
                          {request.status === 'Pending' ? (
                            <div className="flex gap-2">
                              <button onClick={() => decideRequest(request, 'approve')} className="text-emerald-700 hover:text-emerald-900 p-1" title="Approve" type="button"><CheckCircle className="w-5 h-5" /></button>
                              <button onClick={() => decideRequest(request, 'reject')} className="text-red-700 hover:text-red-900 p-1" title="Reject" type="button"><XCircle className="w-5 h-5" /></button>
                            </div>
                          ) : <span className="text-sm text-gray-500">Done</span>}
                        </td>
                      )}
                    </tr>
                  ))}
                  {visibleRequests.length === 0 && (
                    <tr><td colSpan={canApproveCourseFlow ? 5 : 4} className="px-5 py-6 text-sm text-gray-500 text-center">No course requests yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {canApproveCourseFlow && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden xl:col-span-2">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Active Student Teacher Assignments</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {flow.assignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 text-sm font-medium text-gray-900">{assignment.studentName}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{assignment.teacherName}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{assignment.courseName || '-'}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{assignment.assignedBy}</td>
                      </tr>
                    ))}
                    {flow.assignments.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-6 text-sm text-gray-500 text-center">No teacher assignments yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-6 h-6 text-emerald-600" />
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  course.status === 'Active' 
                    ? 'bg-green-100 text-green-800'
                    : course.status === 'Pending'
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {course.status}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewCourse(course)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {canWrite && (
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="text-emerald-600 hover:text-emerald-800 p-1"
                    title="Edit Course"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {canRemove && (
                  <button
                    onClick={() => handleDeleteCourse(course)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.name}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium w-16">Grade:</span>
                <span>{course.grade}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium w-16">Teacher:</span>
                <span className="truncate">{course.teacher}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                <span>{course.students} students enrolled</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>{course.duration}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Schedule:</span>
                <div className="text-xs mt-1">{course.schedule}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-500">{user.role === 'student' || user.role === 'parent' ? 'No courses assigned yet. Admin or principal can assign courses later.' : 'No courses found matching your search criteria.'}</div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{visibleCourses.length}</div>
          <div className="text-sm text-gray-600">Visible Courses</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-600">{visibleCourses.filter(c => c.status === 'Active').length}</div>
          <div className="text-sm text-gray-600">Active Courses</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{visibleCourses.reduce((sum, c) => sum + c.students, 0)}</div>
          <div className="text-sm text-gray-600">Total Enrollments</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-orange-600">{Math.round(visibleCourses.reduce((sum, c) => sum + c.students, 0) / Math.max(visibleCourses.filter(c => c.status === 'Active').length, 1))}</div>
          <div className="text-sm text-gray-600">Avg Class Size</div>
        </div>
      </div>

      {/* Course Modal */}
      {showModal && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setShowModal(false)}
          onSave={async (courseData) => {
            if (!canWrite) {
              setShowModal(false);
              return;
            }
            await save(selectedCourse?.id, { ...courseData, institutionId: user.institutionId || 1 });
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
};

const SelectField: React.FC<SelectFieldProps> = ({ label, value, onChange, children, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <select value={value} onChange={(event) => onChange(event.target.value)} required={required} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
      {children}
    </select>
  </div>
);

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const TextField: React.FC<TextFieldProps> = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input type="text" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
  </div>
);

const StatusBadge: React.FC<{ status: 'Pending' | 'Approved' | 'Rejected' }> = ({ status }) => {
  const styles = {
    Pending: 'bg-amber-100 text-amber-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
  };

  return <span className={'inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + styles[status]}>{status}</span>;
};

export default Courses;




