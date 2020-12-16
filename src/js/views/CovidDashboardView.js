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
