import React from 'react';
import { Users, GraduationCap, BookOpen, FileText, TrendingUp, Calendar, Award, Clock } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { label: 'Total Students', value: '1,247', icon: Users, color: 'bg-blue-500', change: '+12%' },
    { label: 'Active Teachers', value: '89', icon: GraduationCap, color: 'bg-emerald-500', change: '+5%' },
    { label: 'Courses Offered', value: '34', icon: BookOpen, color: 'bg-purple-500', change: '+2%' },
    { label: 'Upcoming Exams', value: '8', icon: FileText, color: 'bg-orange-500', change: '0%' },
  ];

  const recentActivities = [
    { action: 'New student enrolled', details: 'Ahmed Hassan - Grade 5', time: '2 hours ago' },
    { action: 'Exam results published', details: 'Quran Memorization - Grade 7', time: '4 hours ago' },
    { action: 'Course updated', details: 'Arabic Literature syllabus revised', time: '1 day ago' },
    { action: 'Teacher assigned', details: 'Fatima Ali assigned to Grade 3', time: '2 days ago' },
  ];

  const upcomingExams = [
    { subject: 'Quran Recitation', grade: 'Grade 4', date: '2024-01-15', time: '9:00 AM' },
    { subject: 'Islamic History', grade: 'Grade 6', date: '2024-01-16', time: '10:00 AM' },
    { subject: 'Arabic Grammar', grade: 'Grade 5', date: '2024-01-18', time: '11:00 AM' },
    { subject: 'Hadith Studies', grade: 'Grade 7', date: '2024-01-20', time: '2:00 PM' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
                    <span className="text-sm text-emerald-600 font-medium">{stat.change}</span>
                    <span className="text-xs text-gray-500 ml-1">this month</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Exams</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {upcomingExams.map((exam, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{exam.subject}</p>
                  <p className="text-sm text-gray-600">{exam.grade}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{exam.date}</p>
                  <p className="text-sm text-gray-600">{exam.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Academic Performance Overview</h3>
          <Award className="w-5 h-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-emerald-600">87%</span>
            </div>
            <p className="font-medium text-gray-900">Average Score</p>
            <p className="text-sm text-gray-600">Across all subjects</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-blue-600">94%</span>
            </div>
            <p className="font-medium text-gray-900">Attendance Rate</p>
            <p className="text-sm text-gray-600">This semester</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-purple-600">156</span>
            </div>
            <p className="font-medium text-gray-900">Quran Completion</p>
            <p className="text-sm text-gray-600">Students this year</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;