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

type InstructionPage = {
  title: string;
  language: string;
  direction?: 'ltr' | 'rtl';
  items: string[];
  declaration: string;
};

const instructionPages: InstructionPage[] = [
  {
    title: 'Hidayaat Baraye Sarparast',
    language: 'Roman Urdu',
    items: [
      'Madrase me admission ke waqt student ki age kam se kam 7 years ho.',
      'Student ke Madrasa aane aur wapas jaane ki zimmedari walidain/sarparast par hogi.',
      'Exams me shirkat ke liye student ki 80% attendance zaroori hogi, warna student exams me shirkat ka haqdar nahi hoga.',
      'Student ka madrase me qeemti cheezein lekar aana allowed nahi hai. E.g., mobile phone, expensive watch, money, etc.',
      'Madrase ke har student ke liye kurta/jubba pajama aur topi zaroori hai. Iske alawa doosra libaas madrase me rakhna allowed hoga. Student ka hairstyle shariyat ke mutaabiq hona zaroori hai.',
      'Bad akhlaqi ya ladai jhagde ki soorat me student ko samjhaya jayega. Na maanne ki soorat me madrase se nikaala bhi ja sakta hai.',
      'Sarparast har mahine kam se kam ek baar apne bacche ke ustaz se mil kar taleemi report zaroor maloom kar lein.',
      'Student ki fees har mahina advance adaa karna hoga aur har mahine ki 10 tareekh se pehle adaa karna zaroori hoga.',
      'Madrase ke management ki janib se jis waqt bhi jo hidayat di jaye, uski pabandi zaroori hogi.',
    ],
    declaration: 'Main jo details upar likha hun wo mere ilm ke mutaabiq correct hain, aur main ne hidayaat ko achchi tarah padh liya hai. Un par main khud bhi poori tarah amal karunga aur student se bhi amal karaunga.',
  },
  {
    title: 'సంరక్షకుల కోసం సూచనలు',
    language: 'Telugu',
    items: [
      'మదర్సాలో అడ్మిషన్ సమయంలో విద్యార్థి వయస్సు కనీసం 7 సంవత్సరాలు ఉండాలి.',
      'విద్యార్థి మదర్సాకు రావడం మరియు తిరిగి వెళ్లడం యొక్క బాధ్యత తల్లిదండ్రులు/సంరక్షకులపై ఉంటుంది.',
      'పరీక్షల్లో పాల్గొనడానికి విద్యార్థికి 80% హాజరు తప్పనిసరి. లేకపోతే విద్యార్థి పరీక్షకు అర్హుడు కాదు.',
      'విద్యార్థి మదర్సాకు విలువైన వస్తువులు తీసుకురావడానికి అనుమతి లేదు. ఉదా: మొబైల్ ఫోన్, ఖరీదైన వాచ్, డబ్బు మొదలైనవి.',
      'ప్రతి విద్యార్థికి కుర్తా/జుబ్బా, పజామా మరియు టోపీ దుస్తులుగా తప్పనిసరి. అదనంగా మదర్సాలో రెండవ దుస్తుల జత ఉంచడానికి అనుమతి ఉంటుంది. విద్యార్థి జుట్టు కూడా శరియత్ ప్రకారం ఉండాలి.',
      'చెడు ప్రవర్తన లేదా గొడవల సందర్భంలో విద్యార్థికి ముందుగా అర్థం చెప్పబడుతుంది. వినకపోతే మదర్సా నుండి తొలగించబడవచ్చు.',
      'సంరక్షకులు ప్రతి నెల కనీసం ఒకసారి తమ పిల్లల ఉపాధ్యాయుడిని కలసి పిల్లల విద్యా నివేదిక తెలుసుకోవాలి.',
      'విద్యార్థి ఫీజు ప్రతి నెల ముందుగానే చెల్లించాలి మరియు ప్రతి నెల 10వ తేదీకి ముందు చెల్లించడం తప్పనిసరి.',
      'మదర్సా మేనేజ్‌మెంట్ తరఫున ఎప్పుడైనా ఇచ్చే సూచనలను తప్పనిసరిగా పాటించాలి.',
    ],
    declaration: 'పై వివరాలు నా జ్ఞానం ప్రకారం సరైనవి. నేను సూచనలను బాగా చదివాను. వాటిని నేను పూర్తిగా పాటిస్తాను మరియు విద్యార్థితో కూడా పాటింపజేస్తాను.',
  },
  {
    title: 'ہدایات برائے سرپرست',
    language: 'Urdu',
    direction: 'rtl',
    items: [
      'مدرسے میں داخلے کے وقت طالب علم کی عمر کم از کم 7 سال ہونی چاہیے۔',
      'طالب علم کے مدرسہ آنے اور واپس جانے کی ذمہ داری والدین/سرپرست پر ہوگی۔',
      'امتحان میں شرکت کے لیے طالب علم کی 80% حاضری ضروری ہوگی، ورنہ طالب علم امتحان میں شرکت کا حق دار نہیں ہوگا۔',
      'طالب علم کو مدرسے میں قیمتی چیزیں لانے کی اجازت نہیں ہے، مثلاً موبائل فون، مہنگی گھڑی، رقم وغیرہ۔',
      'مدرسے کے ہر طالب علم کے لیے لباس یعنی کرتا/جبہ، پاجامہ اور ٹوپی ضروری ہے۔ اس کے علاوہ مدرسے میں دوسرا لباس رکھنے کی اجازت ہوگی۔ طالب علم کے بال بھی شریعت کے مطابق ہونے ضروری ہیں۔',
      'بد اخلاقی یا لڑائی جھگڑے کی صورت میں طالب علم کو سمجھایا جائے گا۔ نہ ماننے کی صورت میں مدرسے سے نکالا بھی جا سکتا ہے۔',
      'سرپرست حضرات ہر ماہ کم از کم ایک بار اپنے بچے کے استاد سے مل کر بچے کی تعلیمی رپورٹ ضرور معلوم کریں۔',
      'طالب علم کی فیس ہر ماہ پیشگی ادا کرنی ہوگی اور ہر ماہ کی 10 تاریخ سے پہلے ادا کرنا ضروری ہوگا۔',
      'مدرسے کی انتظامیہ کی جانب سے جب بھی جو ہدایت دی جائے، اس کی پابندی ضروری ہوگی۔',
    ],
    declaration: 'میں نے اوپر لکھی ہوئی تفصیلات اپنے علم کے مطابق درست لکھی ہیں، اور میں نے ہدایات اچھی طرح پڑھ لی ہیں۔ میں خود بھی ان پر پوری طرح عمل کروں گا اور طالب علم سے بھی عمل کرواؤں گا۔',
  },
  {
    title: 'अभिभावकों के लिए निर्देश',
    language: 'Hindi',
    items: [
      'मदरसे में प्रवेश के समय विद्यार्थी की आयु कम से कम 7 वर्ष होनी चाहिए।',
      'विद्यार्थी के मदरसा आने और वापस जाने की जिम्मेदारी माता-पिता/अभिभावक की होगी।',
      'परीक्षा में शामिल होने के लिए विद्यार्थी की 80% उपस्थिति आवश्यक होगी, अन्यथा विद्यार्थी परीक्षा में शामिल होने का हकदार नहीं होगा।',
      'विद्यार्थी को मदरसे में कीमती चीजें लाने की अनुमति नहीं है, जैसे मोबाइल फोन, महंगी घड़ी, पैसे आदि।',
      'मदरसे के हर विद्यार्थी के लिए कुर्ता/जुब्बा, पायजामा और टोपी पहनना जरूरी है। इसके अलावा मदरसे में दूसरा कपड़ा रखने की अनुमति होगी। विद्यार्थी के बाल भी शरीयत के अनुसार होने जरूरी हैं।',
      'बदअखलाकी या लड़ाई-झगड़े की स्थिति में विद्यार्थी को समझाया जाएगा। न मानने की स्थिति में मदरसे से निकाला भी जा सकता है।',
      'अभिभावक हर महीने कम से कम एक बार अपने बच्चे के शिक्षक से मिलकर बच्चे की शैक्षणिक रिपोर्ट जरूर जान लें।',
      'विद्यार्थी की फीस हर महीने अग्रिम जमा करनी होगी और हर महीने की 10 तारीख से पहले जमा करना जरूरी होगा।',
      'मदरसे के प्रबंधन की ओर से जब भी जो निर्देश दिया जाए, उसका पालन करना जरूरी होगा।',
    ],
    declaration: 'मैंने ऊपर लिखी हुई जानकारी अपने ज्ञान के अनुसार सही लिखी है, और मैंने निर्देशों को अच्छी तरह पढ़ लिया है। मैं स्वयं भी उनका पूरी तरह पालन करूंगा और विद्यार्थी से भी पालन करवाऊंगा।',
  },
];

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
  const [instructionPage, setInstructionPage] = useState(0);
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
            <InstructionsPager
              page={instructionPage}
              pages={instructionPages}
              onChange={setInstructionPage}
            />
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

