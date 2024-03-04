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
//Render character
const renderCharacter = (character) => {
    const imageUrlCharacter =
      character.thumbnail.path + "." + character.thumbnail.extension;
    const name = character.name;
    const description = character.description;
    const comicsUrl = character.comics.collectionURI; 
    const characterCard = document.createElement("div");
    characterCard.className = "character-card";
    characterCard.innerHTML = `
    <div class="flex justify-center items-center  w-full comic-card card-container hover:translate-y-[-5px]">
    <div class="flex flex-col w-48 justity-center items-center m-8">
      <img class="flex justity-center items-center min-w-40 max-w-48" src="${imageUrlCharacter}">
      <div/>
    <div class="flex content-center">
    <h2 class="flex items-center font-semibold">${name}</h2>
    <div/>
    <div/>
    `;
    characterCard.addEventListener("click", async () => {
        showCharacterDetails(
        imageUrlCharacter,
        name,
        description,
        comicsUrl,
        offset,
        resultsPerPage
    );
    });
    $("#card--container").appendChild(characterCard);
};
// Render comics
const renderComic = (result) => {
    let detailComic = result;
    const imageUrlComic = `${result.thumbnail.path}.${result.thumbnail.extension}`;
    const id = result.id;
    const title = result.title;
    const releaseDate = result.dates.find(
    (date) => date.type === "onsaleDate"
    ).date;
    const writers = result.creators.items
        .filter((creator) => creator.role === "writer")
        .map((writer) => writer.name);
    const description = result.description;
    let charactersUrl = result.characters.collectionURI;
    const comicCard = document.createElement("div");
    comicCard.className = "comic-card";
    comicCard.id = id;
    comicCard.innerHTML = `
    <div class="flex justify-center items-center  w-full comic-card card-container hover:translate-y-[-5px]">
    <div class="flex flex-col w-48 justity-center items-center m-8">
    <img class="flex justity-center items-center min-w-40 max-w-48" src="${imageUrlComic}">
    <div/>
    <div class="flex content-center">
    <h2 class="flex items-center font-semibold">${title}</h2>
    <div/>
    <div/>
    `;
    comicCard.addEventListener("click", async () => {
      showComicDetails(
        imageUrlComic,
        title,
        releaseDate,
        writers.join(", "),
        description,
        charactersUrl,
        offset,
        resultsPerPage
    );
    });

    $("#card--container").appendChild(comicCard);
}; 
//Back button
const goBack = async () => {
    showElement([
      "#card--container",
      "#results--container",
      "#pagination--container",
      "#btn--panel",
    ]);
    hideElement(["#card--details", "#btn--panel-details"]);
    const { typeSelected, searchTerm, searchSort } = getSearchParameters();
    await renderApiResults(typeSelected, searchTerm, searchSort, limit, offset);
    await renderTotalResults(typeSelected, searchTerm, searchSort, limit, offset);
    detailOffset = 0;
    detailCurrentPage = 1;
    detailTotalPages = 1;
    updateDetailDisabledProperty();
    updateDisabledProperty();

    $("#btn--goBack").classList.add("hidden"); // Hides the "Back" button
};
//Total results
const getTotalResults = async (
    resourceSearch,
    inputSearch,
    orderSearch,
    limitParam,
    offsetParam
  ) => {
    const data = await getDataApi(
      resourceSearch,
      inputSearch,
      orderSearch,
      limitParam,
      offsetParam
    );
    totalPages = Math.ceil(data.data.total / resultsPerPage);
    const currentPage = Math.floor(offsetParam / resultsPerPage) + 1;
    return { totalResults: data.data.total, totalPages, currentPage };
  };
