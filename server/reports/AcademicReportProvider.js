import { ReportProvider } from './ReportProvider.js';

const round = (value, digits = 1) => Number(Number(value || 0).toFixed(digits));

export class AcademicReportProvider extends ReportProvider {
  async build() {
    const conditions = ['institutionId = :institutionId'];
    const params = { institutionId: this.context.institutionId || 1 };
    if (this.context.studentName) {
      conditions.push('studentName = :studentName');
      params.studentName = this.context.studentName;
    }
    const where = `WHERE ${conditions.join(' AND ')}`;

    const subjectRows = await this.db.rows(`
      SELECT
        subject,
        COUNT(*) AS students,
        AVG((marksObtained / NULLIF(totalMarks, 0)) * 100) AS avgScore,
        AVG(CASE WHEN (marksObtained / NULLIF(totalMarks, 0)) * 100 >= 40 THEN 100 ELSE 0 END) AS passRate
      FROM exam_results
      ${where}
      GROUP BY subject
      ORDER BY subject
    `, params);

    const data = subjectRows.map((row) => ({
      subject: row.subject,
      students: Number(row.students),
      avgScore: round(row.avgScore),
      passRate: round(row.passRate),
    }));

    const studentsAssessed = data.reduce((sum, row) => sum + row.students, 0);
    const overallAverage = data.length ? round(data.reduce((sum, row) => sum + row.avgScore, 0) / data.length) : 0;
    const passRate = data.length ? round(data.reduce((sum, row) => sum + row.passRate, 0) / data.length) : 0;

    return {
      summary: { overallAverage, passRate, studentsAssessed, subjects: data.length },
      data,
    };
  }
}
