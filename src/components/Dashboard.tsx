import React from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';

type Role = 'admin' | 'principal' | 'teacher' | 'student' | 'parent';

type DashboardUser = {
  email: string;
  name: string;
  role: Role;
  label: string;
};

type DashboardProps = {
  user: DashboardUser;
};

const roleData = {
  admin: {
    title: 'Admin Control Dashboard',
    subtitle: 'Full system access for users, academics, finance, reports, and configuration.',
    stats: [
      { label: 'Total Students', value: '1,247', icon: Users, color: 'bg-blue-500', note: '+12% this month' },
      { label: 'Staff Accounts', value: '96', icon: GraduationCap, color: 'bg-emerald-500', note: '89 active' },
      { label: 'Monthly Fees', value: 'SAR 284K', icon: IndianRupee, color: 'bg-amber-500', note: '92% collected' },
      { label: 'System Alerts', value: '4', icon: ShieldCheck, color: 'bg-red-500', note: '2 high priority' },
    ],
    actions: ['Manage all users', 'Create roles', 'Approve fee changes', 'Export all reports'],
    timeline: [
      { title: 'New admission approved', detail: 'Irfan - Grade 8', time: '20 minutes ago' },
      { title: 'Teacher salary batch ready', detail: '96 records pending review', time: '1 hour ago' },
      { title: 'Backup completed', detail: 'MySQL daily backup successful', time: 'Today 5:00 AM' },
    ],
    scheduleTitle: 'Admin Priorities',
    schedule: [
      { title: 'Review principal report', meta: 'Academic year summary' },
      { title: 'Audit inactive accounts', meta: 'Students and staff' },
      { title: 'Fee reconciliation', meta: 'June collection cycle' },
    ],
  },
  principal: {
    title: 'Principal Dashboard',
    subtitle: 'Academic oversight, teacher performance, attendance trends, and exam planning.',
    stats: [
      { label: 'School Attendance', value: '94%', icon: CheckCircle2, color: 'bg-emerald-500', note: '+2% vs last week' },
      { label: 'Teachers Present', value: '84/89', icon: GraduationCap, color: 'bg-blue-500', note: '5 on leave' },
      { label: 'Active Courses', value: '34', icon: BookOpen, color: 'bg-purple-500', note: '5 need review' },
      { label: 'Upcoming Exams', value: '8', icon: FileText, color: 'bg-orange-500', note: 'This month' },
    ],
    actions: ['Approve exams', 'Review attendance', 'Assign teachers', 'View all reports'],
    timeline: [
      { title: 'Grade 7 attendance dropped', detail: 'Below 90% for 3 days', time: 'Today' },
      { title: 'Hadith exam schedule submitted', detail: 'Awaiting approval', time: 'Yesterday' },
      { title: 'Teacher observation due', detail: 'Arabic Literature class', time: 'Tomorrow' },
    ],
    scheduleTitle: 'Principal Schedule',
    schedule: [
      { title: 'Morning assembly', meta: '8:00 AM' },
      { title: 'Teacher review meeting', meta: '11:30 AM' },
      { title: 'Parent committee call', meta: '3:00 PM' },
    ],
  },
  teacher: {
    title: 'Teacher Dashboard',
    subtitle: 'Classroom view for assigned students, courses, exams, and grading tasks.',
    stats: [
      { label: 'Assigned Classes', value: '3', icon: BookOpen, color: 'bg-blue-500', note: 'Grades 3-4' },
      { label: 'My Students', value: '72', icon: Users, color: 'bg-emerald-500', note: '68 present today' },
      { label: 'Pending Grades', value: '18', icon: FileText, color: 'bg-orange-500', note: 'Due this week' },
      { label: 'Avg Class Score', value: '86%', icon: Award, color: 'bg-purple-500', note: '+4% improvement' },
    ],
    actions: ['View assigned students', 'Update exam marks', 'Take attendance', 'View class reports'],
    timeline: [
      { title: 'Arabic homework submitted', detail: '54 of 72 students', time: 'Today' },
      { title: 'Quiz marks pending', detail: 'Grade 4 grammar quiz', time: 'Due tomorrow' },
      { title: 'Parent note received', detail: 'Fatima Muhammad attendance', time: '2 hours ago' },
    ],
    scheduleTitle: 'My Classes Today',
    schedule: [
      { title: 'Arabic Grammar Fundamentals', meta: '10:00 - 11:00 AM' },
      { title: 'Revision Session', meta: '12:00 - 12:45 PM' },
      { title: 'Grade 4 Assessment', meta: '2:00 - 3:00 PM' },
    ],
  },
  student: {
    title: 'Student Dashboard',
    subtitle: 'Personal view for courses, exams, attendance, and academic progress.',
    stats: [
      { label: 'My Courses', value: '5', icon: BookOpen, color: 'bg-blue-500', note: '4 active' },
      { label: 'Attendance', value: '96%', icon: CheckCircle2, color: 'bg-emerald-500', note: 'Excellent' },
      { label: 'Next Exam', value: 'Jan 18', icon: Calendar, color: 'bg-orange-500', note: 'Hadith Studies' },
      { label: 'Average Score', value: '88%', icon: Award, color: 'bg-purple-500', note: 'Top 15%' },
    ],
    actions: ['View my courses', 'Check exam schedule', 'Download report card', 'View attendance'],
    timeline: [
      { title: 'Quran recitation completed', detail: 'Lesson 12 signed off', time: 'Today' },
      { title: 'Arabic assignment due', detail: 'Submit before 8 PM', time: 'Today' },
      { title: 'Exam reminder', detail: 'Hadith Studies Final', time: 'In 3 days' },
    ],
    scheduleTitle: 'My Day',
    schedule: [
      { title: 'Quran Memorization', meta: '8:00 - 9:30 AM' },
      { title: 'Arabic Grammar', meta: '10:00 - 11:00 AM' },
      { title: 'Islamic History', meta: '11:30 AM - 12:30 PM' },
    ],
  },
  parent: {
    title: 'Parent Dashboard',
    subtitle: 'Guardian view for child progress, attendance, exams, and school notices.',
    stats: [
      { label: 'Child Attendance', value: '96%', icon: CheckCircle2, color: 'bg-emerald-500', note: 'Present today' },
      { label: 'Pending Fees', value: 'SAR 0', icon: IndianRupee, color: 'bg-blue-500', note: 'Paid for June' },
      { label: 'Upcoming Exams', value: '2', icon: FileText, color: 'bg-orange-500', note: 'This month' },
      { label: 'Avg Score', value: '88%', icon: Award, color: 'bg-purple-500', note: '+3% this term' },
    ],
    actions: ['View child record', 'Check attendance', 'View exam results', 'Read notices'],
    timeline: [
      { title: 'Ahmed marked present', detail: 'Checked in at 7:52 AM', time: 'Today' },
      { title: 'Teacher feedback added', detail: 'Good Quran memorization progress', time: 'Yesterday' },
      { title: 'Fee receipt generated', detail: 'June tuition paid', time: '3 days ago' },
    ],
    scheduleTitle: 'Child Schedule',
    schedule: [
      { title: 'Quran Memorization', meta: '8:00 - 9:30 AM' },
      { title: 'Arabic Grammar', meta: '10:00 - 11:00 AM' },
      { title: 'Hadith Revision', meta: '2:00 - 3:30 PM' },
    ],
  },
};

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const dashboard = roleData[user.role];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-700">{user.label} Access</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">{dashboard.title}</h2>
            <p className="text-gray-600 mt-2">{dashboard.subtitle}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-gray-500">Logged in as</p>
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboard.stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
                    <span className="text-sm text-emerald-600 font-medium">{stat.note}</span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900">Allowed Actions</h3>
            <ShieldCheck className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {dashboard.actions.map((action) => (
              <div key={action} className="flex items-center space-x-3 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900">Recent Updates</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {dashboard.timeline.map((item) => (
              <div key={`${item.title}-${item.time}`} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.detail}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900">{dashboard.scheduleTitle}</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {dashboard.schedule.map((item) => (
              <div key={`${item.title}-${item.meta}`} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-600">{item.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
