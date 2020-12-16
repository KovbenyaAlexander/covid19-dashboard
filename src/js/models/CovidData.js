import EventEmitter from './EventEmitter';

const _ = require('lodash');

export default class CovidDate extends EventEmitter {
  constructor() {
    super();
    this.data = [];
    this.init();
  }

  init() {
    const allData = Promise.all([this.fetchData('https://api.covid19api.com/summary'),
      this.fetchData('https://restcountries.eu/rest/v2/all?fields=name;population;flag;alpha2Code')]).then((responses) => {
      const [globalInfo, summaryInfo, additionalInfo] = [responses[0].Global,
        responses[0].Countries,
        responses[1]];
      const data = {};
      summaryInfo.forEach((summaryCountry) => {
        // eslint-disable-next-line max-len
        const additionalInfoForCurrentCountry = additionalInfo.find((country) => country.alpha2Code === summaryCountry.CountryCode);
        // eslint-disable-next-line no-param-reassign
        summaryCountry.population = additionalInfoForCurrentCountry.population;
        // eslint-disable-next-line no-param-reassign
        summaryCountry.flag = additionalInfoForCurrentCountry.flag;
      });
      data.GlobalInfo = globalInfo;
      data.CountriesInfo = summaryInfo;
      return data;
    });
    allData.then((data) => {
      this.data = data;
      this.emit('hasdata');
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async fetchData(apiUrl) {
    const url = apiUrl;
    const res = await fetch(url);
    const data = await res.json();
    return data;
  }

  log() {
    console.log(this.data);
  }

  сountriesInfoSort(value) {
    this.data.CountriesInfo = _.orderBy(this.data.CountriesInfo, [value], ['desc']);
  }
}
