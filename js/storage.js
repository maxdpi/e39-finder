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

function validateBackupListings(listings) {
  const seenIds = new Set();

  function isObject(value) {
    return value !== null &&
      typeof value === "object" &&
      !Array.isArray(value);
  }

  function isValidPrice(value) {
    return Number.isFinite(value) && value >= 0;
  }

  const textFields = [
    "id", "url", "entryType", "listingStatus",
    "isE39Touring", "isPetrol", "isManual",
    "severeCorrosion", "majorMechanicalDefect",
    "maintenanceHistory", "structuralCondition",
    "mechanicalCondition", "conditionNotes",
    "priceAssessment", "huUntil", "modifications",
    "firstObservedAt", "lastObservedAt", "sellerDescription",
  ];

  for (const [index, listing] of listings.entries()) {
    const label = `Listing ${index + 1}`;

    if (
      !isObject(listing) ||
      typeof listing.model !== "string" ||
      !isValidPrice(listing.price) ||
      (
        listing.mileage !== null &&
        !isValidPrice(listing.mileage)
      )
    ) {
      throw new Error(`${label}: invalid model, price or mileage.`);
    }

    for (const field of textFields) {
      const value = listing[field];

      if (value != null && typeof value !== "string") {
        throw new Error(`${label}: invalid ${field}.`);
      }
    }

    if (listing.id != null) {
      if (listing.id.trim() === "" || seenIds.has(listing.id)) {
        throw new Error(`${label}: empty or duplicate ID.`);
      }

      seenIds.add(listing.id);
    }

    if (listing.observations !== undefined) {
      if (!Array.isArray(listing.observations)) {
        throw new Error(`${label}: invalid observation history.`);
      }

      for (const observation of listing.observations) {
        if (
          !isObject(observation) ||
          !isValidPrice(observation.askingPrice) ||
          typeof observation.observedAt !== "string" ||
          !Number.isFinite(Date.parse(observation.observedAt)) ||
          (
            observation.status != null &&
            typeof observation.status !== "string"
          )
        ) {
          throw new Error(`${label}: invalid observation.`);
        }
      }
    }
  }
}