//Render total results
  const renderTotalResults = async (
    resourceSearch,
    inputSearch,
    orderSearch,
    limitParam,
    offsetParam
  ) => {
    const pagination = await getTotalResults(
      resourceSearch,
      inputSearch,
      orderSearch,
      limitParam,
      offsetParam
    );
  
    $("#results--cuantiti").textContent = `Results: ${pagination.totalResults}`;
    // $("#current--page").textContent = `CURRENT PAGE: ${pagination.currentPage}`;
    // $("#total--pages").textContent = `TOTAL PAGES: ${pagination.totalPages}`;
};
//Update disabled property
const updateDisabledProperty = () => {
    if (offset > 0) {
      $("#btn--prev-page").disabled = false;
      $("#btn--first-page").disabled = false;
    } else {
      $("#btn--prev-page").disabled = true;
      $("#btn--first-page").disabled = true;
    }
  
    if (offset < (totalPages - 1) * resultsPerPage) {
      $("#btn--next-page").disabled = false;
      $("#btn--last-page").disabled = false;
    } else {
      $("#btn--next-page").disabled = true;
      $("#btn--last-page").disabled = true;
    }
  };
  
//Update disabled property details
  const updateDetailDisabledProperty = () => {
    const totalPages = Math.ceil(detailTotalPages);
    const currentPage = Math.floor(detailOffset / resultsPerPage) + 1;
    $("#btn--prev-page-details").disabled = detailOffset <= 0;
    $("#btn--first-page-details").disabled = detailOffset <= 0;
    $("#btn--next-page-details").disabled = currentPage >= totalPages;
    $("#btn--last-page-details").disabled = currentPage >= totalPages;
};
//Search parameters
const getSearchParameters = () => {
    return {
      typeSelected: $("#search--type").value,
      searchTerm: $("#input--search").value,
      searchSort: $("#search--sort").value,
    };
};
// Update URL with search parameters
  const updateURL = () => {
    const { typeSelected, searchTerm, searchSort } = getSearchParameters();
    const searchParams = new URLSearchParams({
      typeSelected,
      searchTerm,
      searchSort,
    });
    history.pushState({}, "", `${location.pathname}?${searchParams}`);
};
//Fetch and render
const fetchDataAndRender = async (
    typeSelected,
    searchTerm,
    searchSort,
    limit,
    offset
  ) => {
    await getDataApi(typeSelected, searchTerm, searchSort, limit, offset);
    await renderApiResults(typeSelected, searchTerm, searchSort, limit, offset);
    await renderTotalResults(typeSelected, searchTerm, searchSort, limit, offset);
};
// Search
    const searchFunction = async () => {
    offset = 0;
    const { typeSelected, searchTerm, searchSort } = getSearchParameters();
    await fetchDataAndRender(typeSelected, searchTerm, searchSort, limit, offset);
    updateDisabledProperty();
    updateURL();
};
//Next page
    const goToNextPage = async () => {
    $("#card--container").innerHTML = "";
    if (currentPage <= 1) {
      offset += 20;
      updateDisabledProperty();
    }
    const { typeSelected, searchTerm, searchSort } = getSearchParameters();
    await fetchDataAndRender(typeSelected, searchTerm, searchSort, limit, offset);
};
//Prev page
    const goToPrevPage = async () => {
    offset -= 20;
    updateDisabledProperty();
    const { typeSelected, searchTerm, searchSort } = getSearchParameters();
    await fetchDataAndRender(typeSelected, searchTerm, searchSort, limit, offset);
};
//First page
  const goToFirstPage = async () => {
    offset = 0;
    updateDisabledProperty();
    const { typeSelected, searchTerm, searchSort } = getSearchParameters();
    await fetchDataAndRender(typeSelected, searchTerm, searchSort, limit, offset);
};
//Last page
    const goToLastPage = async () => {
    const { typeSelected, searchTerm, searchSort } = getSearchParameters();
    const { totalPages } = await getTotalResults(
      typeSelected,
      searchTerm,
      searchSort,
      limit,
      offset
    );
    if (totalPages > 0) {
      offset = (totalPages - 1) * resultsPerPage;
      updateDisabledProperty();
      await fetchDataAndRender(
        typeSelected,
        searchTerm,
        searchSort,
        limit,
        offset
      );
    }
};
//Selected page
  const goToSelectedPage = async () => {
    const { typeSelected, searchTerm, searchSort } = getSearchParameters();
    const selectedPage = $("#page--input").valueAsNumber;
    const { totalPages } = await getTotalResults(
      typeSelected,
      searchTerm,
      searchSort,
      limit,
      offset
    );
    if (selectedPage > 0 && selectedPage <= totalPages) {
      offset = (selectedPage - 1) * resultsPerPage;
      await fetchDataAndRender(
        typeSelected,
        searchTerm,
        searchSort,
        limit,
        offset
      );
      updateDisabledProperty();
    } else {
      alert("Invalid page number");
    }
    $("#page--input").value = "";
};
//Hide options select
  const manageOptions = () => {
    if ($("#search--type").value === "characters") {
      hideElement(["#sort--title-new", "#sort--title-old"]);
    } else {
      showElement(["#a-z", "#z-a", "#sort--title-new", "#sort--title-old"]);
    }
};
//Next page details
  const goToDetailNextPage = async () => {
    detailOffset += 20;
    updateDetailDisabledProperty();
    showCharacterDetails(
      detailCharacter.imageUrlCharacter,
      detailCharacter.name,
      detailCharacter.description,
      detailCharacter.comicsUrl,
      detailOffset,
      resultsPerPage
    );
};
//Prev page details
  const goToDetailPrevPage = async () => {
    detailOffset -= resultsPerPage;
    if (detailOffset < 0) {
      detailOffset = 0;
    }
    updateDetailDisabledProperty();
    showCharacterDetails(
      detailCharacter.imageUrlCharacter,
      detailCharacter.name,
      detailCharacter.description,
      detailCharacter.comicsUrl,
      detailOffset,
      resultsPerPage
    );
};

