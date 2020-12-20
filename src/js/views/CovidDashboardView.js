import Chart from 'chart.js';
import EventEmitter from '../models/EventEmitter';
import {
  elementFactory, clearElement, getElement, getElements,
} from '../helpers/domElementsHelper';

import properties from '../helpers/properties';

const _ = require('lodash');

export default class CovidDashboardView extends EventEmitter {
  constructor() {
    super();
    this.model = [];
    this.chartData = [];
    this.evnts = {};
    this.createTableContainer();
    this.setUpLocalListeners();

    this.properties = properties;

    this.isLastDay = false;
    this.isPopulation = false;
    this.selectedCountry = null;

    this.tableCurrentProp = 0;
  }

  /**
   * Creates application default page layer without any data.
   */
  createTableContainer() {
    this.tableButtonPrev = elementFactory('button', {}, 'Prev');
    this.tableButtonNext = elementFactory('button', {}, 'Next');
    this.tableFilterInput = elementFactory('input', {}, '');

    this.tableHeader = elementFactory('div', { style: 'font-size:26px;' }, properties[0].header);

    const periodSwitchHeader = elementFactory('span', {}, 'Period:');
    this.periodInput = elementFactory('input', { type: 'checkbox', checked: true }, '');
    const periodSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Last' }, '');
    this.togglePeriodButton = elementFactory('label', { class: 'switch' }, this.periodInput, periodSlider);

    const populationSwitchHeader = elementFactory('span', {}, 'Population:');
    this.populationInput = elementFactory('input', { type: 'checkbox', checked: true }, '');
    const populationSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Per 100k' }, '');
    this.togglePopulationButton = elementFactory('label', { class: 'switch' }, this.populationInput, populationSlider);

    this.table = elementFactory('div', { class: 'country-table' }, '');
    this.container = elementFactory('div', { class: 'country-table-container' }, periodSwitchHeader, this.togglePeriodButton, populationSwitchHeader, this.togglePopulationButton,
      this.tableButtonPrev, this.tableButtonNext, this.tableFilterInput, this.tableHeader, this.table);
    getElement('body').appendChild(this.container);
  }

  /**
   * Sotrs contries table by current active property.
   */
  sortTable() {
    const rows = getElements('.cell-active');
    const rowsArr = [].slice.call(rows).sort((a, b) => (Number(a.textContent) < Number(b.textContent) ? 1 : -1));
    rowsArr.forEach((row) => {
      this.table.appendChild(row.closest('.table-row'));
    });
  }

  /**
   * Displays table with coutries list on page.
   *
   * @param {string} value Property name to show in table.
   */
  showCollumnTable(value) {
    const active = getElements('.cell-active');
    active.forEach((el) => {
      el.classList.remove('cell-active');
    });
    this.tableHeader.textContent = _.find(this.properties, ['name', value]).header;
    const propEls = getElements(`[data-property=${value}]`);
    propEls.forEach((el) => {
      el.classList.add('cell-active');
    });
    this.sortTable();
  }

  /**
   * Displays table with coutries list on page.
   */
  displayTable() {
    clearElement(this.table);
    const rows = [];
    this.tableHeader.textContent = _.find(this.properties, ['name', this.properties[0].name]).header;
    this.model.data.CountriesInfo.forEach((country) => {
      const name = elementFactory('div', { class: 'table-cell cell-name' }, `${country.Country}`);
      const props = [];
      this.properties.forEach((property) => {
        let active = '';
        if (property.name === this.properties[0].name) active = 'cell-active';
        const prop = elementFactory('div',
          { class: `table-cell cell-numeric ${active}`, 'data-property': property.name },
          `${country[property.name]}`);
        props.push(prop);
      });
      const flag = elementFactory('img', { src: country.flag, class: 'flag-img' }, '');
      const row = elementFactory('div', { class: 'table-row' }, flag, name, ...props);

      row.onclick = () => {
        // eslint-disable-next-line no-alert
        alert(country.Country);
        this.selectedCountry = country.Country;
        this.updateCovidInfoTable();
      };

      rows.push(row);
    });
    rows.forEach((row) => {
      this.table.appendChild(row);
    });
    this.sortTable();
    this.properties = properties.filter((prop) => prop.isLastDay === this.isLastDay && prop.isPerPopulation === this.isPopulation);
  }

