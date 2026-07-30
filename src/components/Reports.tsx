import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, TrendingUp, Users, BookOpen, Award, Calendar } from 'lucide-react';
import { apiRequest } from '../api';
import type { AppUser, Role } from '../access';

type ReportType = 'academic' | 'attendance' | 'financial' | 'enrollment';

type ReportResponse = any;

type ReportsProps = {
  user: AppUser;
};

const currency = (value: number) => `SAR ${Number(value || 0).toLocaleString()}`;

const reportAccess: Record<Role, ReportType[]> = {
  admin: ['academic', 'attendance', 'financial', 'enrollment'],
  principal: ['academic', 'attendance', 'financial', 'enrollment'],
  teacher: ['academic', 'attendance'],
  student: ['academic', 'attendance'],
  parent: ['academic', 'attendance'],
};

const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('academic');
  const [dateRange, setDateRange] = useState('this-month');
  const [report, setReport] = useState<ReportResponse>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const allowedReports = useMemo(() => reportAccess[user.role], [user.role]);
  const scopedStudentName = user.role === 'student' || user.role === 'parent' ? user.linkedStudentName || user.name : '';
  const institutionId = String(user.institutionId || 1);

  const reportTypes = [
    { id: 'academic' as const, label: 'Academic Performance', icon: Award },
    { id: 'attendance' as const, label: 'Attendance Report', icon: Users },
    { id: 'financial' as const, label: 'Financial Summary', icon: TrendingUp },
    { id: 'enrollment' as const, label: 'Enrollment Statistics', icon: BookOpen },
  ].filter((reportType) => allowedReports.includes(reportType.id));

  useEffect(() => {
    if (!allowedReports.includes(selectedReport)) {
      setSelectedReport(allowedReports[0]);
      return;
    }

    const loadReport = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          type: selectedReport,
          range: dateRange,
          role: user.role,
          institutionId,
        });
        if (scopedStudentName) params.set('studentName', scopedStudentName);
        setReport(await apiRequest(`/reports?${params.toString()}`));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [selectedReport, dateRange, user.role, scopedStudentName, institutionId, allowedReports]);

  const renderAcademicReport = () => {
    const summary = report?.summary ?? {};
    const data = report?.data ?? [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard color="blue" value={`${summary.overallAverage ?? 0}%`} label="Overall Average" />
          <SummaryCard color="green" value={`${summary.passRate ?? 0}%`} label="Pass Rate" />
          <SummaryCard color="purple" value={summary.studentsAssessed ?? 0} label="Students Assessed" />
          <SummaryCard color="orange" value={summary.subjects ?? 0} label="Subjects" />
        </div>

        <DataTable title="Subject-wise Performance" headers={['Subject', 'Students', 'Avg Score', 'Pass Rate', 'Performance']}>
          {data.map((subject: any) => (
            <tr key={subject.subject}>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{subject.subject}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">{subject.students}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">{subject.avgScore}%</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">{subject.passRate}%</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${subject.avgScore}%` }}></div>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    );
  };

  const renderAttendanceReport = () => {
    const summary = report?.summary ?? {};
    const data = report?.data ?? [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard color="blue" value={`${summary.overallAttendance ?? 0}%`} label="Overall Attendance" />
          <SummaryCard color="green" value={summary.presentToday ?? 0} label="Present Today" />
          <SummaryCard color="red" value={summary.absentToday ?? 0} label="Absent Today" />
          <SummaryCard color="yellow" value={summary.totalGrades ?? 0} label="Total Grades" />
        </div>

        <DataTable title="Grade-wise Attendance" headers={['Grade', 'Total Students', 'Present', 'Absent', 'Avg Attendance']}>
          {data.map((grade: any) => (
            <tr key={grade.grade}>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{grade.grade}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">{grade.students}</td>
              <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">{grade.present}</td>
              <td className="px-6 py-4 whitespace-nowrap text-red-600 font-medium">{grade.absent}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  grade.avgAttendance >= 95 ? 'bg-green-100 text-green-800' :
                  grade.avgAttendance >= 90 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {grade.avgAttendance}%
                </span>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    );
  };

  const renderFinancialReport = () => {
    const summary = report?.summary ?? {};
    const breakdown = report?.breakdown ?? [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard color="green" value={currency(summary.totalRevenue)} label="Total Revenue" large />
          <SummaryCard color="red" value={currency(summary.totalExpenses)} label="Total Expenses" large />
          <SummaryCard color="blue" value={currency(summary.netProfit)} label="Net Profit" large />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
            <div className="space-y-4">
              {breakdown.map((item: any) => (
                <div key={item.category} className="flex justify-between items-center">
                  <span className="text-gray-600">{item.category}</span>
                  <span className="font-medium">{currency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Health</h3>
            <Progress label="Expenses vs Revenue" value={summary.revenueVsExpenses ?? 0} color="bg-green-600" />
            <Progress label="Profit Margin" value={summary.profitMargin ?? 0} color="bg-blue-600" />
          </div>
        </div>
      </div>
    );
  };

  const renderEnrollmentReport = () => {
    const summary = report?.summary ?? {};
    const byGrade = report?.byGrade ?? [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <SummaryCard color="blue" value={summary.totalStudents ?? 0} label="Total Students" />
          <SummaryCard color="green" value={summary.activeStudents ?? 0} label="Active Students" />
          <SummaryCard color="purple" value={summary.newEnrollments ?? 0} label="New Enrollments" />
          <SummaryCard color="orange" value={summary.inactiveStudents ?? 0} label="Inactive Students" />
          <SummaryCard color="emerald" value={`+${summary.monthlyGrowth ?? 0}%`} label="Growth Rate" />
        </div>

        <DataTable title="Grade-wise Enrollment" headers={['Grade', 'Students']}>
          {byGrade.map((grade: any) => (
            <tr key={grade.grade}>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{grade.grade}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">{grade.students}</td>
            </tr>
          ))}
        </DataTable>
      </div>
    );
  };

  const renderReportContent = () => {
    if (loading) return <div className="bg-white rounded-lg p-4 text-gray-600 shadow-sm">Loading report from database...</div>;
    if (error) return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>;

    switch (selectedReport) {
      case 'academic':
        return renderAcademicReport();
      case 'attendance':
        return renderAttendanceReport();
      case 'financial':
        return renderFinancialReport();
      case 'enrollment':
        return renderEnrollmentReport();
      default:
        return renderAcademicReport();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">
            {scopedStudentName ? `Reports scoped to ${scopedStudentName}.` : 'Database-driven reports prepared for multi-institution growth.'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="this-quarter">This Quarter</option>
              <option value="this-year">This Year</option>
            </select>
          </div>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-2">
        <nav className="flex space-x-1">
          {reportTypes.map((reportType) => {
            const Icon = reportType.icon;
            return (
              <button
                key={reportType.id}
                onClick={() => setSelectedReport(reportType.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedReport === reportType.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:block">{reportType.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="transition-all duration-300">{renderReportContent()}</div>
    </div>
  );
};

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 text-blue-700',
  green: 'bg-green-50 text-green-600 text-green-700',
  red: 'bg-red-50 text-red-600 text-red-700',
  purple: 'bg-purple-50 text-purple-600 text-purple-700',
  orange: 'bg-orange-50 text-orange-600 text-orange-700',
  yellow: 'bg-yellow-50 text-yellow-600 text-yellow-700',
  emerald: 'bg-emerald-50 text-emerald-600 text-emerald-700',
};

const SummaryCard = ({ color, value, label, large = false }: { color: string; value: React.ReactNode; label: string; large?: boolean }) => {
  const [bg, valueColor, labelColor] = colorMap[color].split(' ');
  return (
    <div className={`${bg} rounded-lg ${large ? 'p-6' : 'p-4'}`}>
      <div className={`${large ? 'text-3xl' : 'text-2xl'} font-bold ${valueColor}`}>{value}</div>
      <div className={`text-sm ${labelColor}`}>{label}</div>
    </div>
  );
};

const DataTable = ({ title, headers, children }: { title: string; headers: string[]; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">{children}</tbody>
      </table>
    </div>
  </div>
);

const Progress = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium">{value}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className={`${color} h-2 rounded-full`} style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}></div>
    </div>
  </div>
);

export default Reports;
