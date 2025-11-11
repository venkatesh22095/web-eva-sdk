import { isObject, isString } from "lodash";
import store from "../redux/store";


const makePossibilityData = (possibilities, limit = 3) => {
  function getRandomValueFromArray(arr) {
    let utterances = arr?.utterances;
    const randomIndex = Math.floor(Math.random() * utterances?.length);
    return utterances[randomIndex];
  }

  function selectRandomValuesFromArray(arr, numberOfValuesToSelect) {
    const selectedValues = [];
    const arrayCopy = [...arr]; // Creating acopy to avoid modifying the original array

    for (let i = 0; i < numberOfValuesToSelect; i++) {
      const randomIndex = Math.floor(Math.random() * arrayCopy.length);
      selectedValues.push(arrayCopy.splice(randomIndex, 1)[0]);
    }
    return selectedValues;
  }

  let randomValuesArray= [];
  randomValuesArray = Object.values(possibilities || {})?.map(getRandomValueFromArray);
  randomValuesArray = randomValuesArray?.map(f => {
      if(isObject(f) && !!f?.label) {
          return f?.label?.replace(/&bdquo;/g, '"')?.replace(/&ldquo;/g, '"')?.replace(/&rdquo;/g, '"')?.replace(/&comma;/g, ',')
      } else if(isString(f)){
          return f?.replace(/&bdquo;/g, '"')?.replace(/&ldquo;/g, '"')?.replace(/&rdquo;/g, '"')?.replace(/&comma;/g, ',')
      } else ;
  }).filter(Boolean);
  let filterData = selectRandomValuesFromArray(randomValuesArray, limit);

  let allUtterances = [];
  for (const category in possibilities) {
    if (possibilities.hasOwnProperty(category) && possibilities[category].hasOwnProperty("utterances")) {
      allUtterances.push(...possibilities[category].utterances);
    }
  }

  let seeMorePossibilities = allUtterances?.filter((u) => {
    return !filterData?.find(f => f === u)
  })

  return { allPossibilities: seeMorePossibilities, filteredPossibilities: filterData }
}

const PossibilitiesWidget = (props) => {
  return new Promise((resolve) => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const { status, error, data } = state.global.config;
      if (status !== 'loading') {
        unsubscribe();
        resolve({
          status,
          error,
          data: makePossibilityData(data?.possibilities, props?.limit) || {}
        });
      }
    });
  });
}

export default PossibilitiesWidget