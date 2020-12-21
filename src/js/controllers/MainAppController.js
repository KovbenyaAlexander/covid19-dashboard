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

  updateChartData(name) {
    this.model.getDataByCountryName(name);
  }

  mapInit() {
    this.dashboardView.mapInit();
  }

  setUplocalListeners() {
    this.model.on('hasdata', () => {
      this.dashboardView.model = this.model;
      this.dashboardView.chartData = this.model.data.timeline;
      this.displayTable();
      this.updateCovidInfoTable();
      this.displayChart();
      this.mapInit();
    });
    this.model.on('hascountrydata', () => {
      this.dashboardView.chartData = this.model.chartData;
      // console.log(this.dashboardView.chartData);
    });
    this.dashboardView.on('updatedata', (name) => this.updateChartData(name));
  }
}
