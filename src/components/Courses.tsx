import React, { useState } from 'react';
import { Search, Plus, Edit, Eye, Trash2, Filter, BookOpen, Clock, Users } from 'lucide-react';
import CourseModal from './CourseModal';
import { useApiResource } from '../hooks/useApiResource';
import { AppUser, canDelete, canManage, isVisibleForUser, scopeLabel } from '../access';

type CoursesProps = {
  user: AppUser;
};

const Courses: React.FC<CoursesProps> = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const { items: courses, loading, error, save, remove } = useApiResource<any>('courses');
  const canWrite = canManage(user.role, 'courses');
  const canRemove = canDelete(user.role);
  const visibleCourses = courses.filter((course) => isVisibleForUser(user, course, 'courses'));

  const filteredCourses = visibleCourses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === '' || course.grade.includes(filterGrade);
    return matchesSearch && matchesGrade;
  });

  const handleAddCourse = () => {
    if (!canWrite) return;
    setSelectedCourse(null);
    setShowModal(true);
  };

  const handleEditCourse = (course: any) => {
    if (!canWrite) return;
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleViewCourse = (course: any) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleDeleteCourse = async (course: any) => {
    if (!canRemove) return;
    if (window.confirm(`Are you sure you want to delete ${course.name}?`)) {
      await remove(course.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Courses Management</h2>
          <p className="text-gray-600">{scopeLabel(user.role)}</p>
        </div>
        {canWrite && (
          <button
            onClick={handleAddCourse}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses by name or teacher..."
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

      {loading && <div className="bg-white rounded-lg p-4 text-gray-600 shadow-sm">Loading courses...</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-6 h-6 text-emerald-600" />
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  course.status === 'Active' 
                    ? 'bg-green-100 text-green-800'
                    : course.status === 'Pending'
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {course.status}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewCourse(course)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {canWrite && (
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="text-emerald-600 hover:text-emerald-800 p-1"
                    title="Edit Course"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {canRemove && (
                  <button
                    onClick={() => handleDeleteCourse(course)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.name}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium w-16">Grade:</span>
                <span>{course.grade}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium w-16">Teacher:</span>
                <span className="truncate">{course.teacher}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                <span>{course.students} students enrolled</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>{course.duration}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Schedule:</span>
                <div className="text-xs mt-1">{course.schedule}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-500">No courses found matching your search criteria.</div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{visibleCourses.length}</div>
          <div className="text-sm text-gray-600">Visible Courses</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-600">{visibleCourses.filter(c => c.status === 'Active').length}</div>
          <div className="text-sm text-gray-600">Active Courses</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{visibleCourses.reduce((sum, c) => sum + c.students, 0)}</div>
          <div className="text-sm text-gray-600">Total Enrollments</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-orange-600">{Math.round(visibleCourses.reduce((sum, c) => sum + c.students, 0) / Math.max(visibleCourses.filter(c => c.status === 'Active').length, 1))}</div>
          <div className="text-sm text-gray-600">Avg Class Size</div>
        </div>
      </div>

      {/* Course Modal */}
      {showModal && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setShowModal(false)}
          onSave={async (courseData) => {
            if (!canWrite) {
              setShowModal(false);
              return;
            }
            await save(selectedCourse?.id, { ...courseData, institutionId: user.institutionId || 1 });
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Courses;
