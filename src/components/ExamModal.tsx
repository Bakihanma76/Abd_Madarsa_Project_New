import React, { useState } from 'react';
import { X, FileText, Calendar, Clock, Users, Award } from 'lucide-react';

interface ExamModalProps {
  exam?: any;
  onClose: () => void;
  onSave: (examData: any) => void;
}

const ExamModal: React.FC<ExamModalProps> = ({ exam, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: exam?.title || '',
    course: exam?.course || '',
    grade: exam?.grade || '',
    teacher: exam?.teacher || '',
    date: exam?.date || '',
    time: exam?.time || '',
    duration: exam?.duration || '',
    totalMarks: exam?.totalMarks || '',
    passingMarks: exam?.passingMarks || '',
    examType: exam?.examType || 'Written',
    instructions: exam?.instructions || '',
    syllabus: exam?.syllabus || '',
    venue: exam?.venue || '',
    status: exam?.status || 'Scheduled',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const courses = [
    'Quran Memorization Level 1',
    'Arabic Grammar Fundamentals',
    'Islamic History & Civilization',
    'Hadith Studies Advanced',
    'Fiqh & Islamic Law'
  ];

  const teachers = [
    'Dr. Abdullah Rahman',
    'Ustadha Fatima Al-Zahra',
    'Sheikh Omar Ibn Khalid',
    'Ustadha Aisha Mahmoud',
    'Dr. Hassan Al-Qadri'
  ];

  const grades = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 
    'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8',
    'Grade 1-2', 'Grade 3-4', 'Grade 5-6', 'Grade 7-8'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {exam ? 'Edit Exam' : 'Schedule New Exam'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exam Details */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-medium text-gray-900">Exam Details</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select Grade</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
                  <select
                    name="teacher"
                    value={formData.teacher}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher} value={teacher}>{teacher}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
                  <select
                    name="examType"
                    value={formData.examType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="Written">Written</option>
                    <option value="Oral">Oral</option>
                    <option value="Practical">Practical</option>
                    <option value="Combined">Combined</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="e.g., Classroom A, Main Hall"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Schedule & Scoring */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-medium text-gray-900">Schedule & Scoring</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  min="15"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks</label>
                  <input
                    type="number"
                    name="totalMarks"
                    value={formData.totalMarks}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passing Marks</label>
                  <input
                    type="number"
                    name="passingMarks"
                    value={formData.passingMarks}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Syllabus Coverage</label>
                <textarea
                  name="syllabus"
                  value={formData.syllabus}
                  onChange={handleChange}
                  rows={4}
                  placeholder="List the topics and chapters covered in this exam..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-medium text-gray-900">Exam Instructions</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructions for Students</label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter detailed instructions for students taking this exam..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {exam ? 'Update Exam' : 'Schedule Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamModal;