import { ReportProvider } from './ReportProvider.js';

const money = (value) => Number(Number(value || 0).toFixed(2));

export class FinancialReportProvider extends ReportProvider {
  async build() {
    const params = { institutionId: this.context.institutionId || 1 };
    const totalRevenue = money(await this.db.scalar(`
      SELECT COALESCE(SUM(amount), 0)
      FROM fee_transactions
      WHERE institutionId = :institutionId AND status IN ('Paid', 'Partial')
    `, params));
    const totalExpenses = money(await this.db.scalar(`
      SELECT COALESCE(SUM(amount), 0)
      FROM expenses
      WHERE institutionId = :institutionId
    `, params));
    const breakdownRows = await this.db.rows(`
      SELECT category, COALESCE(SUM(amount), 0) AS amount
      FROM expenses
      WHERE institutionId = :institutionId
      GROUP BY category
      ORDER BY category
    `, params);

    const breakdown = breakdownRows.map((row) => ({
      category: row.category,
      amount: money(row.amount),
    }));
    const netProfit = money(totalRevenue - totalExpenses);

    return {
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        revenueVsExpenses: totalRevenue ? Math.min(100, Math.round((totalExpenses / totalRevenue) * 100)) : 0,
        profitMargin: totalRevenue ? Math.round((netProfit / totalRevenue) * 100) : 0,
      },
      breakdown,
    };
  }
}
