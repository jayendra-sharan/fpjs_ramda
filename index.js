const R = require('ramda');
const cities = require('./cities.json');
const percentile = require('./percentile');

/*
 * 1. Temperature conversion using map & curry.
 */
const KtoC = k => k - 273.15;
const KtoF = k => k * 9 / 5 - 459.67;

const updateTemperature = R.curry((convertFn, city) => {
  const temp = Math.round(convertFn(city.temp));
  return R.merge(city, {
    temp
  });
});

const updatedCities = R.map(updateTemperature(KtoC), cities);
// console.log(updatedCities);

const city = cities[0];
const updatedCity = updateTemperature(KtoF, city);
// console.log(updatedCity);

/*
 * 2. Average cost using reduce & length
 */
const totalCostReducer = (acc, city) => {
  const { cost = 0 } = city;
  return acc + cost;
}

const totalCost = R.reduce(totalCostReducer, 0, updatedCities);
const cityCount = R.length(updatedCities);

// console.log(totalCost / cityCount);


/*
 * 3. Group by property using reduce
 */
const groupedByPropReducer = (acc, city) => {
  const { cost = [], internetSpeed = [] } = acc;
  return R.merge(acc, {
    cost: R.append(city.cost, cost),
    internetSpeed: R.append(city.internetSpeed, internetSpeed)
  });
};

const groupedByProp = R.reduce(groupedByPropReducer, {}, updatedCities);

// console.log(groupedByProp);

/*
 * 4. Score each city using map
 */

const calcScore = city => {
  const { cost = 0, internetSpeed = 0 } = city;
  const costPercentile = percentile(groupedByProp.cost, cost);
  const internetSpeedPercentile = percentile(
    groupedByProp.internetSpeed,
    internetSpeed
  );
  
  const score = 
    Math.round(100 * (1 - costPercentile) +
    20 * internetSpeedPercentile);

  return R.merge(city, { score });

}

const scoredCities = R.map(calcScore, updatedCities);

// console.log(scoredCities);

/**
 * 5. Filter city using filter
 */

const filterByWeather = city => {
  const { temp = 0, humidity = 0 } = city;
  return (temp > 68 && temp < 85) || (humidity > 30 && humidity < 70);
}

const filteredCities = R.filter(filterByWeather, scoredCities);

// console.log(R.length(filteredCities));

/**
 * 6. Sort based on score
 */

const sortedCities = R.sortWith(
  [R.descend(city => city.score)],
  filteredCities
)

// console.log(sortedCities);

/**
 * 7. Top 10 using take
 */

const top10 = R.take(10, sortedCities);

// console.log(top10);

/**
 * 8. Compose
 */

const topCities = R.pipe(
  R.map(updateTemperature(KtoF)),
  R.filter(filterByWeather),
  R.map(calcScore),
  R.sortWith(
    [R.descend(city => city.score)]
  ),
  R.take(10)
)(cities);

// console.log(topCities);

const topCitiesCompose = R.compose(
  R.take(10),
  R.sortWith([R.descend(city => city.score)]),
  R.map(calcScore),
  R.filter(filterByWeather),
  R.map(updateTemperature(KtoF))
)(cities);

console.log(topCitiesCompose);