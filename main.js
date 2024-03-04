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
        url += `${resource === "comics" ? "titleStartsWith" : "nameStartsWith"
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