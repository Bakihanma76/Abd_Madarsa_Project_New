import { ReportProvider } from './ReportProvider.js';

const round = (value, digits = 1) => Number(Number(value || 0).toFixed(digits));

export class AttendanceReportProvider extends ReportProvider {
  async build() {
    const conditions = ['institutionId = :institutionId'];
    const params = { institutionId: this.context.institutionId || 1 };
    if (this.context.studentName) {
      conditions.push('studentName = :studentName');
      params.studentName = this.context.studentName;
    }
    const where = `WHERE ${conditions.join(' AND ')}`;

    const rows = await this.db.rows(`
      SELECT
        grade,
        COUNT(DISTINCT studentName) AS students,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent,
        AVG(CASE WHEN status = 'Present' THEN 100 ELSE 0 END) AS avgAttendance
      FROM attendance_records
      ${where}
      GROUP BY grade
      ORDER BY grade
    `, params);

    const data = rows.map((row) => ({
      grade: row.grade,
      students: Number(row.students),
      present: Number(row.present),
      absent: Number(row.absent),
      avgAttendance: round(row.avgAttendance),
    }));
    const presentToday = data.reduce((sum, row) => sum + row.present, 0);
    const absentToday = data.reduce((sum, row) => sum + row.absent, 0);
    const total = presentToday + absentToday;

    return {
      summary: {
        overallAttendance: total ? round((presentToday / total) * 100) : 0,
        presentToday,
        absentToday,
        totalGrades: data.length,
      },
      data,
    };
  }
}
