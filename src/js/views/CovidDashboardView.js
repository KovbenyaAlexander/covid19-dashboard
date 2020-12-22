/* eslint-disable no-else-return */
/* eslint-disable no-alert */
/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable vars-on-top */
/* eslint-disable no-var */
/* eslint-disable prefer-template */
/* eslint-disable func-names */
/* eslint-disable no-use-before-define */
/* eslint-disable no-nested-ternary */
/* eslint-disable quotes */
/* eslint-disable object-shorthand */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-undef */
/* eslint-disable new-cap */
import Chart from 'chart.js';
import Keyboard from 'simple-keyboard';
import EventEmitter from '../models/EventEmitter';
import {
  elementFactory, clearElement, getElement, getElements,
} from '../helpers/domElementsHelper';
import cData from '../helpers/countries';
import properties from '../helpers/properties';

const _ = require('lodash');

export default class CovidDashboardView extends EventEmitter {
  constructor() {
    super();
    this.model = [];
    this.chartData = [];
    this.evnts = {};
    this.isNoData = true;

    this.properties = properties;
    this.createDataStatus();
    this.displayCovidInfoTable();
    this.createTableContainer();
    this.createMapContainer();
    this.createChartContainer();
    this.setUpLocalListeners();

    this.isLastDay = false;
    this.isPopulation = false;
    this.selectedCountry = null;

    this.tableCurrentProp = 0;

    this.aroundTheWorldCases = {};
    this.myChart = {};
  }

  /**
   * Creates application default page layer without any data.
   */
  createTableContainer() {
    const rightArrow = elementFactory('i', { class: 'fas fa-angle-right' }, '');
    const leftArrow = elementFactory('i', { class: 'fas fa-angle-left' }, '');
    this.tableButtonPrev = elementFactory('button', { class: 'arrow-button' }, leftArrow);
    this.tableButtonNext = elementFactory('button', { class: 'arrow-button' }, rightArrow);

    const searchLabel = elementFactory('label', { class: 'search-label', for: 'searchInput' }, 'Search country: ');
    this.tableFilterInput = elementFactory('input', { class: 'country-search', id: 'searchInput' }, 'search country');

    const searchGroup = elementFactory('div', { class: 'search-group' }, searchLabel, this.tableFilterInput);

    this.tableHeader = elementFactory('div', { class: 'table-header' }, properties[0].header);

    const tableControl = elementFactory('div', { class: 'table-control' }, this.tableButtonPrev, this.tableHeader, this.tableButtonNext);

    this.periodInput = elementFactory('input', { type: 'checkbox', class: 'period-check', checked: true }, '');
    const periodSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Last day' }, '');
    this.togglePeriodButton = elementFactory('label', { class: 'switch' }, this.periodInput, periodSlider);
    const periodSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Period: ', this.togglePeriodButton);

    this.populationInput = elementFactory('input', { type: 'checkbox', class: 'population-check', checked: true }, '');
    const populationSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Per 100k' }, '');
    this.togglePopulationButton = elementFactory('label', { class: 'switch' }, this.populationInput, populationSlider);
    const populationSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Population: ', this.togglePopulationButton);

    const resizeImg = elementFactory('img', { class: 'resize-img', src: 'assets/img/enlarge.svg', alt: 'resize-img' }, '');
    this.countryTableResize = elementFactory('button', { class: 'resize-button' }, resizeImg);

    const controlGroup = elementFactory('div', { class: 'control-group' }, periodSwitchHeader, populationSwitchHeader);
    this.table = elementFactory('div', { class: 'country-table data-load-box' }, this.loadData);

    const header = elementFactory('div', { class: 'country-container-header' }, 'Cases by Counry/Region/Province');
    this.container = elementFactory('div', { class: 'country-table-container' }, this.countryTableResize, header, controlGroup, searchGroup, tableControl, this.table);
    this.tableMapContainer = elementFactory('div', { class: 'table-map-wrapper' }, this.container);

    this.simpleKeyboard = elementFactory('div', { class: 'simple-keyboard' }, '');
    document.body.appendChild(this.simpleKeyboard);

    this.keyboard = new Keyboard({
      onChange: (input) => {
        this.tableFilterInput.value = input;
        this.filterTable(input);
      },
      onKeyPress: (button) => {
        if (button === "{enter}") {
          this.simpleKeyboard.classList.remove('show-keyboard');
        }
        if (button === "{shift}" || button === "{lock}") {
          const currentLayout = this.keyboard.options.layoutName;
          const shiftToggle = currentLayout === "default" ? "shift" : "default";
          this.keyboard.setOptions({
            layoutName: shiftToggle,
          });
          this.simpleKeyboard.classList.add('show-keyboard');
        }
      },
    });
    getElement('main').appendChild(this.tableMapContainer);
  }

