import React, { useState } from 'react';
import { Search, Plus, Edit, Eye, Trash2, Filter, FileText, Calendar, Clock, Users } from 'lucide-react';
import ExamModal from './ExamModal';

const Exams = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const exams = [
    { id: 1, title: 'Quran Recitation Assessment', course: 'Quran Memorization Level 1', grade: 'Grade 1-2', date: '2024-01-15', time: '9:00 AM', duration: 60, students: 25, status: 'Upcoming', teacher: 'Dr. Abdullah Rahman', totalMarks: 100 },
    { id: 2, title: 'Arabic Grammar Mid-Term', course: 'Arabic Grammar Fundamentals', grade: 'Grade 3-4', date: '2024-01-16', time: '10:00 AM', duration: 90, students: 22, status: 'Upcoming', teacher: 'Ustadha Fatima Al-Zahra', totalMarks: 100 },
    { id: 3, title: 'Islamic History Quiz', course: 'Islamic History & Civilization', grade: 'Grade 5-6', date: '2024-01-12', time: '11:30 AM', duration: 45, students: 28, status: 'Completed', teacher: 'Sheikh Omar Ibn Khalid', totalMarks: 50 },
    { id: 4, title: 'Hadith Studies Final Exam', course: 'Hadith Studies Advanced', grade: 'Grade 7-8', date: '2024-01-18', time: '2:00 PM', duration: 120, students: 18, status: 'Upcoming', teacher: 'Ustadha Aisha Mahmoud', totalMarks: 150 },
    { id: 5, title: 'Fiqh Practical Assessment', course: 'Fiqh & Islamic Law', grade: 'Grade 6-8', date: '2024-01-20', time: '1:00 PM', duration: 90, students: 20, status: 'Scheduled', teacher: 'Dr. Hassan Al-Qadri', totalMarks: 100 },
  ];

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === '' || exam.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddExam = () => {
    setSelectedExam(null);
    setShowModal(true);
  };

  const handleEditExam = (exam) => {
    setSelectedExam(exam);
    setShowModal(true);
  };

  const handleViewExam = (exam) => {
    console.log('View exam:', exam);
  };

  const handleDeleteExam = (exam) => {
    if (window.confirm(`Are you sure you want to delete ${exam.title}?`)) {
      console.log('Delete exam:', exam);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Upcoming': return 'bg-blue-100 text-blue-800';
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exams Management</h2>
          <p className="text-gray-600">Schedule and manage assessments and examinations</p>
        </div>
        <button
          onClick={handleAddExam}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Exam</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search exams by title or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExams.map((exam) => (
          <div key={exam.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-emerald-600" />
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(exam.status)}`}>
                  {exam.status}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewExam(exam)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditExam(exam)}
                  className="text-emerald-600 hover:text-emerald-800 p-1"
                  title="Edit Exam"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteExam(exam)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Delete Exam"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{exam.course}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{exam.date} at {exam.time}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>{exam.duration} minutes</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                <span>{exam.students} students</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <div className="text-sm">
                <span className="text-gray-500">Grade:</span>
                <span className="font-medium text-gray-900 ml-1">{exam.grade}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Total:</span>
                <span className="font-medium text-gray-900 ml-1">{exam.totalMarks} marks</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredExams.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-500">No exams found matching your search criteria.</div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{exams.length}</div>
          <div className="text-sm text-gray-600">Total Exams</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">{exams.filter(e => e.status === 'Upcoming' || e.status === 'Scheduled').length}</div>
          <div className="text-sm text-gray-600">Upcoming Exams</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-600">{exams.filter(e => e.status === 'Completed').length}</div>
          <div className="text-sm text-gray-600">Completed Exams</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{exams.reduce((sum, e) => sum + e.students, 0)}</div>
          <div className="text-sm text-gray-600">Total Exam Attempts</div>
        </div>
      </div>

      {/* Exam Modal */}
      {showModal && (
        <ExamModal
          exam={selectedExam}
          onClose={() => setShowModal(false)}
          onSave={(examData) => {
            console.log('Save exam:', examData);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Exams;