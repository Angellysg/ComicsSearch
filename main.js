//Selector
const $ = (selector) => document.querySelector(selector);

//Global variables
const baseURL = "https://gateway.marvel.com/v1/public/";
let ts = "ts=1";
const publicKey = "&apikey=000c3efb762ccaa3fb13232d92fc677c";
const hash = "&hash=34ed53264b2e619633f615e7ba246caa";

let resource = "comics" || "characters";
let limit = 20;
let title = "";
let characterName = "";
let offset = 0;
const resultsPerPage = 20;
let currentPage = 1;
let totalPages = 1;
let detailCharacter;

//Functions
//Hide elements
const hideElement = (selectors) => {
  selectors.forEach((selector) => {
    const element = $(selector);
    if (element) {
      element.classList.add("hidden");
    }
  });
};

//Show elements
const showElement = (selectors) => {
  selectors.forEach((selector) => {
    const element = $(selector);
    if (element) {
      element.classList.remove("hidden");
    }
  });
};

//Format date
const formatReleaseDate = (dateString) => {
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  const formattedDate = new Date(dateString).toLocaleDateString(
    undefined,
    options
  );
  return formattedDate;
};

//URL construction
const buildApiUrl = (
  resource,
  inputSearch,
  orderSearch,
  offsetParam,
  limitParam
) => {
  let url = `${baseURL}${resource}?`;

  if (inputSearch) {
    url += `${
      resource === "comics" ? "titleStartsWith" : "nameStartsWith"
    }=${inputSearch}&`;
  }

  switch (orderSearch.toLowerCase()) {
    case "a-z":
      url += `orderBy=${resource === "comics" ? "title" : "name"}&`;
      break;
    case "z-a":
      url += `orderBy=-${resource === "comics" ? "title" : "name"}&`;
      break;
    case "-focDate":
      if (resource === "comics") {
        url += "orderBy=-focDate&";
      }
      break;
    case "focDate":
      if (resource === "comics") {
        url += "orderBy=focDate&";
      }
      break;
  }

  url += `offset=${offsetParam}&limit=${limitParam}&${ts}${publicKey}&${hash}`;
  return url;
};

//Api fetch
const fetchData = async (url) => {
  const response = await fetch(url);
  return response.json();
};

//API call
const getDataApi = async (
  resourceSearch,
  inputSearch,
  orderSearch,
  limitParam,
  offsetParam
) => {
  showElement(["#loader"]);
  const urlApi = buildApiUrl(
    resourceSearch,
    inputSearch,
    orderSearch,
    offsetParam,
    limitParam
  );
  const data = await fetchData(urlApi);
  hideElement(["#loader"]);
  return data;
};

//Render Api results
const renderApiResults = async (
  resourceSearch,
  inputSearch,
  orderSearch,
  limitParam,
  offsetParam
) => {
  const results = await getDataApi(
    resourceSearch,
    inputSearch,
    orderSearch,
    limitParam,
    offsetParam
  );
  const cardContainer = $("#card--container");
  cardContainer.innerHTML = "";
  results.data.results.forEach((result) => {
    if (resourceSearch === "comics") {
      renderComic(result);
    } else if (resourceSearch === "characters") {
      renderCharacter(result);
    }
  });
};
//Show details
const showDetails = async (
  imageUrl,
  titleOrName,
  releaseDate,
  writers,
  description,
  isComic,
  relatedDataUrl
) => {
  hideElement(["#results--container", "#btn--panel"]);
  showElement(["#card--details", "#btn--panel-details"]);

  const formattedReleaseDate = releaseDate
    ? formatReleaseDate(releaseDate)
    : "";
  $("#card--details").innerHTML = `
    <div class="flex justify-center items-center  w-full">
        <div class="flex flex-col m-8">
        <img class="flex w-full"  src="${imageUrl}" alt="${titleOrName}">
        </div> 
        <div>
        <h2>${titleOrName}</h2>
        ${
          isComic && releaseDate
            ? `<p>Launch date: <span>${formattedReleaseDate}</span></p>`
            : ""
        }
        ${writers ? `<p>Writers: <span>${writers}</span></p>` : ""}
        <p>Description: <span>${
          description || "No description available"
        }</span></p>
        </div>  
    </div>
    `;
  if (isComic && relatedDataUrl) {
    const relatedData = await fetchData(relatedDataUrl);
    const charactersContainer = $("#card--container");
    if (charactersContainer) {
      charactersContainer.innerHTML = `<h3>${
        isComic ? "Characters" : "Comics"
      } in this ${isComic ? "Comic" : "Character"}:</h3>`;
      relatedData.data.results.forEach((relatedItem) => {
        if (isComic) {
          renderCharacter(relatedItem);
        } else {
          renderComic(relatedItem);
        }
      });
    }
  }
  showElement(["#btn--goBack"]);
};
//Show comic details
const showComicDetails = async (
  imageUrl,
  title,
  releaseDate,
  writers,
  description,
  charactersUrl,
  offsetParam,
  limitParam
) => {
  showDetails(imageUrl, title, releaseDate, writers, description);
  showElement(["#loader"]);
  const fullCharactersUrl = `${charactersUrl}?offset=${offsetParam}&limit=${limitParam}&${ts}${publicKey}${hash}`;
  const charactersData = await fetchData(fullCharactersUrl);
  hideElement(["#loader"]);
  $("#card--container").innerHTML = `
    <div>
    <h3>Characters:</h3>
    <p>Results: ${charactersData.data.total}</p>
    </div>
    `;
  if (charactersData.data.results.length === 0) {
    $("#card--container").innerHTML += `
    <div>
    <p>No results found</p>
    </div>
    `;
  } else {
    charactersData.data.results.forEach((character) => {
      renderCharacter(character);
    });
  }
  detailOffset = offsetParam;
  detailTotalPages = Math.ceil(charactersData.data.total / resultsPerPage);
  detailCurrentPage = Math.floor(detailOffset / resultsPerPage) + 1;
  updateDetailDisabledProperty();
};
//Show character details
const showCharacterDetails = async (
  imageUrlCharacter,
  name,
  description,
  comicsUrl,
  offsetParam,
  limitParam
) => {
  detailCharacter = {
    imageUrlCharacter,
    name,
    description,
    comicsUrl,
    offsetParam,
    limitParam,
  };
  showDetails(imageUrlCharacter, name, null, null, description);
  showElement(["#loader"]);
  let fullComicsUrl = `${comicsUrl}?offset=${offsetParam}&limit=${limitParam}&${ts}${publicKey}${hash}`;
  const comicsData = await fetchData(fullComicsUrl);
  hideElement(["#loader"]);
$("#card--container").innerHTML = `
    <div>
    <h3>Comics</h3>
    <p>Results: ${comicsData.data.total}</p>
    </div>
    `;
  if (comicsData.data.results.length === 0) {
    $("#card--container").innerHTML += `
    <div>
    <p>No results found</p>
    </div>
    `;
} else {
    comicsData.data.results.forEach((comic) => {
    renderComic(comic);
    });
  }
  detailOffset = offsetParam;
  detailTotalPages = Math.ceil(comicsData.data.total / resultsPerPage);
  detailCurrentPage = Math.floor(detailOffset / resultsPerPage) + 1;

updateDetailDisabledProperty();
};