  createMapContainer() {
    const rightArrow = elementFactory('i', { class: 'fas fa-angle-right' }, '');
    const leftArrow = elementFactory('i', { class: 'fas fa-angle-left' }, '');
    this.mapButtonPrev = elementFactory('button', { class: 'arrow-button' }, leftArrow);
    this.mapButtonNext = elementFactory('button', { class: 'arrow-button' }, rightArrow);

    this.mapHeader = elementFactory('div', { class: 'map-header' }, properties[0].header);

    const mapControl = elementFactory('div', { class: 'map-control' }, this.mapButtonPrev, this.mapHeader, this.mapButtonNext);

    const periodInput = elementFactory('input', { type: 'checkbox', class: 'period-check', checked: true }, '');
    const periodSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Last day' }, '');
    const togglePeriodButton = elementFactory('label', { class: 'switch' }, periodInput, periodSlider);
    const periodSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Period:', togglePeriodButton);

    const populationInput = elementFactory('input', { type: 'checkbox', class: 'population-check', checked: true }, '');
    const populationSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Per 100k' }, '');
    const togglePopulationButton = elementFactory('label', { class: 'switch' }, populationInput, populationSlider);
    const populationSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Population:', togglePopulationButton);

    const resizeImg = elementFactory('img', { class: 'resize-img', src: 'assets/img/enlarge.svg', alt: 'resize-img' }, '');
    this.mapResize = elementFactory('button', { class: 'resize-button' }, resizeImg);

    const controlGroup = elementFactory('div', { class: 'control-group' }, periodSwitchHeader, populationSwitchHeader);

    this.map = elementFactory('div', { class: 'map-block data-load-box', id: 'map' }, this.loadData.cloneNode(true));
    const mapContainerHeader = elementFactory('div', { class: 'map-container-header' }, 'World map');
    this.mapContainer = elementFactory('div', { class: 'map-container' }, this.mapResize, mapContainerHeader, controlGroup, mapControl, this.map);

    this.tableMapContainer.appendChild(this.mapContainer);
  }

  resizeWindowElements() {
    this.covidInfoTableContainer.classList.toggle('hide-container');
    this.chartContainer.classList.toggle('hide-container');
    this.container.classList.toggle('hide-container');
    this.mapContainer.classList.toggle('hide-map');
    getElement('main').classList.toggle('main-center');
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
    this.table.classList.remove('data-load-box');
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
        // alert(`${country.Country} || ${country.CountryCode}`);
        this.moveTheMap(country.CountryCode);
        this.selectedCountry = country.CountryCode;
        this.updateCovidInfoTable();
        this.emit('updatedata', country.Country);
      };

