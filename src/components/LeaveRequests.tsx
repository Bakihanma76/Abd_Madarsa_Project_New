import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CalendarDays, Check, Clock, Send, X } from 'lucide-react';
import { apiRequest } from '../api';
import type { AppUser } from '../access';

type LeaveRequest = {
  id: number;
  institutionId: number;
  studentName: string;
  grade: string;
  requesterRole: 'student' | 'parent';
  requesterName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  teacherName?: string | null;
  teacherResponse?: string | null;
  decidedBy?: string | null;
  createdAt?: string;
};

type Notification = {
  id: number;
  title: string;
  message: string;
  status: 'Unread' | 'Read';
  createdAt?: string;
};

type Student = {
  name: string;
  grade: string;
  guardianName: string;
  institutionId?: number;
};

type LeaveRequestsProps = {
  user: AppUser;
};

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('en-IN') : '-';

const statusClass = (status: LeaveRequest['status']) => {
  if (status === 'Approved') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Rejected') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-800';
};

const LeaveRequests: React.FC<LeaveRequestsProps> = ({ user }) => {
  const canRaise = user.role === 'student' || user.role === 'parent';
  const canDecide = user.role === 'teacher';
  const scopedStudentName = user.role === 'parent' ? user.linkedStudentName || '' : user.linkedStudentName || user.name;
  const recipientName = user.role === 'parent' ? user.name : scopedStudentName;
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentName, setStudentName] = useState(scopedStudentName);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [decisionNotes, setDecisionNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const visibleStudentOptions = useMemo(() => {
    if (user.role === 'parent' || user.role === 'student') {
      return students.filter((student) => student.name === scopedStudentName);
    }
    return students;
  }, [students, scopedStudentName, user.role]);

  const selectedStudent = visibleStudentOptions.find((student) => student.name === studentName);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        role: user.role,
        institutionId: String(user.institutionId || 1),
      });
      if (user.role === 'student' || user.role === 'parent') params.set('studentName', scopedStudentName);
      if (user.role === 'teacher') params.set('teacherName', user.linkedTeacherName || user.name);

      const notificationParams = new URLSearchParams({
        role: user.role,
        institutionId: String(user.institutionId || 1),
      });
      if (recipientName) notificationParams.set('recipientName', recipientName);

      const [requestRows, notificationRows, studentRows] = await Promise.all([
        apiRequest<LeaveRequest[]>('/leave-requests?' + params.toString()),
        apiRequest<Notification[]>('/notifications?' + notificationParams.toString()),
        apiRequest<Student[]>('/students'),
      ]);

      setRequests(requestRows);
      setNotifications(notificationRows);
      setStudents(studentRows.filter((student) => !user.institutionId || !student.institutionId || Number(student.institutionId) === Number(user.institutionId)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user.email, user.role, user.institutionId, user.linkedStudentName, user.linkedTeacherName]);

  useEffect(() => {
    if (scopedStudentName) setStudentName(scopedStudentName);
  }, [scopedStudentName]);

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await apiRequest<LeaveRequest>('/leave-requests', {
        method: 'POST',
        body: JSON.stringify({
          institutionId: user.institutionId || 1,
          studentName,
          grade: selectedStudent?.grade,
          requesterRole: user.role,
          requesterName: user.name,
          startDate,
          endDate,
          reason,
          teacherName: user.role === 'student' || user.role === 'parent' ? undefined : user.name,
        }),
      });
      setStartDate('');
      setEndDate('');
      setReason('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit leave request');
    }
  };

  const decide = async (request: LeaveRequest, status: 'Approved' | 'Rejected') => {
    setError('');
    try {
      await apiRequest<LeaveRequest>('/leave-requests/' + request.id + '/decision', {
        method: 'PUT',
        body: JSON.stringify({
          status,
          teacherName: user.linkedTeacherName || user.name,
          decidedBy: user.name,
          teacherResponse: decisionNotes[request.id] || '',
        }),
      });
      setDecisionNotes((current) => ({ ...current, [request.id]: '' }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update leave request');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Requests</h2>
          <p className="text-gray-600">Students or parents can request leave. Teachers can approve or reject with a reason.</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}
      {loading && <div className="bg-white rounded-lg p-4 text-gray-600 shadow-sm">Loading leave requests...</div>}

      {canRaise && (
        <form onSubmit={submitRequest} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Request Leave</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
              <select
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              >
                {visibleStudentOptions.length === 0 && <option value={studentName}>{studentName || 'Linked student not found'}</option>}
                {visibleStudentOptions.map((student) => <option key={student.name} value={student.name}>{student.name} - {student.grade}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Leave reason</label>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Mention the reason for leave" required />
          </div>
          <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
            <Send className="w-4 h-4" />
            <span>Submit Request</span>
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Leave History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  {canDecide && <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Decision</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="align-top hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-gray-900">{request.studentName}</div>
                      <div className="text-xs text-gray-500">{request.grade} by {request.requesterName}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDate(request.startDate)} to {formatDate(request.endDate)}</td>
                    <td className="px-5 py-4 text-sm text-gray-700 min-w-64">
                      <p>{request.reason}</p>
                      {request.teacherResponse && <p className="mt-2 text-xs text-gray-500">Teacher note: {request.teacherResponse}</p>}
                    </td>
                    <td className="px-5 py-4"><span className={'inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + statusClass(request.status)}>{request.status}</span></td>
                    {canDecide && (
                      <td className="px-5 py-4 min-w-64">
                        {request.status === 'Pending' ? (
                          <div className="space-y-2">
                            <textarea value={decisionNotes[request.id] || ''} onChange={(event) => setDecisionNotes((current) => ({ ...current, [request.id]: event.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Approval/rejection note" />
                            <div className="flex gap-2">
                              <button onClick={() => decide(request, 'Approved')} type="button" className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 flex items-center gap-1"><Check className="w-3 h-3" />Approve</button>
                              <button onClick={() => decide(request, 'Rejected')} type="button" className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 flex items-center gap-1"><X className="w-3 h-3" />Reject</button>
                            </div>
                          </div>
                        ) : <span className="text-xs text-gray-500">Decided by {request.decidedBy || request.teacherName || 'teacher'}</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {requests.length === 0 && <div className="text-center py-10 text-gray-500">No leave requests found.</div>}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  {notification.status === 'Unread' && <span className="text-[10px] uppercase tracking-wide text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">New</span>}
                </div>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-2"><Clock className="w-3 h-3" />{formatDate(notification.createdAt)}</div>
              </div>
            ))}
            {notifications.length === 0 && <div className="text-sm text-gray-500">No notifications yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequests;
