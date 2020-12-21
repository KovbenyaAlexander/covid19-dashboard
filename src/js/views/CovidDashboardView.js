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

    this.properties = properties;
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

    this.periodInput = elementFactory('input', { type: 'checkbox', checked: true }, '');
    const periodSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Last day' }, '');
    this.togglePeriodButton = elementFactory('label', { class: 'switch' }, this.periodInput, periodSlider);
    const periodSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Period: ', this.togglePeriodButton);

    this.populationInput = elementFactory('input', { type: 'checkbox', checked: true }, '');
    const populationSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Per 100k' }, '');
    this.togglePopulationButton = elementFactory('label', { class: 'switch' }, this.populationInput, populationSlider);
    const populationSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Population: ', this.togglePopulationButton);

    const controlGroup = elementFactory('div', { class: 'control-group' }, periodSwitchHeader, populationSwitchHeader);

    this.table = elementFactory('div', { class: 'country-table' }, '');

    const header = elementFactory('div', { class: 'country-container-header' }, 'Cases by Counry/Region/Province');

    this.container = elementFactory('div', { class: 'country-table-container' }, header, controlGroup, searchGroup, tableControl, this.table);

    this.tableMapContainer = elementFactory('div', { class: 'table-map-wrapper' }, this.container);
    getElement('main').appendChild(this.tableMapContainer);
  }

  createMapContainer() {
    const rightArrow = elementFactory('i', { class: 'fas fa-angle-right' }, '');
    const leftArrow = elementFactory('i', { class: 'fas fa-angle-left' }, '');
    this.mapButtonPrev = elementFactory('button', { class: 'arrow-button' }, leftArrow);
    this.mapButtonNext = elementFactory('button', { class: 'arrow-button' }, rightArrow);

    this.mapHeader = elementFactory('div', { class: 'map-header' }, properties[0].header);

    const mapControl = elementFactory('div', { class: 'map-control' }, this.mapButtonPrev, this.mapHeader, this.mapButtonNext);

    const periodInput = elementFactory('input', { type: 'checkbox', checked: true }, '');
    const periodSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Last day' }, '');
    const togglePeriodButton = elementFactory('label', { class: 'switch' }, periodInput, periodSlider);
    const periodSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Period:', togglePeriodButton);

    const populationInput = elementFactory('input', { type: 'checkbox', checked: true }, '');
    const populationSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Per 100k' }, '');
    const togglePopulationButton = elementFactory('label', { class: 'switch' }, populationInput, populationSlider);
    const populationSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Population:', togglePopulationButton);

    const controlGroup = elementFactory('div', { class: 'control-group' }, periodSwitchHeader, populationSwitchHeader);

    this.map = elementFactory('div', { class: 'map-block', id: 'map' }, '');
    const mapContainerHeader = elementFactory('div', { class: 'map-container-header' }, 'World map');
    const mapContainer = elementFactory('div', { class: 'map-container' }, mapContainerHeader, controlGroup, mapControl, this.map);

    this.tableMapContainer.appendChild(mapContainer);
  }

  resizeWindowElements() {
    this.chartContainer.classList.toggle('hide-container');
    this.tableMapContainer.classList.toggle('hide-container');
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
        // alert(`${country.Country} || ${country.CountryCode}`);
        this.selectedCountry = country.CountryCode;
        this.updateCovidInfoTable();
        this.emit('updatedata', country.Country);
        setTimeout(() => {
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
        }, 1000);
      };

      rows.push(row);
    });
    rows.forEach((row) => {
      this.table.appendChild(row);
    });
    this.sortTable();
    this.properties = properties.filter((prop) => prop.isLastDay === this.isLastDay && prop.isPerPopulation === this.isPopulation);
  }

  createChartContainer() {
    const canvas = elementFactory('canvas', { id: 'chart', style: 'width: 2; height: 1' }, '');
    this.chartTitle = elementFactory('div', { class: 'chart_title' }, this.properties[0].header);
    const rightArrow = elementFactory('i', { class: 'fas fa-angle-right' }, '');
    const leftArrow = elementFactory('i', { class: 'fas fa-angle-left' }, '');

    this.chartButtonPrev = elementFactory('button', { class: 'arrow-button' }, leftArrow);
    this.chartButtonNext = elementFactory('button', { class: 'arrow-button' }, rightArrow);

    const periodInput = elementFactory('input', { type: 'checkbox', checked: true }, '');
    const periodSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Last day' }, '');
    const togglePeriodButton = elementFactory('label', { class: 'switch' }, periodInput, periodSlider);
    const periodSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Period:', togglePeriodButton);

    const populationInput = elementFactory('input', { type: 'checkbox', checked: true }, '');
    const populationSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Per 100k' }, '');
    const togglePopulationButton = elementFactory('label', { class: 'switch' }, populationInput, populationSlider);
    const populationSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Population:', togglePopulationButton);

    const controlGroup = elementFactory('div', { class: 'control-group' }, periodSwitchHeader, populationSwitchHeader);

    const chartTitleContainer = elementFactory('div', { class: 'chart_title_container' }, this.chartButtonPrev, this.chartTitle, this.chartButtonNext);

    this.chartContainer = elementFactory('div', { class: 'chart_container' }, canvas, chartTitleContainer);

    getElement('main').appendChild(this.chartContainer);
  }

  // eslint-disable-next-line class-methods-use-this
  displayChart() {
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

  setUpLocalListeners() {
    this.covidInfoTableResize.addEventListener('click', () => {
      this.resizeWindowElements();
    });

    this.tableButtonNext.addEventListener('click', () => {
      this.nextProp();
      this.showCollumnTable(this.properties[this.tableCurrentProp].name);
    });
    this.tableButtonPrev.addEventListener('click', () => {
      this.prevProp();
      this.showCollumnTable(this.properties[this.tableCurrentProp].name);
    });

    this.chartButtonNext.addEventListener('click', () => {
      this.nextProp();
      const key = Object.keys(this.aroundTheWorldCases)[this.tableCurrentProp];
      this.myChart.data.datasets[0].label = this.properties[this.tableCurrentProp].header;
      this.myChart.data.datasets[0].data = this.aroundTheWorldCases[key];
      this.chartTitle.textContent = this.properties[this.tableCurrentProp].header;
      this.myChart.update();
    });

    this.chartButtonPrev.addEventListener('click', () => {
      this.prevProp();
      const key = Object.keys(this.aroundTheWorldCases)[this.tableCurrentProp];
      this.myChart.data.datasets[0].label = this.properties[this.tableCurrentProp].header;
      this.myChart.data.datasets[0].data = this.aroundTheWorldCases[key];
      this.chartTitle.textContent = this.properties[this.tableCurrentProp].header;
      this.myChart.update();
    });

    this.periodInput.addEventListener('change', () => {
      this.isLastDay = !this.isLastDay;
      this.properties = properties.filter((prop) => prop.isLastDay === this.isLastDay && prop.isPerPopulation === this.isPopulation);
      this.showCollumnTable(this.properties[this.tableCurrentProp].name);
      this.updateCovidInfoTable();
      this.mapUpdate(this.properties[this.tableCurrentProp].name);
    });
    this.populationInput.addEventListener('change', () => {
      this.isPopulation = !this.isPopulation;
      this.properties = properties.filter((prop) => prop.isLastDay === this.isLastDay && prop.isPerPopulation === this.isPopulation);
      this.showCollumnTable(this.properties[this.tableCurrentProp].name);
      this.updateCovidInfoTable();
      this.mapUpdate(this.properties[this.tableCurrentProp].name);
    });

    this.tableFilterInput.addEventListener('keyup', (e) => {
      const nameSpans = getElements('.cell-name');
      const searchString = e.target.value.toLowerCase();
      nameSpans.forEach((el) => {
        const span = el;
        if (span.textContent.toLowerCase().indexOf(searchString) !== -1) {
          span.closest('.table-row').classList.remove('row-hide');
        } else {
          span.closest('.table-row').classList.add('row-hide');
        }
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  displayCovidInfoTable() {
    this.infoTableCasesHeader = elementFactory('div', { class: 'card_header' }, this.properties[0].header);
    this.infoTableCasesContent = elementFactory('div', { class: 'card_content' }, 'No data');
    const casesCard = elementFactory('div', { class: 'covid-info-card' }, this.infoTableCasesHeader, this.infoTableCasesContent);

    this.infoTableDeathHeader = elementFactory('div', { class: 'card_header--death' }, this.properties[1].header);
    this.infoTableDeathContent = elementFactory('div', { class: 'card_content' }, 'No data');
    const deathCard = elementFactory('div', { class: 'covid-info-card' }, this.infoTableDeathHeader, this.infoTableDeathContent);

    this.infoTableRecoveredHeader = elementFactory('div', { class: 'card_header--recovered' }, this.properties[2].header);
    this.infoTableRecoveredContent = elementFactory('div', { class: 'card_content' }, 'No data');
    const recoveredCard = elementFactory('div', { class: 'covid-info-card' }, this.infoTableRecoveredHeader, this.infoTableRecoveredContent);

    this.infoTableHeader = elementFactory('div', { class: 'covid_info__header' }, 'Global Cases');
    const infoCardContainer = elementFactory('div', { class: 'info-card-container' }, casesCard, deathCard, recoveredCard);

    const periodInput = elementFactory('input', { type: 'checkbox', checked: true }, '');
    const periodSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Last day' }, '');
    const togglePeriodButton = elementFactory('label', { class: 'switch' }, periodInput, periodSlider);
    const periodSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Period:', togglePeriodButton);

    const populationInput = elementFactory('input', { type: 'checkbox', checked: true }, '');
    const populationSlider = elementFactory('span', { class: 'slider round', 'data-on': 'Total', 'data-off': 'Per 100k' }, '');
    const togglePopulationButton = elementFactory('label', { class: 'switch' }, populationInput, populationSlider);
    const populationSwitchHeader = elementFactory('span', { class: 'control-header' }, 'Population:', togglePopulationButton);

    const controlGroup = elementFactory('div', { class: 'control-group' }, periodSwitchHeader, populationSwitchHeader);

    this.covidInfoTableResize = elementFactory('button', { class: 'resize-button' }, 'clickme');

    // const tableHeaderCountOfRecovered = elementFactory('th', {});
    // tableHeaderCountOfRecovered.innerText = this.properties[0].header;
    // const tableHeaderCountOfDeath = elementFactory('th', {});
    // tableHeaderCountOfDeath.innerText = this.properties[1].header;
    // const tableHeaderCountOfDesease = elementFactory('th', {});
    // tableHeaderCountOfDesease.innerText = this.properties[2].header;
    // const tableHeader = elementFactory('tr', {}, tableHeaderCountOfDesease, tableHeaderCountOfDeath, tableHeaderCountOfRecovered);

    // const tableContentCountOfRecovered = elementFactory('td', { class: 'covid_info__CountOfRecovered' });
    // const tableContentCountOfDeath = elementFactory('td', { class: 'covid_info__CountOfDeath' });
    // const tableContentCountOfDesease = elementFactory('td', { class: 'covid_info__CountOfDesease' });
    // const tableContent = elementFactory('tr', {}, tableContentCountOfDesease, tableContentCountOfDeath, tableContentCountOfRecovered);

    // const table = elementFactory('table', { class: 'covid_info__table' }, tableHeader, tableContent);
    const container = elementFactory('div', { class: 'covid_info' }, this.covidInfoTableResize, this.infoTableHeader, controlGroup, infoCardContainer);
    getElement('main').appendChild(container);
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
    // const countOfDesease = document.querySelector('.covid_info__CountOfDesease');
    // const countOfDeath = document.querySelector('.covid_info__CountOfDeath');
    // const countOfRecovered = document.querySelector('.covid_info__CountOfRecovered');
    clearElement(this.infoTableHeader);
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

    // countOfDesease.innerText = data[this.properties[0].name];
    // countOfDeath.innerText = data[this.properties[1].name];
    // countOfRecovered.innerText = data[this.properties[2].name];
  }

  mapInit() {
    const o = this;
    // eslint-disable-next-line no-console
    console.log('+');
    // eslint-disable-next-line no-console
    console.log(cData);

    const mapOptions = {
      center: [53, 28],
      zoom: 2,
      worldCopyJump: true,
      minZoom: 2,
      maxZoom: 5,
    };
    this.currentMarkers = [];
    this.map = new L.map('map', mapOptions);
    this.layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    this.model.data.CountriesInfo.forEach((countryInfo) => {
      const circleCenter = [countryInfo.lat, countryInfo.lng];
      const circleOptions = {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
      };
      const circleSizeCoefficient = 7;
      const circle = L.circle(circleCenter, countryInfo[properties[0].name] / circleSizeCoefficient, circleOptions);
      this.currentMarkers.push(circle);
      circle.addTo(this.map);
    });
    this.layerGroup = L.layerGroup(this.currentMarkers);
    this.layerGroup.addTo(this.map);
    this.map.addEventListener('click', (event) => {
      const countryCodeResponse = this.getCountryCodeBameByCoords(event.latlng.lat, event.latlng.lng);
      countryCodeResponse.then((code) => {
        if (code) {
          //-------------------------------------
          this.selectedCountry = code;
          this.updateCovidInfoTable();
        }
      });
    });
    this.layerGroup.addTo(this.map);
    this.geojson = L.geoJson(cData, {
      style,
      onEachFeature: onEachFeature.bind(this),
    }).addTo(this.map);
    function highlightFeature(e) {
      var layer = e.target;
      layer.setStyle({
        weight: 2,
        color: "#666",
        dashArray: "",
        fillOpacity: 0.7,
      });

      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
      }

      info.update(layer.feature.properties);
    }
    var info = L.control();
    info.onAdd = function (map) {
      this._div = L.DomUtil.create("div", "info");
      this.update();
      return this._div;
    };

    info.update = function (props) {
      this._div.innerHTML = '<h4>Information</h4>'
        + (props
          ? '<b>' + props.formal_en + '</b><br />' + props.iso_a2 + ' -CODE'
          : 'Hover over ountry');
    };

    info.addTo(this.map);
    function onEachFeature(feature, layer) {
      layer.on({
        mouseover: highlightFeature.bind(this),
        mouseout: resetHighlight.bind(this),
        click: zoomToFeature.bind(this),
      });
    }

    function zoomToFeature(e) {
      // eslint-disable-next-line no-console
      console.log(e.target);
      this.map.fitBounds(e.target.getBounds());
    }

    function getColor(d) {
      return d > 1000
        ? "#800026"
        : d > 500
          ? "#BD0026"
          : d > 200
            ? "#E31A1C"
            : d > 100
              ? "#FC4E2A"
              : d > 50
                ? "#FD8D3C"
                : d > 20
                  ? "#FEB24C"
                  : d > 10
                    ? '#FED976'
                    : '#FFEDA0';
    }

    function style(feature) {
      return {
        weight: 2,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity: 0.7,
        fillColor: getColor(feature.properties.density),
      };
    }

    function resetHighlight(e) {
      this.geojson.resetStyle(e.target);
      info.update();
    }

    this.map.addLayer(this.layer);
  }

  mapUpdate(currentPropOfData) {
    this.currentMarkers.forEach((item) => this.layerGroup.removeLayer(item));
    this.currentMarkers = [];
    this.model.data.CountriesInfo.forEach((countryInfo) => {
      const circleCenter = [countryInfo.lat, countryInfo.lng];
      const circleOptions = {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
      };
      let circleSizeCoefficient = 0.1;
      // eslint-disable-next-line no-console
      console.log(currentPropOfData);
      if (currentPropOfData === 'TotalConfirmed') {
        circleSizeCoefficient = 7;
      } else if (currentPropOfData === 'totalConfirmedPer100k') {
        circleSizeCoefficient = 0.03;
      } else if (currentPropOfData === 'newConfirmedPer100k') {
        circleSizeCoefficient = 0.0005;
      }
      const circle = L.circle(circleCenter, countryInfo[currentPropOfData] / circleSizeCoefficient, circleOptions);
      this.currentMarkers.push(circle);
    });
    this.layerGroup = L.layerGroup(this.currentMarkers);
  }

  async getCountryCodeBameByCoords(lt, lg) {
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
    let code;
    await response.then((data) => {
      if (data.results[0].components.country_code) {
        code = data.results[0].components.country_code.toUpperCase();
        alert(`${data.results[0].components.country} --> ${data.results[0].components.country_code}`);
      } else {
        code = null;
        alert('Results not found');
      }
    });

    return code;
  }
}
