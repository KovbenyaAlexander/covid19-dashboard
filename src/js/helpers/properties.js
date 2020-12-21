const properties = [
  {
    name: 'TotalConfirmed', header: 'Total confirmed', isLastDay: false, isPerPopulation: false, isChart: true,
  },
  {
    name: 'TotalDeaths', header: 'Total deaths', isLastDay: false, isPerPopulation: false, isChart: true,
  },
  {
    name: 'TotalRecovered', header: 'Total recovered', isLastDay: false, isPerPopulation: false, isChart: true,
  },
  {
    name: 'NewConfirmed', header: 'Last day confirmed', isLastDay: true, isPerPopulation: false, isChart: false,
  },
  {
    name: 'NewDeaths', header: 'Last day deaths', isLastDay: true, isPerPopulation: false, isChart: false,
  },
  {
    name: 'NewRecovered', header: 'Last day recovered', isLastDay: true, isPerPopulation: false, isChart: false,
  },
  {
    name: 'newConfirmedPer100k', header: 'Last day confirmed per 100k', isLastDay: true, isPerPopulation: true, isChart: false,
  },
  {
    name: 'newDeathPer100k', header: 'Last day deaths per 100k', isLastDay: true, isPerPopulation: true, isChart: false,
  },
  {
    name: 'newRecoveredPer100k', header: 'Last day recovered per 100k', isLastDay: true, isPerPopulation: true, isChart: false,
  },
  {
    name: 'totalConfirmedPer100k', header: 'Total confirmed per 100k', isLastDay: false, isPerPopulation: true, isChart: true,
  },
  {
    name: 'totalDeathPer100k', header: 'Total deaths per 100k', isLastDay: false, isPerPopulation: true, isChart: true,
  },
  {
    name: 'totalRecoveredPer100k', header: 'Total recovered per 100k', isLastDay: false, isPerPopulation: true, isChart: true,
  },
];

export default properties;
