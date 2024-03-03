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