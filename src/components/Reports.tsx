import React, { useState } from 'react';
import { BarChart3, Download, Filter, TrendingUp, Users, BookOpen, Award, Calendar } from 'lucide-react';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('academic');
  const [dateRange, setDateRange] = useState('this-month');

  const reportTypes = [
    { id: 'academic', label: 'Academic Performance', icon: Award },
    { id: 'attendance', label: 'Attendance Report', icon: Users },
    { id: 'financial', label: 'Financial Summary', icon: TrendingUp },
    { id: 'enrollment', label: 'Enrollment Statistics', icon: BookOpen },
  ];

  const academicData = [
    { subject: 'Quran & Tajweed', students: 156, avgScore: 87.5, passRate: 94 },
    { subject: 'Arabic Literature', students: 134, avgScore: 82.3, passRate: 89 },
    { subject: 'Islamic History', students: 145, avgScore: 85.1, passRate: 92 },
    { subject: 'Hadith Studies', students: 98, avgScore: 88.7, passRate: 96 },
    { subject: 'Fiqh & Jurisprudence', students: 112, avgScore: 84.2, passRate: 88 },
  ];

  const attendanceData = [
    { grade: 'Grade 1', students: 89, avgAttendance: 96.2, present: 86, absent: 3 },
    { grade: 'Grade 2', students: 92, avgAttendance: 94.8, present: 87, absent: 5 },
    { grade: 'Grade 3', students: 88, avgAttendance: 93.5, present: 82, absent: 6 },
    { grade: 'Grade 4', students: 85, avgAttendance: 95.1, present: 81, absent: 4 },
    { grade: 'Grade 5', students: 79, avgAttendance: 92.7, present: 73, absent: 6 },
    { grade: 'Grade 6', students: 76, avgAttendance: 91.9, present: 70, absent: 6 },
    { grade: 'Grade 7', students: 72, avgAttendance: 89.8, present: 65, absent: 7 },
    { grade: 'Grade 8', students: 68, avgAttendance: 88.2, present: 60, absent: 8 },
  ];

  const financialData = {
    totalRevenue: 2845000,
    totalExpenses: 2156000,
    netProfit: 689000,
    teacherSalaries: 1456000,
    operationalCosts: 456000,
    maintenance: 244000,
  };

  const enrollmentData = {
    totalStudents: 649,
    newEnrollments: 67,
    graduations: 42,
    transfers: 8,
    monthlyGrowth: 3.2,
  };

  const renderAcademicReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">87.2%</div>
          <div className="text-sm text-blue-700">Overall Average</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">91.8%</div>
          <div className="text-sm text-green-700">Pass Rate</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">645</div>
          <div className="text-sm text-purple-700">Students Assessed</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">5</div>
          <div className="text-sm text-orange-700">Subjects</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Subject-wise Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {academicData.map((subject, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {subject.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {subject.students}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {subject.avgScore}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {subject.passRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full" 
                        style={{width: `${subject.avgScore}%`}}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAttendanceReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">93.1%</div>
          <div className="text-sm text-blue-700">Overall Attendance</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">604</div>
          <div className="text-sm text-green-700">Present Today</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">45</div>
          <div className="text-sm text-red-700">Absent Today</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">8</div>
          <div className="text-sm text-yellow-700">Total Grades</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Grade-wise Attendance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendanceData.map((grade, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {grade.grade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {grade.students}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                    {grade.present}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-red-600 font-medium">
                    {grade.absent}
                  </td>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFinancialReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-6">
          <div className="text-3xl font-bold text-green-600">
            SAR {financialData.totalRevenue.toLocaleString()}
          </div>
          <div className="text-sm text-green-700">Total Revenue</div>
        </div>
        <div className="bg-red-50 rounded-lg p-6">
          <div className="text-3xl font-bold text-red-600">
            SAR {financialData.totalExpenses.toLocaleString()}
          </div>
          <div className="text-sm text-red-700">Total Expenses</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="text-3xl font-bold text-blue-600">
            SAR {financialData.netProfit.toLocaleString()}
          </div>
          <div className="text-sm text-blue-700">Net Profit</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Teacher Salaries</span>
              <span className="font-medium">SAR {financialData.teacherSalaries.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Operational Costs</span>
              <span className="font-medium">SAR {financialData.operationalCosts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Maintenance</span>
              <span className="font-medium">SAR {financialData.maintenance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Revenue vs Expenses</span>
                <span className="text-sm font-medium">76%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: '76%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Profit Margin</span>
                <span className="text-sm font-medium">24%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '24%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEnrollmentReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{enrollmentData.totalStudents}</div>
          <div className="text-sm text-blue-700">Total Students</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{enrollmentData.newEnrollments}</div>
          <div className="text-sm text-green-700">New Enrollments</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{enrollmentData.graduations}</div>
          <div className="text-sm text-purple-700">Graduations</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">{enrollmentData.transfers}</div>
          <div className="text-sm text-orange-700">Transfers</div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-emerald-600">+{enrollmentData.monthlyGrowth}%</div>
          <div className="text-sm text-emerald-700">Growth Rate</div>
        </div>
      </div>
    </div>
  );

  const renderReportContent = () => {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Comprehensive reports and data insights</p>
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

      {/* Report Type Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-2">
        <nav className="flex space-x-1">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedReport === report.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:block">{report.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Report Content */}
      <div className="transition-all duration-300">
        {renderReportContent()}
      </div>
    </div>
  );
};

export default Reports;