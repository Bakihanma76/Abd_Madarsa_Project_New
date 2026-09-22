import React, { useEffect, useState } from 'react';
import { CheckCircle, Send, UserCheck, XCircle } from 'lucide-react';
import { apiRequest } from '../api';
import type { AppUser } from '../access';

type FlowStudent = { id: number; name: string; grade: string };
type FlowTeacher = { id: number; name: string; subject: string };
type FlowCourse = { id: number; name: string };
type CourseRequest = {
  id: number;
  studentName: string;
  courseName: string;
  teacherName: string;
  reason?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
};
type Assignment = { id: number; studentName: string; teacherName: string; courseName?: string | null; assignedBy: string };
type FlowData = {
  students: FlowStudent[];
  teachers: FlowTeacher[];
  courses: FlowCourse[];
  requests: CourseRequest[];
  assignments: Assignment[];
};

type CourseWorkflowProps = {
  user: AppUser;
  onError: (message: string) => void;
};

const canApprove = (user: AppUser) => user.role === 'principal' || user.role === 'admin';

const CourseWorkflow: React.FC<CourseWorkflowProps> = ({ user, onError }) => {
  const [flow, setFlow] = useState<FlowData | null>(null);
  const [requestForm, setRequestForm] = useState({ studentId: '', courseId: '', reason: '' });
  const [assignForm, setAssignForm] = useState({ studentId: '', teacherId: '', courseId: '', notes: '' });
  const isApprover = canApprove(user);

  const load = async () => {
    onError('');
    try {
      const params = new URLSearchParams({
        institutionId: String(user.institutionId || 1),
        role: user.role,
        teacherName: user.linkedTeacherName || user.name,
      });
      const result = await apiRequest<FlowData>('/student-course-flow?' + params.toString());
      setFlow(result);
      setRequestForm((current) => ({
        ...current,
        studentId: current.studentId || String(result.students[0]?.id || ''),
        courseId: current.courseId || String(result.courses[0]?.id || ''),
      }));
      setAssignForm((current) => ({
        ...current,
        studentId: current.studentId || String(result.students[0]?.id || ''),
        teacherId: current.teacherId || String(result.teachers[0]?.id || ''),
        courseId: current.courseId || String(result.courses[0]?.id || ''),
      }));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to load course workflow');
    }
  };

  useEffect(() => {
    load();
  }, [user.institutionId, user.role]);

  if (!flow) return null;

  const visibleRequests = flow.requests.filter((request) => (
    isApprover || request.teacherName === user.name || request.teacherName === user.linkedTeacherName
  ));

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    await submit('/student-course-flow/requests', {
      institutionId: user.institutionId || 1,
      studentId: Number(requestForm.studentId),
      courseId: Number(requestForm.courseId),
      teacherName: user.linkedTeacherName || user.name,
      reason: requestForm.reason,
    });
    setRequestForm((current) => ({ ...current, reason: '' }));
  };

  const submitAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    await submit('/student-course-flow/assignments', {
      institutionId: user.institutionId || 1,
      studentId: Number(assignForm.studentId),
      teacherId: Number(assignForm.teacherId),
      courseId: assignForm.courseId ? Number(assignForm.courseId) : undefined,
      assignedBy: user.name,
      notes: assignForm.notes,
    });
    setAssignForm((current) => ({ ...current, notes: '' }));
  };

  const submit = async (path: string, body: unknown) => {
    onError('');
    try {
      await apiRequest(path, { method: 'POST', body: JSON.stringify(body) });
      await load();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to save workflow change');
    }
  };

  const decide = async (request: CourseRequest, decision: 'approve' | 'reject') => {
    onError('');
    try {
      await apiRequest('/student-course-flow/requests/' + request.id + '/decision', {
        method: 'PUT',
        body: JSON.stringify({ decision, decidedBy: user.name }),
      });
      await load();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to update request');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {user.role === 'teacher' && (
        <WorkflowForm icon={<Send className="w-5 h-5 text-emerald-600" />} title="Request Course Need" onSubmit={submitRequest}>
          <Select label="Student" value={requestForm.studentId} onChange={(studentId) => setRequestForm({ ...requestForm, studentId })} options={flow.students.map((student) => ({ value: student.id, label: student.name + ' - ' + student.grade }))} required />
          <Select label="Course needed" value={requestForm.courseId} onChange={(courseId) => setRequestForm({ ...requestForm, courseId })} options={flow.courses.map((course) => ({ value: course.id, label: course.name }))} required />
          <Text label="Reason" value={requestForm.reason} onChange={(reason) => setRequestForm({ ...requestForm, reason })} placeholder="Why this student needs this course" />
          <button type="submit" disabled={!flow.students.length || !flow.courses.length} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">Send to Principal</button>
          {(!flow.students.length || !flow.courses.length) && <p className="text-sm text-amber-700 md:col-span-2">Principal must assign students and active courses to this teacher before course requests can be sent.</p>}
        </WorkflowForm>
      )}

      {isApprover && (
        <WorkflowForm icon={<UserCheck className="w-5 h-5 text-blue-600" />} title="Principal Teacher Assignment" onSubmit={submitAssignment}>
          <Select label="Student" value={assignForm.studentId} onChange={(studentId) => setAssignForm({ ...assignForm, studentId })} options={flow.students.map((student) => ({ value: student.id, label: student.name + ' - ' + student.grade }))} required />
          <Select label="Teacher" value={assignForm.teacherId} onChange={(teacherId) => setAssignForm({ ...assignForm, teacherId })} options={flow.teachers.map((teacher) => ({ value: teacher.id, label: teacher.name + ' - ' + teacher.subject }))} required />
          <Select label="Course" value={assignForm.courseId} onChange={(courseId) => setAssignForm({ ...assignForm, courseId })} options={[{ value: '', label: 'No course' }, ...flow.courses.map((course) => ({ value: course.id, label: course.name }))]} />
          <Text label="Notes" value={assignForm.notes} onChange={(notes) => setAssignForm({ ...assignForm, notes })} placeholder="Assignment note" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Assign Teacher</button>
        </WorkflowForm>
      )}

      <RequestsTable requests={visibleRequests} canApprove={isApprover} onDecision={decide} />
      {isApprover && <AssignmentsTable assignments={flow.assignments} />}
    </div>
  );
};

