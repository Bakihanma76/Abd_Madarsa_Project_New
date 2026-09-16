import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { apiRequest } from '../api';
import type { AppUser } from '../access';

type PendingStudent = {
  id: number;
  name: string;
  email?: string;
  grade: string;
  guardianName: string;
  phone: string;
  status: string;
};

type PendingParent = {
  id: number;
  name: string;
  email: string;
  linkedStudentName: string;
  status: string;
  message: string;
};

type VerificationData = {
  pendingStudents: PendingStudent[];
  pendingParents: PendingParent[];
};

type VerificationProps = { user: AppUser };

const Verification: React.FC<VerificationProps> = ({ user }) => {
  const [data, setData] = useState<VerificationData>({ pendingStudents: [], pendingParents: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<VerificationData>('/verifications?institutionId=' + String(user.institutionId || 1));
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load verification queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user.institutionId]);

  const decide = async (type: 'student' | 'parent', id: number, decision: 'approve' | 'reject') => {
    setError('');
    try {
      await apiRequest('/verifications/' + type + '/' + id + '/decision', {
        method: 'PUT',
        body: JSON.stringify({ decision, decidedBy: user.name }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update verification');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Verification Queue</h2>
          <p className="text-gray-600">Approve or reject student registrations and parent-child links before accounts become active.</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}
      {loading && <div className="bg-white rounded-lg p-4 text-gray-600 shadow-sm">Loading verification queue...</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Summary label="Pending Students" value={data.pendingStudents.length} />
        <Summary label="Pending Parents" value={data.pendingParents.length} />
        <Summary label="Total Pending" value={data.pendingStudents.length + data.pendingParents.length} />
      </div>

      <section className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Student Registrations</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {data.pendingStudents.map((student) => (
            <div key={student.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">{student.name}</p>
                <p className="text-sm text-gray-600">{student.email || 'No email'} · {student.grade} · Guardian: {student.guardianName}</p>
                <p className="text-xs text-amber-700 mt-1">Status: {student.status}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => decide('student', student.id, 'approve')} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />Approve</button>
                <button type="button" onClick={() => decide('student', student.id, 'reject')} className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 flex items-center gap-1"><UserX className="w-4 h-4" />Reject</button>
              </div>
            </div>
          ))}
          {data.pendingStudents.length === 0 && <div className="p-6 text-gray-500">No pending student registrations.</div>}
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Parent Links</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {data.pendingParents.map((parent) => (
            <div key={parent.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">{parent.name}</p>
                <p className="text-sm text-gray-600">{parent.email} · Linked student: {parent.linkedStudentName}</p>
                <p className="text-xs text-gray-500 mt-1">{parent.message}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => decide('parent', parent.id, 'approve')} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />Approve</button>
                <button type="button" onClick={() => decide('parent', parent.id, 'reject')} className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 flex items-center gap-1"><UserX className="w-4 h-4" />Reject</button>
              </div>
            </div>
          ))}
          {data.pendingParents.length === 0 && <div className="p-6 text-gray-500">No pending parent links.</div>}
        </div>
      </section>
    </div>
  );
};

const Summary: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-white rounded-lg p-4 shadow-sm">
    <p className="text-sm text-gray-600">{label}</p>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

export default Verification;
