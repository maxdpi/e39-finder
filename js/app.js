const listingForm = document.querySelector("#listing-form");
const listingSummary = document.querySelector("#listing-summary");
const savedListings = document.querySelector("#saved-listings");
const emptyListings = document.querySelector("#empty-listings");

let listings = [];

const repeatLastButton = document.querySelector("#repeat-last");

repeatLastButton.addEventListener("click", function () {
  const lastListing = listings[listings.length - 1];

  if (!lastListing) {
    listingSummary.textContent = "No saved listing to repeat yet.";
    return;
  }

  listingForm.reset();

  for (const [name, value] of Object.entries(lastListing)) {
    const field = listingForm.elements.namedItem(name);

    if (field && "value" in field) {
      field.value = value ?? "";
    }
  }

  listingSummary.textContent =
    "Last entry copied into the form. Adjust it, then click Add listing.";
});

function formatListing(listing) {
    const modelText =
      listing.model === "other" ? "Other E39" : `BMW ${listing.model}`;
  
    const priceText = listing.price.toLocaleString("de-DE");
  
    const mileageText =
      listing.mileage === null
        ? "Mileage unknown"
        : `${listing.mileage.toLocaleString("de-DE")} km`;
  
        const evaluation = evaluateListing(listing);

    const details = [
      ...evaluation.failures,
      ...evaluation.unknowns,
    ].join("; ");
  
    const scoreLabel =
    evaluation.unknowns.length > 0 ? "Provisional points" : "Score";

  return `${modelText} · €${priceText} · ${mileageText}. ${
    evaluation.verdict
  }. ${scoreLabel}: ${evaluation.score}/100${
    details ? `. ${details}` : ""
  }`;
  }

  function renderListings() {
    savedListings.replaceChildren();
    emptyListings.hidden = listings.length > 0;
  
    const conditionLabels = {
      unknown: "Unknown",
      documented: "Documented with records",
      claimed: "Seller claim — records not verified",
      limited: "Limited or missing history confirmed",
      sound: "Checked: sound",
      "surface-rust": "Checked: surface rust only",
      "repair-needed": "Repairs needed",
      healthy: "Checked: no issues identified",
      "minor-issues": "Minor issues identified",
    };
  
    for (const listing of listings) {
      const item = document.createElement("li");
  
      const summary = document.createElement("p");
      summary.textContent = formatListing(listing);
      item.append(summary);
  
      const condition = document.createElement("p");
  
      const maintenance =
        conditionLabels[listing.maintenanceHistory] ?? "Unknown";
  
      const structure =
        conditionLabels[listing.structuralCondition] ?? "Unknown";
  
      const mechanical =
        conditionLabels[listing.mechanicalCondition] ?? "Unknown";
  
      condition.textContent =
        `Maintenance: ${maintenance}. ` +
        `Structure: ${structure}. ` +
        `Mechanical: ${mechanical}.`;
  
      item.append(condition);
  
      const notes = document.createElement("p");
      notes.className = "listing-notes";
      notes.textContent = listing.conditionNotes || "No notes recorded.";
      item.append(notes);
  
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
    maintenanceHistory: formData.get("maintenanceHistory"),
    structuralCondition: formData.get("structuralCondition"),
    mechanicalCondition: formData.get("mechanicalCondition"),
    conditionNotes: formData.get("conditionNotes").trim(),
    priceAssessment: formData.get("priceAssessment"),
    huUntil: formData.get("huUntil") || null,
    modifications: formData.get("modifications"),
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