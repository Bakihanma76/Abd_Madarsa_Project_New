import { rows, scalar } from '../db.js';
import { AcademicReportProvider } from './AcademicReportProvider.js';
import { AttendanceReportProvider } from './AttendanceReportProvider.js';
import { EnrollmentReportProvider } from './EnrollmentReportProvider.js';
import { FinancialReportProvider } from './FinancialReportProvider.js';

const providers = {
  academic: AcademicReportProvider,
  attendance: AttendanceReportProvider,
  financial: FinancialReportProvider,
  enrollment: EnrollmentReportProvider,
};

export class ReportFactory {
  static create(type, context = {}) {
    const Provider = providers[type];
    if (!Provider) throw new Error(`Unknown report type: ${type}`);
    return new Provider({ rows, scalar }, context);
  }

  static supportedTypes() {
    return Object.keys(providers);
  }
}
