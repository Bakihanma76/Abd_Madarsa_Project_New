export class ReportProvider {
  constructor(db, context = {}) {
    this.db = db;
    this.context = context;
  }

  async build() {
    throw new Error('Report provider must implement build()');
  }
}
