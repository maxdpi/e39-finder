const STORAGE_KEY = "e39-finder-listings-v1";

function loadListings() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (savedData === null) {
    return [];
  }

  const listings = JSON.parse(savedData);

  if (!Array.isArray(listings)) {
    throw new Error("Saved listings must be an array.");
  }

  return listings;
}

function saveListings(listings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
}
