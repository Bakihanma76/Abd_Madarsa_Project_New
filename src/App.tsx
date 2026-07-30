import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Users, GraduationCap, FileText, BarChart3, Home, LogOut, ShieldCheck, Building2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Teachers from './components/Teachers';
import Courses from './components/Courses';
import Exams from './components/Exams';
import Reports from './components/Reports';
import { apiRequest } from './api';
import type { AppUser, Role } from './access';

type LoginUser = AppUser & {
  password: string;
};

type Institution = {
  id: number;
  name: string;
  type: 'university' | 'school' | 'madarsa';
  city?: string;
  status: string;
};

const users: LoginUser[] = [
  { email: 'abdullahboss1900@gmail.com', password: 'Admin@1900', name: 'Abdullah Boss', role: 'admin', label: 'Admin', institutionId: 1 },
  { email: 'principal@madarsa.edu', password: 'Principal@123', name: 'Dr. Sameer Khan', role: 'principal', label: 'Principal', institutionId: 1 },
  { email: 'teacher@madarsa.edu', password: 'Teacher@123', name: 'Ustadha Fatima Al-Zahra', role: 'teacher', label: 'Teacher', institutionId: 1, linkedTeacherName: 'Ustadha Fatima Al-Zahra' },
  { email: 'student@madarsa.edu', password: 'Student@123', name: 'Ahmed Hassan Ali', role: 'student', label: 'Student', institutionId: 1, linkedStudentName: 'Ahmed Hassan Ali' },
  { email: 'parent@madarsa.edu', password: 'Parent@123', name: 'Hassan Ali', role: 'parent', label: 'Parent', institutionId: 1, linkedStudentName: 'Ahmed Hassan Ali' },
];

const permissions: Record<Role, string[]> = {
  admin: ['dashboard', 'students', 'teachers', 'courses', 'exams', 'reports'],
  principal: ['dashboard', 'students', 'teachers', 'courses', 'exams', 'reports'],
  teacher: ['dashboard', 'students', 'courses', 'exams', 'reports'],
  student: ['dashboard', 'courses', 'exams', 'reports'],
  parent: ['dashboard', 'students', 'exams', 'reports'],
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loginEmail, setLoginEmail] = useState('abdullahboss1900@gmail.com');
  const [loginPassword, setLoginPassword] = useState('Admin@1900');
  const [loginError, setLoginError] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState(1);
  const isAdminEmail = loginEmail.trim().toLowerCase() === 'abdullahboss1900@gmail.com';
  const selectedInstitution = useMemo(
    () => institutions.find((institution) => institution.id === selectedInstitutionId),
    [institutions, selectedInstitutionId],
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'teachers', label: 'Teachers', icon: GraduationCap },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const visibleTabs = currentUser ? tabs.filter((tab) => permissions[currentUser.role].includes(tab.id)) : [];

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const data = await apiRequest<Institution[]>('/institutions');
        const activeInstitutions = data.filter((institution) => institution.status === 'Active');
        setInstitutions(activeInstitutions);
        if (activeInstitutions.length > 0 && !activeInstitutions.some((institution) => institution.id === selectedInstitutionId)) {
          setSelectedInstitutionId(activeInstitutions[0].id);
        }
      } catch {
        setInstitutions([]);
      }
    };

    loadInstitutions();
  }, [selectedInstitutionId]);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    const matchedUser = users.find((user) => user.email === loginEmail.trim() && user.password === loginPassword);
    if (!matchedUser) {
      setLoginError('Invalid email or password');
      return;
    }

    const { password, ...safeUser } = matchedUser;
    void password;
    setCurrentUser({
      ...safeUser,
      institutionId: matchedUser.role === 'admin' ? selectedInstitutionId : matchedUser.institutionId,
      institutionName: matchedUser.role === 'admin' ? selectedInstitution?.name : safeUser.institutionName,
    });
    setActiveTab('dashboard');
    setLoginError('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={currentUser} />;
      case 'students':
        return <Students user={currentUser} />;
      case 'teachers':
        return <Teachers user={currentUser} />;
      case 'courses':
        return <Courses user={currentUser} />;
      case 'exams':
        return <Exams user={currentUser} />;
      case 'reports':
        return <Reports user={currentUser} />;
      default:
        return <Dashboard user={currentUser} />;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-8 bg-emerald-700 text-white">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-6">
              <BookOpen className="w-7 h-7 text-emerald-700" />
            </div>
            <h1 className="text-3xl font-bold">Madarsa Management</h1>
            <p className="text-emerald-50 mt-3">Role-based mock login for checking dashboards and permissions.</p>

            <div className="mt-8 space-y-3">
              {users.map((user) => (
                <button
                  key={user.email}
                  onClick={() => {
                    setLoginEmail(user.email);
                    setLoginPassword(user.password);
                    if (user.role === 'admin') setSelectedInstitutionId(institutions[0]?.id || 1);
                    setLoginError('');
                  }}
                  className="w-full text-left p-3 rounded-lg bg-emerald-800 hover:bg-emerald-900 transition-colors"
                >
                  <p className="text-sm font-semibold">{user.label}: {user.email}</p>
                  <p className="text-xs text-emerald-100">Password: {user.password}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900">Login</h2>
            <p className="text-sm text-gray-600 mt-2">Use one of the seeded sample accounts.</p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              {isAdminEmail && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <label className="flex items-center space-x-2 text-sm font-medium text-emerald-900 mb-2">
                    <Building2 className="w-4 h-4" />
                    <span>Select University / School / Madarsa</span>
                  </label>
                  <select
                    value={selectedInstitutionId}
                    onChange={(event) => setSelectedInstitutionId(Number(event.target.value))}
                    className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                  >
                    {institutions.map((institution) => (
                      <option key={institution.id} value={institution.id}>
                        {institution.name} - {institution.type} - {institution.city || 'No city'}
                      </option>
                    ))}
                  </select>
                  {institutions.length === 0 && (
                    <p className="text-xs text-red-700 mt-2">No active institutions found. Run database setup first.</p>
                  )}
                </div>
              )}
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg">{loginError}</div>
              )}
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <p className="text-sm text-gray-600">Welcome, {currentUser.name}</p>
              <p className="text-xs font-medium text-emerald-700">{currentUser.label} - {currentUser.email}</p>
              {currentUser.institutionName && <p className="text-xs text-gray-500">{currentUser.institutionName}</p>}
              <p className="text-xs text-gray-500">Academic Year 2024-2025</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Active Login</p>
                <p className="text-xs text-gray-500">Signed in as {currentUser.label}. Permissions are scoped by this role.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="px-3 py-2 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                {currentUser.email}
              </span>
              {currentUser.institutionName && (
                <span className="px-3 py-2 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {currentUser.institutionName}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 flex items-center space-x-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <nav className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm">
            {visibleTabs.map((tab) => {
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

        <div className="transition-all duration-300">{renderContent()}</div>
      </div>
    </div>
  );
}

export default App;
