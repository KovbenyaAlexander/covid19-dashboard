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
    this.evnts = {};
    this.createTableContainer();
    this.setUpLocalListeners();

    this.properties = properties;

    this.isLastDay = false;
    this.isPopulation = false;

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

  displayTable(value) {
    clearElement(getElement('body'));
    const rows = [];
    const header = elementFactory('div', { style: 'font-size:26px;' }, `${value}`);
    this.model.data.CountriesInfo.forEach((country) => {
      const name = elementFactory('span', { class: 'country-span' }, `${country.Country}`);
      const prop = elementFactory('span', {}, `${country[value]}`);
      const flag = elementFactory('img', { src: country.flag, style: 'width:50px;height:50px' }, '');
      const row = elementFactory('div', { style: 'display: flex; column-gap:10px; align-items:center; border:1px solid black' }, name, prop, flag);

      row.onclick = () => {
        // eslint-disable-next-line no-alert
        alert(country.Country);
      };

      rows.push(row);
    });

    const container = elementFactory('div', { style: 'width:500px;' }, this.button, this.tableFilterInput, header, ...rows);
    getElement('body').appendChild(container);
  }

  // eslint-disable-next-line class-methods-use-this
  displayChart() {
    const chartContainer = elementFactory('div', { class: 'chart_container' }, '');
    const canvas = elementFactory('canvas', { id: 'chart', style: 'width: 2; height: 1' }, '');
    const chartTitle = elementFactory('h3', { class: 'chart_title' }, '');
    chartTitle.textContent = 'Total Cases';

    const totalCases = [];
    const lastUpdate = [];
    this.model.data.timeline.forEach((item) => {
      totalCases.push(item.total_cases);
      lastUpdate.push(`${item.last_update.split('-')[1]} ${item.last_update.split('-')[0]}`);
    });
    lastUpdate.reverse();
    totalCases.reverse();

    getElement('body').appendChild(chartContainer);
    getElement('.chart_container').appendChild(canvas);
    getElement('.chart_container').appendChild(chartTitle);

    chartTitle.addEventListener('click', () => {
      clearElement(totalCases);
      this.model.data.timeline.forEach((item) => {
        totalCases.push(item.total_deaths);
        chartTitle.textContent = 'Total Deaths';
      });
      totalCases.reverse();
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
        labels: lastUpdate,
        datasets: [{
          label: 'Total Cases',
          data: totalCases,
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
    this.button.addEventListener('click', () => {
      this.emit('nextprop');
    });

    this.tableFilterInput.addEventListener('keyup', (e) => {
      const nameSpans = getElements('.country-span');
      const searchString = e.target.value.toLowerCase();
      nameSpans.forEach((span) => {
        if (span.textContent.toLowerCase().indexOf(searchString) !== -1) {
          // eslint-disable-next-line no-param-reassign
          span.closest('div').style.display = 'flex';
        } else {
          // eslint-disable-next-line no-param-reassign
          span.closest('div').style.display = 'none';
        }
      });
    });
  }
}
