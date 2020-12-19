/* eslint-disable class-methods-use-this */
/* eslint-disable no-undef */
/* eslint-disable new-cap */
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
    chartTitle.textContent = 'Total Cases';

    const totalCases = [[], [], []];
    const lastUpdate = [];
    this.chartData.forEach((item) => {
      totalCases[0].push(item.total_cases);
      totalCases[1].push(item.total_deaths);
      totalCases[2].push(item.total_recovered);
      lastUpdate.push(`${item.last_update.split('-')[1]} ${item.last_update.split('-')[0]}`);
    });
    lastUpdate.reverse();
    totalCases[0].reverse();
    totalCases[1].reverse();
    totalCases[2].reverse();

    getElement('body').appendChild(chartContainer);
    chartContainer.appendChild(canvas);
    chartContainer.appendChild(chartTitleContainer);
    chartTitleContainer.appendChild(leftArrow);
    chartTitleContainer.appendChild(chartTitle);
    chartTitleContainer.appendChild(rightArrow);

    let yAxeIndex = 0;

    rightArrow.addEventListener('click', () => {
      yAxeIndex += 1;
      const i = yAxeIndex % 3;
      // eslint-disable-next-line no-use-before-define
      myChart.data.datasets[0].data = totalCases[i];
      // eslint-disable-next-line no-use-before-define
      myChart.update();
    });

    leftArrow.addEventListener('click', () => {
      yAxeIndex -= 1;
      const i = Math.abs(yAxeIndex % 3);
      // eslint-disable-next-line no-use-before-define, prefer-destructuring
      myChart.data.datasets[0].data = totalCases[i];
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
          data: totalCases[0],
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
      this.mapUpdate();
    });
    this.populationInput.addEventListener('change', () => {
      this.isPopulation = !this.isPopulation;
      this.properties = properties.filter((prop) => prop.isLastDay === this.isLastDay && prop.isPerPopulation === this.isPopulation);
      this.showCollumnTable(this.properties[this.tableCurrentProp].name);
      this.updateCovidInfoTable();
      this.mapUpdate();
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

  mapInit() {
    const mapOptions = {
      center: [53, 28],
      zoom: 1,
      worldCopyJump: true,
    };
    this.currentMarkers = [];
    this.map = new L.map('map', mapOptions);
    this.layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    this.map.addLayer(this.layer);
    this.model.data.CountriesInfo.forEach((item) => {
      const circleCenter = [item.lat, item.lng];
      const circleOptions = {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0,
      };
      const circleSizeCoefficient = 7;
      const circle = L.circle(circleCenter, item[properties[2].name] / circleSizeCoefficient, circleOptions);
      this.currentMarkers.push(circle);
      circle.addTo(this.map);
    });
    this.map.addEventListener('click', (event) => {
      console.log(event.latlng.lat);
      console.log(event.latlng.lng);
      this.getCountryBameByCoords(event.latlng.lat, event.latlng.lng);
    });
  }

  mapUpdate() {
    console.log(this.layer);
    this.currentMarkers.forEach((circle) => {
      this.layer.remove(circle);
    });
  }

  async getCountryBameByCoords(lt, lg) {
    async function reverseGeocoding(lat, log) {
      try {
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${log}&key=99ecf60eb3944fd69770b5c974614a6a&language=en`;
        const res = await fetch(url);
        const data = await res.json();
        return data;
      } catch (err) {
        // eslint-disable-next-line no-alert
        alert('Something went wrong');
      }
      return data;
    }

    const response = reverseGeocoding(lt, lg);
    let name;
    await response.then((data) => {
      name = data.results[0].components.country;
      alert(`${data.results[0].components.country} --> ${data.results[0].components.country_code}`);
    });
    return name;
  }
}
