import React, { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, IndianRupee, ReceiptText, Search, WalletCards } from 'lucide-react';
import { apiRequest } from '../api';
import type { AppUser } from '../access';

type FeeStudent = {
  studentId: number;
  studentName: string;
  parentName: string;
  grade: string;
  status: string;
  totalCharged: number | string;
  totalPaid: number | string;
  balance: number | string;
  paidTillMonth?: string | null;
  lastPaymentDate?: string | null;
};

type FeePayment = {
  id: number;
  studentName: string;
  parentName: string;
  amount: number | string;
  paymentDate: string;
  paidTillMonth?: string | null;
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected';
  verifiedBy?: string | null;
};

type FeeTrackerData = {
  accrual: { month: string; applied: boolean; created: number; amount: number };
  summary: { totalCharged: number; totalPaid: number; totalBalance: number };
  students: FeeStudent[];
  recentPayments: FeePayment[];
};

type FeeTrackerProps = { user: AppUser };

const money = (value: number | string | undefined) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
const today = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => new Date().toISOString().slice(0, 7);

const FeeTracker: React.FC<FeeTrackerProps> = ({ user }) => {
  const [data, setData] = useState<FeeTrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [tillDate, setTillDate] = useState('');
  const [paidTillMonth, setPaidTillMonth] = useState(currentMonth());
  const [paymentDate, setPaymentDate] = useState(today());
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<FeeTrackerData>('/fee-tracker?institutionId=' + String(user.institutionId || 1));
      setData(result);
      if (!studentId && result.students[0]) setStudentId(String(result.students[0].studentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load fee tracker');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user.institutionId]);

  const selectedStudent = data?.students.find((student) => String(student.studentId) === studentId);
  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!data) return [];
    return data.students.filter((student) =>
      student.studentName.toLowerCase().includes(term) ||
      student.parentName.toLowerCase().includes(term) ||
      student.grade.toLowerCase().includes(term),
    );
  }, [data, search]);

  const submitPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await apiRequest('/fee-tracker/payments', {
        method: 'POST',
        body: JSON.stringify({
          institutionId: user.institutionId || 1,
          studentId: Number(studentId),
          amount: Number(amount),
          fromDate: fromDate || undefined,
          tillDate: tillDate || undefined,
          paidTillMonth: paidTillMonth || undefined,
          paymentDate,
          notes,
        }),
      });
      setAmount('');
      setNotes('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save payment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fees Balance Tracker</h2>
          <p className="text-gray-600">Monthly fees auto-add on the 5th. Enter payments to reduce each student's balance.</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}
      {loading && <div className="bg-white rounded-lg p-4 shadow-sm text-gray-600">Loading fee tracker...</div>}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Summary label="Charged" value={money(data.summary.totalCharged)} icon={CalendarPlus} color="bg-blue-500" />
            <Summary label="Paid" value={money(data.summary.totalPaid)} icon={ReceiptText} color="bg-emerald-500" />
            <Summary label="Balance" value={money(data.summary.totalBalance)} icon={WalletCards} color="bg-amber-500" />
            <Summary label="Auto Fee" value={data.accrual.applied ? data.accrual.month : 'Waiting 5th'} icon={IndianRupee} color="bg-purple-500" note={data.accrual.applied ? data.accrual.created + ' new charges' : money(data.accrual.amount)} />
          </div>

          <form onSubmit={submitPayment} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">Enter Payment</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Parent / Student</label>
                <select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required>
                  {data.students.map((student) => <option key={student.studentId} value={student.studentId}>{student.parentName} - {student.studentName} - Balance {money(student.balance)}</option>)}
                </select>
              </div>
              <Field label="Amount" type="number" value={amount} onChange={setAmount} placeholder={selectedStudent ? 'Balance ' + money(selectedStudent.balance) : 'Enter amount'} required />
              <Field label="Paid till month" type="month" value={paidTillMonth} onChange={setPaidTillMonth} required />
              <Field label="Balance from date" type="date" value={fromDate} onChange={setFromDate} placeholder="From date" />
              <Field label="Balance till date" type="date" value={tillDate} onChange={setTillDate} placeholder="Till date" />
              <Field label="Payment date" type="date" value={paymentDate} onChange={setPaymentDate} required />
              <Field label="Notes" value={notes} onChange={setNotes} placeholder="Receipt, mode, or remarks" />
            </div>
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">Save payment and reduce balance</button>
          </form>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Student Balances</h3>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search parent/student/grade" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Till</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="px-5 py-4"><div className="font-medium text-gray-900">{student.studentName}</div><div className="text-xs text-gray-500">{student.grade} - {student.status}</div></td>
                      <td className="px-5 py-4 text-sm text-gray-700">{student.parentName}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{student.paidTillMonth || 'Not paid'}</td>
                      <td className="px-5 py-4 text-sm text-emerald-700 font-medium">{money(student.totalPaid)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-amber-700">{money(student.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Payment Verification</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Till</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.recentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4"><div className="font-medium text-gray-900">{payment.studentName}</div><div className="text-xs text-gray-500">{payment.paymentDate}</div></td>
                      <td className="px-5 py-4 text-sm text-gray-700">{payment.parentName}</td>
                      <td className="px-5 py-4 text-sm text-emerald-700 font-medium">{money(payment.amount)}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{payment.paidTillMonth || '-'}</td>
                      <td className="px-5 py-4"><StatusBadge status={payment.verificationStatus || 'Verified'} verifiedBy={payment.verifiedBy} /></td>
                    </tr>
                  ))}
                  {data.recentPayments.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-6 text-sm text-gray-500 text-center">No payments entered yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

type SummaryProps = { label: string; value: string; icon: React.ElementType; color: string; note?: string };
const Summary: React.FC<SummaryProps> = ({ label, value, icon: Icon, color, note }) => (
  <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
    <div><p className="text-sm text-gray-600">{label}</p><p className="text-xl font-bold text-gray-900 mt-1">{value}</p>{note && <p className="text-xs text-gray-500 mt-1">{note}</p>}</div>
    <div className={color + ' p-3 rounded-lg'}><Icon className="w-5 h-5 text-white" /></div>
  </div>
);

type StatusBadgeProps = { status: 'Pending' | 'Verified' | 'Rejected'; verifiedBy?: string | null };
const StatusBadge: React.FC<StatusBadgeProps> = ({ status, verifiedBy }) => {
  const styles = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <span className={'inline-flex px-2 py-1 rounded-full border text-xs font-semibold ' + styles[status]}>{status}</span>
      {status === 'Verified' && verifiedBy && <span className="text-xs text-gray-500">by {verifiedBy}</span>}
    </div>
  );
};

type FieldProps = { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean };
const Field: React.FC<FieldProps> = ({ label, value, onChange, type = 'text', placeholder, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
  </div>
);

export default FeeTracker;