type WorkflowFormProps = { icon: React.ReactNode; title: string; onSubmit: (event: React.FormEvent) => void; children: React.ReactNode };
const WorkflowForm: React.FC<WorkflowFormProps> = ({ icon, title, onSubmit, children }) => (
  <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </form>
);

type Option = { value: string | number; label: string };
type SelectProps = { label: string; value: string; onChange: (value: string) => void; options: Option[]; required?: boolean };
const Select: React.FC<SelectProps> = ({ label, value, onChange, options, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <select value={value} onChange={(event) => onChange(event.target.value)} required={required} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
      {options.map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}
    </select>
  </div>
);

type TextProps = { label: string; value: string; onChange: (value: string) => void; placeholder?: string };
const Text: React.FC<TextProps> = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input type="text" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
  </div>
);

type RequestsTableProps = {
  requests: CourseRequest[];
  canApprove: boolean;
  onDecision: (request: CourseRequest, decision: 'approve' | 'reject') => void;
};
const RequestsTable: React.FC<RequestsTableProps> = ({ requests, canApprove, onDecision }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden xl:col-span-2">
    <TableTitle title="Course Need Requests" />
    <DataTable
      headers={['Student', 'Course', 'Teacher', 'Status', ...(canApprove ? ['Action'] : [])]}
      empty="No course requests yet."
      colSpan={canApprove ? 5 : 4}
      isEmpty={!requests.length}
    >
      {requests.map((request) => (
        <tr key={request.id} className="hover:bg-gray-50">
          <td className="px-5 py-4"><div className="font-medium text-gray-900">{request.studentName}</div><div className="text-xs text-gray-500">{request.reason || 'No reason added'}</div></td>
          <td className="px-5 py-4 text-sm text-gray-700">{request.courseName}</td>
          <td className="px-5 py-4 text-sm text-gray-700">{request.teacherName}</td>
          <td className="px-5 py-4"><StatusBadge status={request.status} /></td>
          {canApprove && (
            <td className="px-5 py-4">
              {request.status === 'Pending'
                ? <div className="flex gap-2">
                    <button onClick={() => onDecision(request, 'approve')} className="text-emerald-700 hover:text-emerald-900 p-1" title="Approve" type="button"><CheckCircle className="w-5 h-5" /></button>
                    <button onClick={() => onDecision(request, 'reject')} className="text-red-700 hover:text-red-900 p-1" title="Reject" type="button"><XCircle className="w-5 h-5" /></button>
                  </div>
                : <span className="text-sm text-gray-500">Done</span>}
            </td>
          )}
        </tr>
      ))}
    </DataTable>
  </div>
);

const AssignmentsTable: React.FC<{ assignments: Assignment[] }> = ({ assignments }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden xl:col-span-2">
    <TableTitle title="Active Student Teacher Assignments" />
    <DataTable headers={['Student', 'Teacher', 'Course', 'Assigned By']} empty="No teacher assignments yet." colSpan={4} isEmpty={!assignments.length}>
      {assignments.map((assignment) => (
        <tr key={assignment.id} className="hover:bg-gray-50">
          <td className="px-5 py-4 text-sm font-medium text-gray-900">{assignment.studentName}</td>
          <td className="px-5 py-4 text-sm text-gray-700">{assignment.teacherName}</td>
          <td className="px-5 py-4 text-sm text-gray-700">{assignment.courseName || '-'}</td>
          <td className="px-5 py-4 text-sm text-gray-700">{assignment.assignedBy}</td>
        </tr>
      ))}
    </DataTable>
  </div>
);

const TableTitle: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-5 border-b border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
  </div>
);

type DataTableProps = { headers: string[]; empty: string; colSpan: number; isEmpty: boolean; children: React.ReactNode };
const DataTable: React.FC<DataTableProps> = ({ headers, empty, colSpan, isEmpty, children }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>{headers.map((header) => <th key={header} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{header}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {isEmpty ? <tr><td colSpan={colSpan} className="px-5 py-6 text-sm text-gray-500 text-center">{empty}</td></tr> : children}
      </tbody>
    </table>
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

export default CourseWorkflow;
