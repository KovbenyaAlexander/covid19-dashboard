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
        alert(`${country.Country} || ${country.CountryCode}`);
        this.selectedCountry = country.CountryCode;
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
      data = this.model.data.CountriesInfo.find((item) => item.CountryCode === this.selectedCountry);
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
    const this_ = this;
    this.stylesOfCountries = [];
    const mapOptions = {
      center: [53, 28],
      zoom: 2,
      worldCopyJump: true,
      minZoom: 2,
      maxZoom: 5,
    };
    this.map = new L.map('map', mapOptions);
    this.layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    this.geojson = L.geoJson(cData, {
      style: style.bind(this),
      onEachFeature: onEachFeature.bind(this),
    }).addTo(this.map);
    function highlightFeature(e) {
      var layer = e.target;
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
          const currentProperties = this_.properties.find((item) => item.name === currentPropOfData);
          this._div.innerHTML = `<h4>${props.formal_en}  [${props.iso_a2}]</h4>
          <h4>${currentProperties.header}: ${currentValue[currentPropOfData]}</h4>`;
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
      this.map.fitBounds(e.target.getBounds());
    }

    function getColor(d) {
      return d > 10000000
        ? "#9C0000"
        : d > 1000000
          ? "#FF3939"
          : d > 100000
            ? "#F6A6A6"
            : d > 1000
              ? "#F5D1D1"
              : '#F1E8E8';
    }

    function style(feature) {
      const cC = _.find(this_.model.data.CountriesInfo, ['CountryCode', feature.properties.iso_a2]);
      /* const prop = this_.properties[this_.tableCurrentProp].name; */
      const prop = this_.properties[0].name;
      let value = 10;
      if (cC) {
        value = cC[prop];
      }
      /* console.log(value); */
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
      console.log(event);
      const countryCodeResponse = this_.getCountryCodeBameByCoords(event.latlng.lat, event.latlng.lng);
      countryCodeResponse.then((code) => {
        if (code) {
          this_.selectedCountry = code;
          this_.updateCovidInfoTable();
        }
      });
    });
  }

  mapUpdate(currentPropOfData) {
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
      /* const prop = this_.properties[this_.tableCurrentProp].name; */
      // console.log(currentCountry);
      const prop = this_.properties[0].name;
      let value = 10;
      if (currentCountry) {
        value = currentCountry[currentPropOfData];
        // console.log(value);
      }
      /* console.log(value); */
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
      if (d > maxValue * 0.8) {
        return '#4d0000';
      } else if (d > maxValue * 0.6) {
        return '#800000';
      } else if (d > maxValue * 0.5) {
        return '#b30000';
      } else if (d > maxValue * 0.4) {
        return '#e60000';
      } else if (d > maxValue * 0.3) {
        return '#ff1a1a';
      } else if (d > maxValue * 0.2) {
        return '#ff4d4d';
      } else if (d > maxValue * 0.1) {
        return '#ff8080';
      } else {
        return '#ffcccc';
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
      var layer = e.target;
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