//First page details
  const goToFirstPageDetails = async () => {
    if (detailOffset !== 0) {
      detailOffset = 0;
      updateDetailDisabledProperty();
      showCharacterDetails(
        detailCharacter.imageUrlCharacter,
        detailCharacter.name,
        detailCharacter.description,
        detailCharacter.comicsUrl,
        detailOffset,
        resultsPerPage
      );
    }
};
//Last page details
  const goToLastPageDetails = async () => {
    const totalPages = Math.ceil(detailTotalPages);
    const lastPageOffset = (totalPages - 1) * resultsPerPage;
    if (lastPageOffset !== detailOffset) {
      detailOffset = lastPageOffset;
      updateDetailDisabledProperty();
      showCharacterDetails(
        detailCharacter.imageUrlCharacter,
        detailCharacter.name,
        detailCharacter.description,
        detailCharacter.comicsUrl,
        detailOffset,
        resultsPerPage
      );
    }
};

const initializeApp = async () => {
    await renderApiResults("comics", "", "a-z", 20, 0);
    await renderTotalResults("comics", "", "a-z", 20, 0);
    updateDisabledProperty();
    //Events
    //Btn search
    $("#btn--search").addEventListener("click", searchFunction);
    //Btn next page
    $("#btn--next-page").addEventListener("click", goToNextPage);
    //Btn next page details
    $("#btn--next-page-details").addEventListener("click", goToDetailNextPage);
    //Btn prev page
    $("#btn--prev-page").addEventListener("click", goToPrevPage);
    //Btn prev page details
    $("#btn--prev-page-details").addEventListener("click", goToDetailPrevPage);
    //Btn first page
    $("#btn--first-page").addEventListener("click", goToFirstPage);
    //Btn first page details
    $("#btn--first-page-details").addEventListener("click", goToFirstPageDetails);
    //Btn last page
    $("#btn--last-page").addEventListener("click", goToLastPage);
    //Btn las page details
    $("#btn--last-page-details").addEventListener("click", goToLastPageDetails);
    //Input selected page
    $("#btn--gotopage").addEventListener("click", goToSelectedPage);
    //Hide-show select options
    $("#search--type").addEventListener("change", manageOptions);
};
  
window.onload = initializeApp;