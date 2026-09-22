import React, { useState } from 'react';
import { BookOpen, Clock, Edit, Eye, Filter, Plus, Search, Trash2, Users } from 'lucide-react';
import CourseModal from './CourseModal';
import CourseWorkflow from './CourseWorkflow';
import { useApiResource } from '../hooks/useApiResource';
import { AppUser, canDelete, canManage, isVisibleForUser, scopeLabel } from '../access';

type CoursesProps = { user: AppUser };

const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];

const Courses: React.FC<CoursesProps> = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [flowError, setFlowError] = useState('');
  const { items: courses, loading, error, save, remove } = useApiResource<any>('courses');
  const canWrite = canManage(user.role, 'courses');
  const canRemove = canDelete(user.role);
  const canUseCourseFlow = ['teacher', 'principal', 'admin'].includes(user.role);

  const visibleCourses = courses.filter((course) => isVisibleForUser(user, course, 'courses'));
  const filteredCourses = visibleCourses.filter((course) => {
    const term = searchTerm.toLowerCase();
    return (course.name.toLowerCase().includes(term) || course.teacher.toLowerCase().includes(term)) &&
      (!filterGrade || course.grade.includes(filterGrade));
  });

  const openModal = (course: any = null) => {
    if (course && !canWrite) return;
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleDelete = async (course: any) => {
    if (canRemove && window.confirm(`Are you sure you want to delete ${course.name}?`)) await remove(course.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Courses Management</h2>
          <p className="text-gray-600">{scopeLabel(user.role)}</p>
        </div>
        {canWrite && (
          <button onClick={() => openModal()} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        )}
      </div>

      <CourseFilters searchTerm={searchTerm} filterGrade={filterGrade} onSearch={setSearchTerm} onGrade={setFilterGrade} />

      {loading && <div className="bg-white rounded-lg p-4 text-gray-600 shadow-sm">Loading courses...</div>}
      {error && <Alert message={error} />}
      {flowError && <Alert message={flowError} />}

      {canUseCourseFlow && <CourseWorkflow user={user} onError={setFlowError} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            canWrite={canWrite}
            canRemove={canRemove}
            onView={() => {
              setSelectedCourse(course);
              setShowModal(true);
            }}
            onEdit={() => openModal(course)}
            onDelete={() => handleDelete(course)}
          />
        ))}
      </div>

      {!filteredCourses.length && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-500">No courses found matching your search criteria.</div>
        </div>
      )}

      <CourseStats courses={visibleCourses} />

      {showModal && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setShowModal(false)}
          onSave={async (courseData) => {
            if (canWrite) await save(selectedCourse?.id, { ...courseData, institutionId: user.institutionId || 1 });
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

type FilterProps = { searchTerm: string; filterGrade: string; onSearch: (value: string) => void; onGrade: (value: string) => void };
const CourseFilters: React.FC<FilterProps> = ({ searchTerm, filterGrade, onSearch, onGrade }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={searchTerm} onChange={(event) => onSearch(event.target.value)} placeholder="Search courses by name or teacher..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
      </div>
      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-gray-400" />
        <select value={filterGrade} onChange={(event) => onGrade(event.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
          <option value="">All Grades</option>
          {grades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
        </select>
      </div>
    </div>
  </div>
);

type CourseCardProps = {
  course: any;
  canWrite: boolean;
  canRemove: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const CourseCard: React.FC<CourseCardProps> = ({ course, canWrite, canRemove, onView, onEdit, onDelete }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-emerald-600" />
        <CourseStatus status={course.status} />
      </div>
      <div className="flex items-center gap-2">
        <IconButton title="View Details" onClick={onView} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4" /></IconButton>
        {canWrite && <IconButton title="Edit Course" onClick={onEdit} className="text-emerald-600 hover:text-emerald-800"><Edit className="w-4 h-4" /></IconButton>}
        {canRemove && <IconButton title="Delete Course" onClick={onDelete} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></IconButton>}
      </div>
    </div>

    <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.name}</h3>
    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
    <div className="space-y-2 mb-4">
      <Meta label="Grade" value={course.grade} />
      <Meta label="Teacher" value={course.teacher} />
      <div className="flex items-center text-sm text-gray-600"><Users className="w-4 h-4 mr-2" /><span>{course.students} students enrolled</span></div>
      <div className="flex items-center text-sm text-gray-600"><Clock className="w-4 h-4 mr-2" /><span>{course.duration}</span></div>
    </div>
    <div className="pt-4 border-t border-gray-100 text-sm text-gray-600">
      <span className="font-medium">Schedule:</span>
      <div className="text-xs mt-1">{course.schedule}</div>
    </div>
  </div>
);

const CourseStatus: React.FC<{ status: string }> = ({ status }) => {
  const style = status === 'Active' ? 'bg-green-100 text-green-800' : status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  return <span className={'px-2 py-1 text-xs font-medium rounded-full ' + style}>{status}</span>;
};

type IconButtonProps = { title: string; onClick: () => void; className: string; children: React.ReactNode };
const IconButton: React.FC<IconButtonProps> = ({ title, onClick, className, children }) => (
  <button onClick={onClick} className={'p-1 ' + className} title={title}>{children}</button>
);

const Meta: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center text-sm text-gray-600">
    <span className="font-medium w-16">{label}:</span>
    <span className="truncate">{value}</span>
  </div>
);

const CourseStats: React.FC<{ courses: any[] }> = ({ courses }) => {
  const active = courses.filter((course) => course.status === 'Active');
  const totalEnrollments = courses.reduce((sum, course) => sum + Number(course.students || 0), 0);
  const stats = [
    ['Visible Courses', courses.length, 'text-blue-600'],
    ['Active Courses', active.length, 'text-green-600'],
    ['Total Enrollments', totalEnrollments, 'text-purple-600'],
    ['Avg Class Size', Math.round(totalEnrollments / Math.max(active.length, 1)), 'text-orange-600'],
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map(([label, value, color]) => (
        <div key={label} className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className={'text-2xl font-bold ' + color}>{value}</div>
          <div className="text-sm text-gray-600">{label}</div>
        </div>
      ))}
    </div>
  );
};

const Alert: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{message}</div>
);

export default Courses;
