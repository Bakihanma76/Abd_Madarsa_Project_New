export type Role = 'admin' | 'principal' | 'teacher' | 'student' | 'parent';

export type AppUser = {
  email: string;
  name: string;
  role: Role;
  label: string;
  institutionId?: number;
  institutionName?: string;
  linkedStudentName?: string;
  linkedTeacherName?: string;
};

export const canManage = (role: Role, resource: 'students' | 'teachers' | 'courses' | 'exams') => {
  if (role === 'admin') return true;
  if (role === 'principal') return true;
  if (role === 'teacher') return resource === 'exams';
  return false;
};

export const canDelete = (role: Role) => role === 'admin';

export const isVisibleForUser = (user: AppUser, record: any, resource: 'students' | 'courses' | 'exams') => {
  if (user.institutionId && record.institutionId && Number(record.institutionId) !== Number(user.institutionId)) return false;

  if (user.role === 'admin' || user.role === 'principal') return true;

  if (resource === 'students') {
    if (user.role === 'teacher') return ['Grade 3', 'Grade 4'].includes(record.grade);
    if (user.role === 'student') return record.name === (user.linkedStudentName || user.name);
    if (user.role === 'parent') return record.name === user.linkedStudentName || record.guardianName === user.name;
  }

  if (resource === 'courses') {
    if (user.role === 'teacher') return record.teacher === user.name;
    if (user.role === 'student' || user.role === 'parent') {
      return record.grade.includes('Grade 5') || record.grade.includes('Grade 6');
    }
  }

  if (resource === 'exams') {
    if (user.role === 'teacher') return record.teacher === user.name;
    if (user.role === 'student' || user.role === 'parent') {
      return record.grade.includes('Grade 5') || record.grade.includes('Grade 6');
    }
  }

  return false;
};

export const scopeLabel = (role: Role) => {
  switch (role) {
    case 'admin':
      return 'Full institution access';
    case 'principal':
      return 'Institution academic access';
    case 'teacher':
      return 'Assigned class access only';
    case 'student':
      return 'Own academic record only';
    case 'parent':
      return 'Linked child record only';
    default:
      return 'Restricted access';
  }
};
