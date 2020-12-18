import CovidDate from '../models/CovidData';
import CovidDashboardView from '../views/CovidDashboardView';

export default class MainAppController {
  constructor() {
    this.model = new CovidDate();
    this.dashboardView = new CovidDashboardView();
    this.setUplocalListeners();
  }

  displayTable(value) {
    this.dashboardView.displayTable(value);
  }

  displayChart(value) {
    this.dashboardView.displayChart(value);
  }

  displayCovidInfoTable() {
    this.dashboardView.displayCovidInfoTable();
  }

  updateCovidInfoTable() {
    this.dashboardView.updateCovidInfoTable();
  }

  setUplocalListeners() {
    this.model.on('hasdata', () => {
      this.dashboardView.model = this.model;
      this.dashboardView.chartData = this.model.data.timeline;
      this.displayTable();
      this.displayChart();
      this.displayCovidInfoTable();
      this.updateCovidInfoTable();
    });
  }
}
