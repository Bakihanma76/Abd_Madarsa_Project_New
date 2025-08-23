import React, { useState } from 'react';
import { BookOpen, Users, GraduationCap, FileText, BarChart3, Home } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Teachers from './components/Teachers';
import Courses from './components/Courses';
import Exams from './components/Exams';
import Reports from './components/Reports';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'teachers', label: 'Teachers', icon: GraduationCap },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <Students />;
      case 'teachers':
        return <Teachers />;
      case 'courses':
        return <Courses />;
      case 'exams':
        return <Exams />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Madarsa Management</h1>
                <p className="text-sm text-gray-600">Academic Excellence System</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome, Administrator</p>
              <p className="text-xs text-gray-500">Academic Year 2024-2025</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-md transform scale-105'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:block">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="transition-all duration-300">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;