import { ReportProvider } from './ReportProvider.js';

export class EnrollmentReportProvider extends ReportProvider {
  async build() {
    const params = { institutionId: this.context.institutionId || 1 };
    const totalStudents = Number(await this.db.scalar('SELECT COUNT(*) FROM students WHERE institutionId = :institutionId', params));
    const activeStudents = Number(await this.db.scalar("SELECT COUNT(*) FROM students WHERE institutionId = :institutionId AND status = 'Active'", params));
    const inactiveStudents = Number(await this.db.scalar("SELECT COUNT(*) FROM students WHERE institutionId = :institutionId AND status <> 'Active'", params));
    const newEnrollments = Number(await this.db.scalar(`
      SELECT COUNT(*) FROM students
      WHERE institutionId = :institutionId
        AND admissionDate IS NOT NULL
        AND admissionDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `, params));
    const byGradeRows = await this.db.rows(`
      SELECT grade, COUNT(*) AS students
      FROM students
      WHERE institutionId = :institutionId
      GROUP BY grade
      ORDER BY grade
    `, params);

    return {
      summary: {
        totalStudents,
        activeStudents,
        inactiveStudents,
        newEnrollments,
        monthlyGrowth: totalStudents ? Number(((newEnrollments / totalStudents) * 100).toFixed(1)) : 0,
      },
      byGrade: byGradeRows.map((row) => ({
        grade: row.grade,
        students: Number(row.students),
      })),
    };
  }
}