  // eslint-disable-next-line class-methods-use-this
  displayChart() {
    const chartContainer = elementFactory('div', { class: 'chart_container' }, '');
    const canvas = elementFactory('canvas', { id: 'chart', style: 'width: 2; height: 1' }, '');
    const chartTitleContainer = elementFactory('div', { class: 'chart_title_container' }, '');
    const chartTitle = elementFactory('h3', { class: 'chart_title' }, '');
    const rightArrow = elementFactory('i', { class: 'fas fa-angle-right' }, '');
    const leftArrow = elementFactory('i', { class: 'fas fa-angle-left' }, '');
    chartTitle.textContent = 'World Wide Cases of Infection';

    getElement('body').appendChild(chartContainer);
    chartContainer.appendChild(canvas);
    chartContainer.appendChild(chartTitleContainer);
    chartTitleContainer.appendChild(leftArrow);
    chartTitleContainer.appendChild(chartTitle);
    chartTitleContainer.appendChild(rightArrow);

    // const aroundTheWorldCases = [[], [], []];
    const aroundTheWorldCases = {
      World_Wide_Cases_of_Infection: [],
      World_Wide_Cases_of_Deaths: [],
      World_Wide_Cases_of_Recovery: [],
      Dates_of_Updating: [],
    };
    // const lastUpdate = [];
    this.chartData.forEach((item) => {
      aroundTheWorldCases.World_Wide_Cases_of_Infection.push(item.total_cases);
      aroundTheWorldCases.World_Wide_Cases_of_Deaths.push(item.total_deaths);
      aroundTheWorldCases.World_Wide_Cases_of_Recovery.push(item.total_recovered);
      aroundTheWorldCases.Dates_of_Updating.push(`${item.last_update.split('-')[1]} ${item.last_update.split('-')[0]}`);
    });

    aroundTheWorldCases.World_Wide_Cases_of_Infection.reverse();
    aroundTheWorldCases.World_Wide_Cases_of_Deaths.reverse();
    aroundTheWorldCases.World_Wide_Cases_of_Recovery.reverse();
    aroundTheWorldCases.Dates_of_Updating.reverse();

    let i = 0;

    rightArrow.addEventListener('click', () => {
      i += 1;
      const key = Object.keys(aroundTheWorldCases)[i % 3];
      // eslint-disable-next-line no-use-before-define
      myChart.data.datasets[0].label = `${key}`.split('_').join(' ');
      // eslint-disable-next-line no-use-before-define
      myChart.data.datasets[0].data = aroundTheWorldCases[key];
      chartTitle.textContent = Object.keys(aroundTheWorldCases)[i % 3].split('_').join(' ');
      // eslint-disable-next-line no-use-before-define
      myChart.update();
    });

    leftArrow.addEventListener('click', () => {
      i -= 1;
      if (i < 0) {
        i = 2;
      }
      const key = Object.keys(aroundTheWorldCases)[(i % 3)];
      // eslint-disable-next-line no-use-before-define
      myChart.data.datasets[0].label = `${key}`.split('_').join(' ');
      // eslint-disable-next-line no-use-before-define
      myChart.data.datasets[0].data = aroundTheWorldCases[key];
      chartTitle.textContent = Object.keys(aroundTheWorldCases)[i % 3].split('_').join(' ');
      // eslint-disable-next-line no-use-before-define
      myChart.update();
    });

    // eslint-disable-next-line no-undef
    // Chart.defaults.global.defaultColor = 'rgba(248, 246, 142, 0.5)';

    const ctx = document.querySelector('canvas').getContext('2d');
    // eslint-disable-next-line no-undef
    const myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: aroundTheWorldCases.Dates_of_Updating,
        datasets: [{
          label: 'World Wide Cases of Infection',
          data: aroundTheWorldCases.World_Wide_Cases_of_Infection,
          backgroundColor: 'rgba(247, 202, 80, 0.9)',
          borderColor: 'rgba(247, 202, 80, 1)',
          borderWidth: 1,
          lineTension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
        }],
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              callback(value) {
                return value;
              },
            },
          }],
        },
        legend: {
          display: false,
        },
      },
    });
  }

  setUpLocalListeners() {
    this.tableButtonNext.addEventListener('click', () => {
      if (this.tableCurrentProp < this.properties.length - 1) {
        this.tableCurrentProp += 1;
      } else {
        this.tableCurrentProp = 0;
      }
      this.showCollumnTable(this.properties[this.tableCurrentProp].name);
    });
    this.periodInput.addEventListener('change', () => {
      this.isLastDay = !this.isLastDay;
      this.properties = properties.filter((prop) => prop.isLastDay === this.isLastDay && prop.isPerPopulation === this.isPopulation);
      this.showCollumnTable(this.properties[this.tableCurrentProp].name);
      this.updateCovidInfoTable();
    });
    this.populationInput.addEventListener('change', () => {
      this.isPopulation = !this.isPopulation;
      this.properties = properties.filter((prop) => prop.isLastDay === this.isLastDay && prop.isPerPopulation === this.isPopulation);
      this.showCollumnTable(this.properties[this.tableCurrentProp].name);
      this.updateCovidInfoTable();
    });

    this.tableFilterInput.addEventListener('keyup', (e) => {
      const nameSpans = getElements('.cell-name');
      const searchString = e.target.value.toLowerCase();
      nameSpans.forEach((span) => {
        if (span.textContent.toLowerCase().indexOf(searchString) !== -1) {
          // eslint-disable-next-line no-param-reassign
          span.closest('.table-row').classList.remove('row-hide');
        } else {
          // eslint-disable-next-line no-param-reassign
          span.closest('.table-row').classList.add('row-hide');
        }
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  displayCovidInfoTable() {
    const tableHeaderCountOfRecovered = elementFactory('th', {});
    tableHeaderCountOfRecovered.innerText = 'Count of recovered';
    const tableHeaderCountOfDeath = elementFactory('th', {});
    tableHeaderCountOfDeath.innerText = 'Count of death';
    const tableHeaderCountOfDesease = elementFactory('th', {});
    tableHeaderCountOfDesease.innerText = 'Count of desease';
    const tableHeader = elementFactory('tr', {}, tableHeaderCountOfDesease, tableHeaderCountOfDeath, tableHeaderCountOfRecovered);

    const tableContentCountOfRecovered = elementFactory('td', { class: 'covid_info__CountOfRecovered' });
    const tableContentCountOfDeath = elementFactory('td', { class: 'covid_info__CountOfDeath' });
    const tableContentCountOfDesease = elementFactory('td', { class: 'covid_info__CountOfDesease' });
    const tableContent = elementFactory('tr', {}, tableContentCountOfDesease, tableContentCountOfDeath, tableContentCountOfRecovered);

    const table = elementFactory('table', { class: 'covid_info__table' }, tableHeader, tableContent);
    const container = elementFactory('div', { class: 'covid_info' }, table);
    getElement('body').appendChild(container);
  }

  updateCovidInfoTable() {
    let data;
    if (this.selectedCountry) {
      data = this.model.data.CountriesInfo.find((item) => item.Country === this.selectedCountry);
    } else {
      data = this.model.data.GlobalInfo;
    }
    this.drawCovidInfoTable(data);
  }

  drawCovidInfoTable(data) {
    const countOfDesease = document.querySelector('.covid_info__CountOfDesease');
    const countOfDeath = document.querySelector('.covid_info__CountOfDeath');
    const countOfRecovered = document.querySelector('.covid_info__CountOfRecovered');
    countOfDesease.innerText = data[this.properties[0].name];
    countOfDeath.innerText = data[this.properties[1].name];
    countOfRecovered.innerText = data[this.properties[2].name];
  }
}
