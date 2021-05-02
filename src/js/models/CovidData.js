/* eslint-disable*/

import EventEmitter from "./EventEmitter";
import mockTimeline from "../../mockData/timeline";

const _ = require("lodash");

export default class CovidDate extends EventEmitter {
  constructor() {
    super();
    this.data = [];
    this.init();
    this.chartData = [];
  }

  init() {
    const allData = Promise.all([
      this.fetchData("https://api.covid19api.com/summary"),
      this.fetchData(
        "https://restcountries.eu/rest/v2/all?fields=name;population;flag;alpha2Code;latlng"
      ),
      this.fetchData("https://covid19-api.org/api/timeline"),
    ]).then((responses) => {
      const [globalInfo, summaryInfo, additionalInfo, timeline] = [
        responses[0].Global,
        responses[0].Countries,
        responses[1],
        responses[2],
      ];
      const EARTH_POPULATION = 7600000000;
      const data = {};
      if (summaryInfo) {
        summaryInfo.forEach((summaryCountry) => {
          const additionalInfoForCurrentCountry = additionalInfo.find(
            (country) => country.alpha2Code === summaryCountry.CountryCode
          );
          summaryCountry.population =
            additionalInfoForCurrentCountry.population;
          summaryCountry.flag = additionalInfoForCurrentCountry.flag;
          summaryCountry.totalDeathPer100k = Number(
            (
              (summaryCountry.TotalDeaths / summaryCountry.population) *
              100000
            ).toFixed(5)
          );
          summaryCountry.totalRecoveredPer100k = Number(
            (
              (summaryCountry.TotalRecovered / summaryCountry.population) *
              100000
            ).toFixed(5)
          );
          summaryCountry.totalConfirmedPer100k = Number(
            (
              (summaryCountry.TotalConfirmed / summaryCountry.population) *
              100000
            ).toFixed(5)
          );
          summaryCountry.newDeathPer100k = Number(
            (
              (summaryCountry.NewDeaths / summaryCountry.population) *
              100000
            ).toFixed(5)
          );
          summaryCountry.newRecoveredPer100k = Number(
            (
              (summaryCountry.NewRecovered / summaryCountry.population) *
              100000
            ).toFixed(5)
          );
          summaryCountry.newConfirmedPer100k = Number(
            (
              (summaryCountry.NewConfirmed / summaryCountry.population) *
              100000
            ).toFixed(5)
          );
          [
            summaryCountry.lat,
            summaryCountry.lng,
          ] = additionalInfoForCurrentCountry.latlng;
        });
        if (timeline) {
          data.timeline = timeline;
        } else {
          data.timeline = mockTimeline;
        }

        data.GlobalInfo = globalInfo;
        data.CountriesInfo = summaryInfo;
        data.GlobalInfo.earth_population = EARTH_POPULATION;
        data.GlobalInfo.totalDeathPer100k = Number(
          ((data.GlobalInfo.TotalDeaths / EARTH_POPULATION) * 100000).toFixed(5)
        );
        data.GlobalInfo.totalRecoveredPer100k = Number(
          (
            (data.GlobalInfo.TotalRecovered / EARTH_POPULATION) *
            100000
          ).toFixed(5)
        );
        data.GlobalInfo.totalConfirmedPer100k = Number(
          (
            (data.GlobalInfo.TotalConfirmed / EARTH_POPULATION) *
            100000
          ).toFixed(5)
        );
        data.GlobalInfo.newDeathPer100k = Number(
          ((data.GlobalInfo.NewDeaths / EARTH_POPULATION) * 100000).toFixed(5)
        );
        data.GlobalInfo.newRecoveredPer100k = Number(
          ((data.GlobalInfo.NewRecovered / EARTH_POPULATION) * 100000).toFixed(
            5
          )
        );
        data.GlobalInfo.newConfirmedPer100k = Number(
          ((data.GlobalInfo.NewConfirmed / EARTH_POPULATION) * 100000).toFixed(
            5
          )
        );
        return data;
      }
    });
    allData.then((data) => {
      if (!data) {
        this.emit("hasnodata");
        return;
      }
      this.data = data;
      this.emit("hasdata");
    });
  }

  getDataByCountryName(name) {
    const countryData = this.fetchData(
      `https://api.covid19api.com/total/dayone/country/${name}`
    );
    countryData.then((data) => {
      this.chartData = data;
      this.emit("hascountrydata");
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async fetchData(apiUrl) {
    try {
      const url = apiUrl;
      const res = await fetch(url);
      const data = await res.json();
      return data;
    } catch (err) {
      // this.emit("hasnodata");
    }
  }

  сountriesInfoSort(value) {
    this.data.CountriesInfo = _.orderBy(
      this.data.CountriesInfo,
      [value],
      ["desc"]
    );
  }
}
