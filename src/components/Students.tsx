import React, { useState } from 'react';
import { Search, Plus, Edit, Eye, Trash2, Filter } from 'lucide-react';
import StudentModal from './StudentModal';

const Students = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');

  const students = [
    { id: 1, name: 'Ahmed Hassan Ali', grade: 'Grade 5', age: 12, guardianName: 'Hassan Ali', phone: '+966-501234567', email: 'hassan.ali@email.com', status: 'Active', admissionDate: '2023-09-01', subjects: 5 },
    { id: 2, name: 'Fatima Muhammad', grade: 'Grade 3', age: 10, guardianName: 'Muhammad Ahmad', phone: '+966-502345678', email: 'muhammad.ahmad@email.com', status: 'Active', admissionDate: '2023-09-01', subjects: 4 },
    { id: 3, name: 'Omar Abdullah', grade: 'Grade 7', age: 14, guardianName: 'Abdullah Omar', phone: '+966-503456789', email: 'abdullah.omar@email.com', status: 'Active', admissionDate: '2022-09-01', subjects: 6 },
    { id: 4, name: 'Aisha Ibrahim', grade: 'Grade 4', age: 11, guardianName: 'Ibrahim Yusuf', phone: '+966-504567890', email: 'ibrahim.yusuf@email.com', status: 'Active', admissionDate: '2023-09-01', subjects: 5 },
    { id: 5, name: 'Khalid Rahman', grade: 'Grade 6', age: 13, guardianName: 'Rahman Khalid', phone: '+966-505678901', email: 'rahman.khalid@email.com', status: 'Inactive', admissionDate: '2022-09-01', subjects: 5 },
  ];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.guardianName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === '' || student.grade === filterGrade;
    return matchesSearch && matchesGrade;
  });

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setShowModal(true);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleViewStudent = (student) => {
    // Implement view student details
    console.log('View student:', student);
  };

  const handleDeleteStudent = (student) => {
    if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
      // Implement delete student
      console.log('Delete student:', student);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Students Management</h2>
          <p className="text-gray-600">Manage student records and academic information</p>
        </div>
        <button
          onClick={handleAddStudent}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Student</span>
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
                placeholder="Search students by name or guardian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">All Grades</option>
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5</option>
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade & Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guardian Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">ID: {student.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.grade}</div>
                    <div className="text-sm text-gray-500">{student.age} years old</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.guardianName}</div>
                    <div className="text-sm text-gray-500">{student.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      student.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.subjects} subjects
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewStudent(student)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="text-emerald-600 hover:text-emerald-800 p-1"
                        title="Edit Student"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete Student"
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
        
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No students found matching your search criteria.</div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{students.length}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-600">{students.filter(s => s.status === 'Active').length}</div>
          <div className="text-sm text-gray-600">Active Students</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-purple-600">8</div>
          <div className="text-sm text-gray-600">Total Grades</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-orange-600">94%</div>
          <div className="text-sm text-gray-600">Attendance Rate</div>
        </div>
      </div>

      {/* Student Modal */}
      {showModal && (
        <StudentModal
          student={selectedStudent}
          onClose={() => setShowModal(false)}
          onSave={(studentData) => {
            console.log('Save student:', studentData);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Students;