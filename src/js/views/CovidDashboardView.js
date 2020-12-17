import EventEmitter from '../models/EventEmitter';
import {
  elementFactory, clearElement, getElement, getElements,
} from '../helpers/domElementsHelper';

export default class CovidDashboardView extends EventEmitter {
  constructor() {
    super();
    this.model = [];
    this.evnts = {};
    this.button = elementFactory('button', {}, 'Refresh');
    this.tableFilterInput = elementFactory('input', {}, '');

    this.setUpLocalListeners();
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

  // eslint-disable-next-line class-methods-use-this
  displayInfoAboutCountry() {
    // const typeOfCountingSwitcher = elementFactory('button', { class: 'typeOfCountingSwitcher' });
    // typeOfCountingSwitcher.innerText = 'global / per100k';
    // const dataSwitcher = elementFactory('button', { class: 'dataSwitcher' });
    // dataSwitcher.innerText = 'all time / last day';

    const input = elementFactory('input', { type: 'checkbox' });
    const dateSwitcherSpan = elementFactory('span', { class: 'slider round' });
    const dateSwitcher = elementFactory('label', { class: 'switch' }, input, dateSwitcherSpan);
    const leftPartOfdateContainer = elementFactory('div', {});
    leftPartOfdateContainer.innerText = 'all time';
    const rightPartOfdateContainer = elementFactory('div', {});
    rightPartOfdateContainer.innerText = 'last day';
    const dateSwitcherContainer = elementFactory('div', { class: 'dateSwitcherContainer' }, leftPartOfdateContainer, dateSwitcher, rightPartOfdateContainer);

    const typeOfCountingSwitcherSpan = elementFactory('span', { class: 'slider round' });
    const typeOfCountingSwitcher = elementFactory('label', { class: 'switch' }, input.cloneNode(), typeOfCountingSwitcherSpan);
    const leftPartOftypeContainer = elementFactory('div', {});
    leftPartOftypeContainer.innerText = 'per100k';
    const rightPartOftypeContainer = elementFactory('div', {});
    rightPartOftypeContainer.innerText = 'absolute';
    const typeSwitcherContainer = elementFactory('div', { class: 'typeSwitcherContainer' }, leftPartOftypeContainer, typeOfCountingSwitcher, rightPartOftypeContainer);

    const navigation = elementFactory('div', { class: 'country_info__navigation' }, dateSwitcherContainer, typeSwitcherContainer);

    const tableHeaderCountOfRecovered = elementFactory('th', {});
    tableHeaderCountOfRecovered.innerText = 'Count of recovered';
    const tableHeaderCountOfDeath = elementFactory('th', {});
    tableHeaderCountOfDeath.innerText = 'Count of death';
    const tableHeaderCountOfDesease = elementFactory('th', {});
    tableHeaderCountOfDesease.innerText = 'Count of desease';
    const tableHeader = elementFactory('tr', {}, tableHeaderCountOfDesease, tableHeaderCountOfDeath, tableHeaderCountOfRecovered);

    const tableContentCountOfRecovered = elementFactory('td', { class: 'country_info__CountOfRecovered' });
    const tableContentCountOfDeath = elementFactory('td', { class: 'country_info__CountOfDeath' });
    const tableContentCountOfDesease = elementFactory('td', { class: 'country_info__CountOfDesease' });
    const tableContent = elementFactory('tr', {}, tableContentCountOfDesease, tableContentCountOfDeath, tableContentCountOfRecovered);

    const table = elementFactory('table', { class: 'country_info__table' }, tableHeader, tableContent);
    const container = elementFactory('div', { class: 'country_info' }, navigation, table);
    getElement('body').appendChild(container);

    dateSwitcherSpan.addEventListener('click', () => {
      this.model.isCountingForLastDay = !this.model.isCountingForLastDay;
      console.log(this.model.isCountingForLastDay);
      console.log(this.model.isCountingAbsolute);
      console.log('DATE');
    });

    typeOfCountingSwitcherSpan.addEventListener('click', () => {
      this.model.isCountingAbsolute = !this.model.isCountingAbsolute;
      console.log(this.model.isCountingForLastDay);
      console.log(this.model.isCountingAbsolute);
      console.log('TYPE');
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
