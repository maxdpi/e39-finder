const listingForm = document.querySelector("#listing-form");
const listingSummary = document.querySelector("#listing-summary");
const savedListings = document.querySelector("#saved-listings");
const emptyListings = document.querySelector("#empty-listings");

let listings = [];

function formatListing(listing) {
    const modelText =
      listing.model === "other" ? "Other E39" : `BMW ${listing.model}`;
  
    const priceText = listing.price.toLocaleString("de-DE");
  
    const mileageText =
      listing.mileage === null
        ? "Mileage unknown"
        : `${listing.mileage.toLocaleString("de-DE")} km`;
  
    const evaluation = evaluateEligibility(listing);
  
    const details = [
      ...evaluation.failures,
      ...evaluation.unknowns,
    ].join("; ");
  
    return `${modelText} · €${priceText} · ${mileageText}. ${evaluation.verdict}${
      details ? `. ${details}` : ""
    }`;
  }

function renderListings() {
  savedListings.replaceChildren();
  emptyListings.hidden = listings.length > 0;

  for (const listing of listings) {
    const item = document.createElement("li");
    item.textContent = formatListing(listing);
    savedListings.append(item);
  }
}

listingForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const formData = new FormData(listingForm);

  const listing = {
    model: formData.get("model"),
    price: Number(formData.get("price")),
    mileage:
      formData.get("mileage") === ""
        ? null
        : Number(formData.get("mileage")),
        isE39Touring: formData.get("isE39Touring"),
    isPetrol: formData.get("isPetrol"),
    isManual: formData.get("isManual"),
    severeCorrosion: formData.get("severeCorrosion"),
    majorMechanicalDefect: formData.get("majorMechanicalDefect"),
    firstObservedAt: new Date().toISOString(),
  };

  const updatedListings = [...listings, listing];

  try {
    saveListings(updatedListings);
    listings = updatedListings;
    renderListings();
    listingForm.reset();
    listingSummary.textContent = "Listing saved in this browser.";
  } catch (error) {
    listingSummary.textContent =
      "Could not save the listing. Your form details have been kept.";
    console.error(error);
  }
});

try {
  listings = loadListings();
  renderListings();
} catch (error) {
  listingSummary.textContent =
    "Could not load saved listings. Adding listings is disabled to protect existing data.";
  listingForm.querySelector('button[type="submit"]').disabled = true;
  console.error(error);
}