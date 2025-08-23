import React, { useState } from 'react';
import { Search, Plus, Edit, Eye, Trash2, Filter, Award } from 'lucide-react';
import TeacherModal from './TeacherModal';

const Teachers = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  const teachers = [
    { id: 1, name: 'Dr. Abdullah Rahman', subject: 'Quran & Tajweed', qualification: 'PhD in Islamic Studies', experience: 15, phone: '+966-511234567', email: 'abdullah.rahman@madarsa.edu', status: 'Active', salary: '8000', classes: 4 },
    { id: 2, name: 'Ustadha Fatima Al-Zahra', subject: 'Arabic Literature', qualification: 'Masters in Arabic', experience: 8, phone: '+966-512345678', email: 'fatima.alzahra@madarsa.edu', status: 'Active', salary: '6500', classes: 3 },
    { id: 3, name: 'Sheikh Omar Ibn Khalid', subject: 'Islamic History', qualification: 'Masters in History', experience: 12, phone: '+966-513456789', email: 'omar.khalid@madarsa.edu', status: 'Active', salary: '7500', classes: 5 },
    { id: 4, name: 'Ustadha Aisha Mahmoud', subject: 'Hadith Studies', qualification: 'PhD in Hadith Sciences', experience: 10, phone: '+966-514567890', email: 'aisha.mahmoud@madarsa.edu', status: 'Active', salary: '7800', classes: 3 },
    { id: 5, name: 'Dr. Hassan Al-Qadri', subject: 'Fiqh & Jurisprudence', qualification: 'PhD in Islamic Law', experience: 20, phone: '+966-515678901', email: 'hassan.qadri@madarsa.edu', status: 'Leave', salary: '9000', classes: 4 },
  ];

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === '' || teacher.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const handleAddTeacher = () => {
    setSelectedTeacher(null);
    setShowModal(true);
  };

  const handleEditTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setShowModal(true);
  };

  const handleViewTeacher = (teacher) => {
    console.log('View teacher:', teacher);
  };

  const handleDeleteTeacher = (teacher) => {
    if (window.confirm(`Are you sure you want to remove ${teacher.name}?`)) {
      console.log('Delete teacher:', teacher);
    }
  };

  const subjects = [...new Set(teachers.map(t => t.subject))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teachers Management</h2>
          <p className="text-gray-600">Manage teaching staff and their assignments</p>
        </div>
        <button
          onClick={handleAddTeacher}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Teacher</span>
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
                placeholder="Search teachers by name or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject & Qualification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                      <div className="text-sm text-gray-500">ID: {teacher.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-medium">{teacher.subject}</div>
                    <div className="text-sm text-gray-500">{teacher.qualification}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Award className="w-4 h-4 text-yellow-500 mr-2" />
                      <span className="text-sm text-gray-900">{teacher.experience} years</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{teacher.phone}</div>
                    <div className="text-sm text-gray-500">{teacher.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      teacher.status === 'Active' 
                        ? 'bg-green-100 text-green-800'
                        : teacher.status === 'Leave'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {teacher.classes} classes
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewTeacher(teacher)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditTeacher(teacher)}
                        className="text-emerald-600 hover:text-emerald-800 p-1"
                        title="Edit Teacher"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove Teacher"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTeachers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No teachers found matching your search criteria.</div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{teachers.length}</div>
          <div className="text-sm text-gray-600">Total Teachers</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-600">{teachers.filter(t => t.status === 'Active').length}</div>
          <div className="text-sm text-gray-600">Active Teachers</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{subjects.length}</div>
          <div className="text-sm text-gray-600">Subjects Offered</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-orange-600">{Math.round(teachers.reduce((sum, t) => sum + t.experience, 0) / teachers.length)}</div>
          <div className="text-sm text-gray-600">Avg Experience</div>
        </div>
      </div>

      {/* Teacher Modal */}
      {showModal && (
        <TeacherModal
          teacher={selectedTeacher}
          onClose={() => setShowModal(false)}
          onSave={(teacherData) => {
            console.log('Save teacher:', teacherData);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Teachers;