type InstructionsPagerProps = {
  page: number;
  pages: InstructionPage[];
  onChange: (page: number) => void;
};

const InstructionsPager: React.FC<InstructionsPagerProps> = ({ page, pages, onChange }) => {
  const current = pages[page];
  const isRtl = current.direction === 'rtl';

  return (
    <div className="mt-6 rounded-lg bg-emerald-800 border border-emerald-600 overflow-hidden">
      <div className="p-3 border-b border-emerald-600">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Guardian Instructions</p>
            <p className="text-xs text-emerald-100">Page {page + 1} of {pages.length} - {current.language}</p>
          </div>
          <div className="flex gap-1">
            {pages.map((item, index) => (
              <button
                key={item.language}
                type="button"
                onClick={() => onChange(index)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  page === index ? 'bg-white text-emerald-800' : 'bg-emerald-700 text-emerald-50 hover:bg-emerald-600'
                }`}
              >
                {item.language}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        dir={current.direction || 'ltr'}
        className={`max-h-56 overflow-y-auto p-4 text-sm leading-6 text-emerald-50 ${isRtl ? 'text-right' : 'text-left'}`}
      >
        <h3 className="text-base font-bold text-white mb-3">{current.title}</h3>
        <ul className={`space-y-2 ${isRtl ? 'list-disc pr-5' : 'list-disc pl-5'}`}>
          {current.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="my-4 border-t border-emerald-500" />
        <p>{current.declaration}</p>
      </div>

      <div className="flex items-center justify-between gap-3 p-3 border-t border-emerald-600">
        <button
          type="button"
          onClick={() => onChange(Math.max(page - 1, 0))}
          disabled={page === 0}
          className="px-3 py-1.5 rounded bg-emerald-700 text-xs font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-600"
        >
          Previous
        </button>
        <div className="flex gap-1">
          {pages.map((item, index) => (
            <span
              key={item.title}
              className={`h-2 w-2 rounded-full ${index === page ? 'bg-white' : 'bg-emerald-500'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(page + 1, pages.length - 1))}
          disabled={page === pages.length - 1}
          className="px-3 py-1.5 rounded bg-emerald-700 text-xs font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-600"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default App;