      rows.push(row);
    });
    rows.forEach((row) => {
      this.table.appendChild(row);
    });
    this.sortTable();
    this.properties = properties.filter((prop) => prop.isLastDay === this.isLastDay && prop.isPerPopulation === this.isPopulation);
  }

  updateChart() {
    if (!this.chartData[0]) {
      return;
    }
    this.aroundTheWorldCases.Cases_of_Infection = [];
    this.aroundTheWorldCases.Cases_of_Deaths = [];
    this.aroundTheWorldCases.Cases_of_Recovery = [];
    this.aroundTheWorldCases.Dates_of_Updating = [];
    this.chartData.forEach((item) => {
      this.aroundTheWorldCases.Cases_of_Infection.push(item.Confirmed);
      this.aroundTheWorldCases.Cases_of_Deaths.push(item.Deaths);
      this.aroundTheWorldCases.Cases_of_Recovery.push(item.Recovered);
      this.aroundTheWorldCases.Dates_of_Updating.push(`${item.Date.split('-')[1]} ${item.Date.split('-')[0]}`);
    });
    this.myChart.data.datasets[0].data = this.aroundTheWorldCases.Cases_of_Infection;
    this.myChart.data.labels = this.aroundTheWorldCases.Dates_of_Updating;
    this.myChart.options.title.text = `${this.chartData[0].Country}`;
    this.myChart.update();
  }

  createChartContainer() {
    this.canvas = elementFactory('canvas', { id: 'chart', style: 'width: 2; height: 1; display:none' }, '');
    this.chartTitle = elementFactory('div', { class: 'chart_title' }, this.properties[0].header);
    const rightArrow = elementFactory('i', { class: 'fas fa-angle-right' }, '');
    const leftArrow = elementFactory('i', { class: 'fas fa-angle-left' }, '');

    this.chartButtonPrev = elementFactory('button', { class: 'arrow-button' }, leftArrow);
    this.chartButtonNext = elementFactory('button', { class: 'arrow-button' }, rightArrow);

    const periodInput = elementFactory('input', { type: 'checkbox', class: 'period-check', checked: true }, '');
    const periodSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Last day' }, '');
    const togglePeriodButton = elementFactory('label', { class: 'switch' }, periodInput, periodSlider);
    const periodSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Period:', togglePeriodButton);

    const populationInput = elementFactory('input', { type: 'checkbox', class: 'population-check', checked: true }, '');
    const populationSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Per 100k' }, '');
    const togglePopulationButton = elementFactory('label', { class: 'switch' }, populationInput, populationSlider);
    const populationSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Population:', togglePopulationButton);

    const resizeImg = elementFactory('img', { class: 'resize-img', src: 'assets/img/enlarge.svg', alt: 'resize-img' }, '');
    this.chartResize = elementFactory('button', { class: 'resize-button' }, resizeImg);

    const controlGroup = elementFactory('div', { class: 'control-group' }, periodSwitchHeader, populationSwitchHeader);
    const chartTitleContainer = elementFactory('div', { class: 'chart_title_container' }, this.chartButtonPrev, this.chartTitle, this.chartButtonNext);

    this.chartContainer = elementFactory('div', { class: 'chart_container chart-center' }, this.chartResize, controlGroup, this.loadData.cloneNode(true), this.canvas, chartTitleContainer);
    this.infoChartContainer.appendChild(this.chartContainer);
  }

  displayChart() {
    this.chartContainer.querySelector('.data-status').remove();
    this.chartContainer.classList.remove('data-load-box');
    this.chartContainer.classList.remove('chart-center');
    this.canvas.style.display = 'block';
    this.aroundTheWorldCases = {
      Cases_of_Infection: [],
      Cases_of_Deaths: [],
      Cases_of_Recovery: [],
      Dates_of_Updating: [],
    };

    this.chartData.forEach((item) => {
      this.aroundTheWorldCases.Cases_of_Infection.push(item.total_cases);
      this.aroundTheWorldCases.Cases_of_Deaths.push(item.total_deaths);
      this.aroundTheWorldCases.Cases_of_Recovery.push(item.total_recovered);
      this.aroundTheWorldCases.Dates_of_Updating.push(`${item.last_update.split('-')[1]} ${item.last_update.split('-')[0]}`);
    });

    this.aroundTheWorldCases.Cases_of_Infection.reverse();
    this.aroundTheWorldCases.Cases_of_Deaths.reverse();
    this.aroundTheWorldCases.Cases_of_Recovery.reverse();
    this.aroundTheWorldCases.Dates_of_Updating.reverse();

    const ctx = document.querySelector('canvas').getContext('2d');
    this.myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.aroundTheWorldCases.Dates_of_Updating,
        datasets: [{
          label: this.properties[0].header,
          data: this.aroundTheWorldCases.Cases_of_Infection,
          backgroundColor: 'rgba(247, 202, 80, 0.9)',
          borderColor: 'rgba(247, 202, 80, 1)',
          borderWidth: 1,
          lineTension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
        }],
      },
      options: {
        title: {
          display: true,
          text: 'Global info',
        },
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

  nextProp() {
    if (this.tableCurrentProp < this.properties.length - 1) {
      this.tableCurrentProp += 1;
    } else {
      this.tableCurrentProp = 0;
    }
  }

  prevProp() {
    if (this.tableCurrentProp > 0) {
      this.tableCurrentProp -= 1;
    } else {
      this.tableCurrentProp = this.properties.length - 1;
    }
  }

  updateAllModules() {
    this.mapHeader.textContent = this.properties[this.tableCurrentProp].header;
    this.tableHeader.textContent = this.properties[this.tableCurrentProp].header;
    this.chartTitle.textContent = this.properties[this.tableCurrentProp].header;

    this.showCollumnTable(this.properties[this.tableCurrentProp].name);

    const key = Object.keys(this.aroundTheWorldCases)[this.tableCurrentProp];
    this.myChart.data.datasets[0].label = this.properties[this.tableCurrentProp].header;
    this.myChart.data.datasets[0].data = this.aroundTheWorldCases[key];
    this.chartTitle.textContent = this.properties[this.tableCurrentProp].header;
    this.myChart.update();
    this.mapUpdate(this.properties[this.tableCurrentProp].name);
  }

  setUpLocalListeners() {
    getElement('main').addEventListener('click', (e) => {
      if (this.isNoData) { return; }
      if (!e.target.matches('.country-search')) {
        this.simpleKeyboard.classList.remove('show-keyboard');
      }
      if (e.target.matches('.fa-angle-right')) {
        this.nextProp();
        this.updateAllModules();
        return;
      }
      if (e.target.matches('.fa-angle-left')) {
        this.prevProp();
        this.updateAllModules();
        return;
      }
      if (e.target.matches('.period-check')) {
        getElements('.period-check').forEach((el) => {
          el.checked = this.isLastDay;
        });

        this.isLastDay = !this.isLastDay;
        this.properties = properties.filter((prop) => prop.isLastDay === this.isLastDay && prop.isPerPopulation === this.isPopulation);
        this.updateCovidInfoTable();
        this.updateAllModules();
        return;
      }
      if (e.target.matches('.population-check')) {
        getElements('.population-check').forEach((el) => {
          el.checked = this.isPopulation;
        });

        this.isPopulation = !this.isPopulation;
        this.properties = properties.filter((prop) => prop.isLastDay === this.isLastDay && prop.isPerPopulation === this.isPopulation);
        this.updateCovidInfoTable();
        this.updateAllModules();
      }
    });

    this.tableFilterInput.addEventListener('input', (e) => {
      if (this.isNoData) { return; }
      this.simpleKeyboard.classList.add('show-keyboard');
      this.keyboard.setInput(e.target.value);
    });
    this.tableFilterInput.addEventListener('focus', (e) => {
      if (this.isNoData) { return; }
      this.simpleKeyboard.classList.add('show-keyboard');
  /*
    this.tableButtonNext.addEventListener('click', () => {
      this.nextProp();
      this.showCollumnTable(this.properties[this.tableCurrentProp].name);
      this.mapUpdate(this.properties[this.tableCurrentProp].name);
    });
    this.tableButtonPrev.addEventListener('click', () => {
      this.prevProp();
      this.showCollumnTable(this.properties[this.tableCurrentProp].name);
      this.mapUpdate(this.properties[this.tableCurrentProp].name);
*/
    });

    this.covidInfoTableResize.addEventListener('click', () => {
      this.resizeWindowElements();
      this.covidInfoTableContainer.classList.toggle('fullsize-covid-info');
    });

    this.chartResize.addEventListener('click', () => {
      this.resizeWindowElements();
      this.chartContainer.classList.toggle('fullsize-chart');
    });

    this.mapResize.addEventListener('click', () => {
      this.resizeWindowElements();
      this.mapContainer.classList.toggle('fullsize-map');
      this.mapUpdate(this.properties[this.tableCurrentProp].name);
    });
    this.countryTableResize.addEventListener('click', () => {
      this.resizeWindowElements();
      this.container.classList.toggle('fullsize-country-table');
    });

    this.tableFilterInput.addEventListener('keyup', (e) => {
      this.filterTable(e.target.value);
    });
  }

  filterTable(input) {
    if (this.isNoData) { return; }
    const nameSpans = getElements('.cell-name');
    const searchString = input.toLowerCase();
    nameSpans.forEach((el) => {
      const span = el;
      if (span.textContent.toLowerCase().indexOf(searchString) !== -1) {
        span.closest('.table-row').classList.remove('row-hide');
      } else {
        span.closest('.table-row').classList.add('row-hide');
      }
    });
  }

  displayCovidInfoTable() {
    this.infoTableCasesHeader = elementFactory('div', { class: 'card_header' }, this.properties[0].header);
    this.infoTableCasesContent = elementFactory('div', { class: 'card_content' }, this.loadDataSmal);
    const casesCard = elementFactory('div', { class: 'covid-info-card' }, this.infoTableCasesHeader, this.infoTableCasesContent);

    this.infoTableDeathHeader = elementFactory('div', { class: 'card_header--death' }, this.properties[1].header);
    this.infoTableDeathContent = elementFactory('div', { class: 'card_content' }, this.loadDataSmal.cloneNode(true));
    const deathCard = elementFactory('div', { class: 'covid-info-card' }, this.infoTableDeathHeader, this.infoTableDeathContent);

    this.infoTableRecoveredHeader = elementFactory('div', { class: 'card_header--recovered' }, this.properties[2].header);
    this.infoTableRecoveredContent = elementFactory('div', { class: 'card_content' }, this.loadDataSmal.cloneNode(true));
    const recoveredCard = elementFactory('div', { class: 'covid-info-card' }, this.infoTableRecoveredHeader, this.infoTableRecoveredContent);

    this.infoTableHeader = elementFactory('div', { class: 'covid_info__header' }, 'Global Cases');
    const infoCardContainer = elementFactory('div', { class: 'info-card-container' }, casesCard, deathCard, recoveredCard);

    const periodInput = elementFactory('input', { type: 'checkbox', class: 'period-check', checked: true }, '');
    const periodSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Last day' }, '');
    const togglePeriodButton = elementFactory('label', { class: 'switch' }, periodInput, periodSlider);
    const periodSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Period:', togglePeriodButton);

    const populationInput = elementFactory('input', { type: 'checkbox', class: 'population-check', checked: true }, '');
    const populationSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Per 100k' }, '');
    const togglePopulationButton = elementFactory('label', { class: 'switch' }, populationInput, populationSlider);
    const populationSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Population:', togglePopulationButton);

    const controlGroup = elementFactory('div', { class: 'control-group' }, periodSwitchHeader, populationSwitchHeader);

    const resizeImg = elementFactory('img', { class: 'resize-img', src: 'assets/img/enlarge.svg', alt: 'resize-img' }, '');
    this.covidInfoTableResize = elementFactory('button', { class: 'resize-button' }, resizeImg);

    this.covidInfoTableContainer = elementFactory('div', { class: 'covid_info' }, this.covidInfoTableResize, this.infoTableHeader, controlGroup, infoCardContainer);

    this.infoChartContainer = elementFactory('div', { class: 'info-chart-container' }, this.covidInfoTableContainer);

    getElement('main').appendChild(this.infoChartContainer);
  }

  updateCovidInfoTable() {
    let data;
    if (this.selectedCountry) {
      data = this.model.data.CountriesInfo.find((item) => item.CountryCode === this.selectedCountry);
    } else {
      data = this.model.data.GlobalInfo;
    }
    this.drawCovidInfoTable(data);
  }

  drawCovidInfoTable(data) {
    clearElement(this.infoTableHeader);
    if (!data) {
      return;
    }
    if (data.Country) {
      const flag = elementFactory('img', { src: data.flag, class: 'flag-img' }, '');
      this.infoTableHeader.appendChild(flag);
    }
    const country = elementFactory('span', {}, '');
    country.textContent = data.Country || 'Global Cases';
    this.infoTableHeader.appendChild(country);

    const valueFormat = Intl.NumberFormat();

    this.infoTableCasesHeader.textContent = this.properties[0].header;
    this.infoTableCasesContent.textContent = data[this.properties[0].name] !== 0 ? valueFormat.format(data[this.properties[0].name]) : 'No record';

    this.infoTableDeathHeader.textContent = this.properties[1].header;
    this.infoTableDeathContent.textContent = data[this.properties[1].name] !== 0 ? valueFormat.format(data[this.properties[1].name]) : 'No record';

    this.infoTableRecoveredHeader.textContent = this.properties[2].header;
    this.infoTableRecoveredContent.textContent = data[this.properties[2].name] !== 0 ? valueFormat.format(data[this.properties[2].name]) : 'No record';
  }

  mapInit() {
    clearElement(this.map);
    this.map.classList.remove('data-load-box');
    const this_ = this;
    this.stylesOfCountries = [];
    const mapOptions = {
      center: [53, 28],
      zoom: 2,
      worldCopyJump: true,
      minZoom: 1,
      maxZoom: 5,
    };
    this.map = new L.map('map', mapOptions);
    this.layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    this.geojson = L.geoJson(cData, {
      style: style.bind(this),
      onEachFeature: onEachFeature.bind(this),
    }).addTo(this.map);
    function highlightFeature(e) {
      const layer = e.target;
      layer.setStyle({
        weight: 2,
        color: "#666",
        dashArray: "",
        fillOpacity: 1,
      });

      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
      }

      this.info.update(layer.feature.properties);
    }
    this.info = L.control();
    this.info.onAdd = function (map) {
      this._div = L.DomUtil.create("div", "info");
      this.update();
      return this._div;
    };

    this.info.update = function (props) {
      if (props) {
        const currentValue = this_.model.data.CountriesInfo.find((item) => item.CountryCode === props.iso_a2);
        if (currentValue) {
          this._div.innerHTML = `<h4>${props.formal_en}  [${props.iso_a2}]</h4>
          <h4>Total confirmed: ${currentValue.TotalConfirmed}</h4>`;
        }
      } else {
        this._div.innerHTML = '';
      }
    };

    this.info.addTo(this.map);
    function onEachFeature(feature, layer) {
      layer.on({
        mouseover: highlightFeature.bind(this),
        mouseout: resetHighlight.bind(this),
        click: zoomToFeature.bind(this),
      });
    }

    function zoomToFeature(e) {
      console.log(e.target);
      this.map.fitBounds(e.target.getBounds());
    }

    function getColor(d) {
      const maxValue = 17000000;
      if (d > maxValue * 0.5) {
        return '#800000';
      } else if (d > maxValue * 0.2) {
        return '#990000';
      } else if (d > maxValue * 0.1) {
        return '#ff1a1a';
      } else if (d > maxValue * 0.001) {
        return '#ff6666';
      } else {
        return '#ffb3b3';
      }
    }

    function style(feature) {
      const cC = _.find(this_.model.data.CountriesInfo, ['CountryCode', feature.properties.iso_a2]);
      const prop = this_.properties[0].name;
      let value = 10;
      if (cC) {
        value = cC[prop];
      }
      const styleObj = {
        weight: 2,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity: 1,
        fillColor: getColor(value),
      };
      this_.stylesOfCountries.push(styleObj);
      return styleObj;
    }

    function resetHighlight(e) {
      this.geojson.resetStyle(e.target);
      this.info.update();
    }

    this.map.addLayer(this.layer);

    this.geojson.addEventListener('click', (event) => {
      const countryCodeResponse = this_.getCountryCodeBameByCoords(event.latlng.lat, event.latlng.lng);
      countryCodeResponse.then((code) => {
        if (code) {
          this_.selectedCountry = code;
          this_.updateCovidInfoTable();
        }
      });
    });

    /* ---legend--- */
    this.legend = L.control({ position: 'bottomright' });
    this.legend.onAdd = function (map) {
      this.div = L.DomUtil.create('div', 'info legend');
      const grades = [0, 1000, 100000, 1000000, 10000000];
      const labels = [];
      for (let i = 0; i < grades.length; i += 1) {
        this.div.innerHTML += '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
      }
      return this.div;
    };
    this.legend.addTo(this.map);
  }

  mapUpdate(currentPropOfData) {
    // this.map.setView([53, 23], 4);
    const this_ = this;
    this.currentDataForDisplay = this.model.data.CountriesInfo.map((item) => item[currentPropOfData]);
    const maxValue = Math.max(...this.currentDataForDisplay);
    this.stylesOfCountries.forEach((item) => this.geojson.removeLayer(item));

    this.geojson = L.geoJson(cData, {
      style: style.bind(this),
      onEachFeature: onEachFeature.bind(this),
    }).addTo(this.map);

    function style(feature) {
      const currentCountry = _.find(this_.model.data.CountriesInfo, ['CountryCode', feature.properties.iso_a2]);
      const prop = this_.properties[0].name;
      let value = 10;
      if (currentCountry) {
        value = currentCountry[currentPropOfData];
      }
      const styleObj = {
        weight: 2,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity: 1,
        fillColor: getColor(value),
      };

      this_.stylesOfCountries.push(styleObj);
      return styleObj;
    }

    function getColor(d) {
      if (d > maxValue * 0.5) {
        return '#800000';
      } else if (d > maxValue * 0.2) {
        return '#990000';
      } else if (d > maxValue * 0.1) {
        return '#ff1a1a';
      } else if (d > maxValue * 0.001) {
        return '#ff6666';
      } else {
        return '#ffb3b3';
      }
    }

    function onEachFeature(feature, layer) {
      layer.on({
        mouseover: highlightFeature.bind(this),
        mouseout: resetHighlight.bind(this),
        click: zoomToFeature.bind(this),
      });
    }

    function zoomToFeature(e) {
      this.map.fitBounds(e.target.getBounds());
    }
    function highlightFeature(e) {
      const layer = e.target;
      layer.setStyle({
        weight: 2,
        color: "#666",
        dashArray: "",
        fillOpacity: 1,
      });

      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
      }

      this_.info.update(layer.feature.properties);
    }
    function resetHighlight(e) {
      this_.geojson.resetStyle(e.target);
      this_.info.update();
    }
    /* ---create additional info container--- */

    this.info.update = function (props) {
      if (props) {
        const currentValue = this_.model.data.CountriesInfo.find((item) => item.CountryCode === props.iso_a2);
        if (currentValue) {
          const currentProperties = this_.properties.find((item) => item.name === currentPropOfData);
          this._div.innerHTML = `<h4>${props.formal_en}  [${props.iso_a2}]</h4>
          <h4>${currentProperties.header}: ${currentValue[currentPropOfData]}</h4>`;
        }
      } else {
        this._div.innerHTML = '';
      }
    };

    this.geojson.addEventListener('click', (event) => {
      const countryCodeResponse = this_.getCountryCodeBameByCoords(event.latlng.lat, event.latlng.lng);
      countryCodeResponse.then((code) => {
        if (code) {
          this_.selectedCountry = code;
          this_.updateCovidInfoTable();
        }
      });
    });
    /* ---legend--- */

    this.legend.onAdd = function (map) {
      const grades = [0, (maxValue * 0.001).toFixed(3), (maxValue * 0.1).toFixed(3), (maxValue * 0.2).toFixed(3), (maxValue * 0.5).toFixed(3)];
      this.div.innerHTML = '';
      for (let i = 0; i < grades.length; i += 1) {
        this.div.innerHTML += '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
      }
      return this.div;
    };
    this.legend.addTo(this.map);
  }

  moveTheMap(countryCode) {
    const countriesInfo = Object.values(this.geojson._layers);
    const currentCountryInfo = countriesInfo.find((countryInfo) => countryInfo.feature.properties.iso_a2 === countryCode);
    if (currentCountryInfo) {
      this.map.fitBounds(currentCountryInfo.getBounds());
    }
  }

  async getCountryCodeBameByCoords(lt, lg) {
    async function reverseGeocoding(lat, log) {
      try {
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${log}&key=99ecf60eb3944fd69770b5c974614a6a&language=en`;
        const res = await fetch(url);
        const data = await res.json();
        return data;
      } catch (err) {
        alert('Something went wrong');
      }
      return data;
    }

    const response = reverseGeocoding(lt, lg);
    let code;
    await response.then((data) => {
      if (data.results[0].components.country_code) {
        code = data.results[0].components.country_code.toUpperCase();
        // alert(`${data.results[0].components.country} --> ${data.results[0].components.country_code}`);
        this.emit('updatedata', data.results[0].components.country);
      } else {
        code = null;
        alert('Results not found');
      }
    });

    return code;
  }

  displayNoData() {
    clearElement(this.table);
    clearElement(this.map);
    clearElement(this.chartContainer);
    clearElement(this.infoTableCasesContent);
    clearElement(this.infoTableDeathContent);
    clearElement(this.infoTableRecoveredContent);

    this.table.appendChild(this.noData);
    this.map.appendChild(this.noData.cloneNode(true));
    this.chartContainer.appendChild(this.noData.cloneNode(true));

    this.infoTableCasesContent.appendChild(this.noDataSmal);
    this.infoTableDeathContent.appendChild(this.noDataSmal.cloneNode(true));
    this.infoTableRecoveredContent.appendChild(this.noDataSmal.cloneNode(true));
  }

  createDataStatus() {
    const loadDataImg = elementFactory('img', { class: 'load-data-img', src: 'assets/img/loading.svg' }, '');
    this.loadData = elementFactory('div', { class: 'data-status' }, loadDataImg);

    const loadDataImgSmal = elementFactory('img', { class: 'load-data-img data-img-s', src: 'assets/img/loading.svg' }, '');
    this.loadDataSmal = elementFactory('div', { class: 'data-status' }, loadDataImgSmal);

    const noData = elementFactory('img', { class: 'no-data-img', src: 'assets/img/empty.svg' }, 'No data');
    this.noData = elementFactory('div', { class: 'data-status' }, noData, 'No data');

    const noDataSmal = elementFactory('img', { class: 'no-data-img data-img-s', src: 'assets/img/empty.svg' }, 'No data');
    this.noDataSmal = elementFactory('div', { class: 'data-status' }, noDataSmal, 'No data');
  }
}
