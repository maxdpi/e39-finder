const listingForm = document.querySelector("#listing-form");
const listingSummary = document.querySelector("#listing-summary");
const savedListings = document.querySelector("#saved-listings");
const emptyListings = document.querySelector("#empty-listings");
const hideTestEntries = document.querySelector("#hide-test-entries");
const exportButton = document.querySelector("#export-listings");
const importInput = document.querySelector("#import-backup");
const importSummary = document.querySelector("#import-summary");
const restoreButton = document.querySelector("#restore-backup");

let listings = [];

let editingListingId = null;

let pendingBackup = null;

importInput.addEventListener("change", async function () {
  restoreButton.disabled = true;
  pendingBackup = null;
  importSummary.textContent = "";

  const file = importInput.files[0];

  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    if (
      backup?.app !== "E39 Finder" ||
      backup.version !== 1 ||
      !Array.isArray(backup.listings)
    ) {
      throw new Error("Unsupported backup format.");
    }

    validateBackupListings(backup.listings);

    pendingBackup = backup;
    restoreButton.disabled = false;

    importSummary.textContent =
      `Backup selected: ${backup.listings.length} listings. ` +
      "Nothing has been restored yet.";
  } catch (error) {
    importSummary.textContent = `Backup rejected: ${error.message}`;
    console.error(error);
  }
});

restoreButton.addEventListener("click", function () {
  if (!pendingBackup) {
    return;
  }

  const confirmed = window.confirm(
    `Replace your ${listings.length} current listings with ` +
    `${pendingBackup.listings.length} listings from this backup? ` +
    "Export your current data first if you want to keep it."
  );

  if (!confirmed) {
    return;
  }

  try {
    const restoredListings = pendingBackup.listings;

    validateBackupListings(restoredListings);
    saveListings(restoredListings);

    listings = restoredListings;
    editingListingId = null;

    listingForm.reset();

    const submitButton =
      listingForm.querySelector('button[type="submit"]');

    submitButton.disabled = false;
    submitButton.textContent = "Add listing";

    renderListings();

    pendingBackup = null;
    importInput.value = "";
    restoreButton.disabled = true;

    listingSummary.textContent = "";
    importSummary.textContent =
      `Restored ${listings.length} listings from backup.`;
  } catch (error) {
    importSummary.textContent = `Restore failed: ${error.message}`;
    console.error(error);
  }
});

exportButton.addEventListener("click", function () {
    const exportedAt = new Date().toISOString();
  
    const backup = {
      app: "E39 Finder",
      version: 1,
      exportedAt,
      listings,
    };
  
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `e39-finder-backup-${exportedAt.slice(0, 10)}.json`;
  
    document.body.append(link);
    link.click();
    link.remove();
  
    setTimeout(function () {
      URL.revokeObjectURL(downloadUrl);
    }, 1000);
  
    listingSummary.textContent = "Backup download requested.";
  });

hideTestEntries.addEventListener("change", renderListings);

const repeatLastButton = document.querySelector("#repeat-last");

repeatLastButton.addEventListener("click", function () {
  editingListingId = null;
  listingForm.querySelector('button[type="submit"]').textContent =
    "Add listing";
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
    const visibleListings = listings.filter(function (listing) {
        const isTest =
          listing.entryType === "test" ||
          (
            listing.entryType == null &&
            /^TEST\b/i.test((listing.conditionNotes ?? "").trim())
          );
    
        return !hideTestEntries.checked || !isTest;
      });
    
      emptyListings.hidden = visibleListings.length > 0;
    
      emptyListings.textContent =
        listings.length === 0
          ? "No listings saved yet."
          : "No listings match the current filter.";
  
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
  
    for (const listing of visibleListings) {
      const item = document.createElement("li");
  
      const summary = document.createElement("p");
      const entryLabel =
      listing.entryType === "test"
        ? "[TEST] "
        : listing.entryType === "real"
          ? ""
          : "[UNCLASSIFIED] ";

      summary.textContent = entryLabel + formatListing(listing);

      item.append(summary);

      const statusLabels = {
        unknown: "Unknown",
        active: "Active advertisement",
        removed: "Removed — sale unconfirmed",
        sold: "Confirmed sold",
        relisted: "Relisted — same vehicle identified",
      };
  
      const status = document.createElement("p");
      status.textContent =
        `Listing status: ${statusLabels[listing.listingStatus] ?? "Unknown"}`;
  
      item.append(status);

      const history = document.createElement("p");
      const observationCount = listing.observations?.length ?? 0;
  
      history.textContent =
        observationCount > 0
          ? `Recorded observations: ${observationCount}`
          : "Observation history not yet recorded.";
  
      item.append(history);

      if (observationCount > 0) {
        const historyDetails = document.createElement("details");
        const historyHeading = document.createElement("summary");
        historyHeading.textContent = "View price and status history";
        historyDetails.append(historyHeading);
  
        const observationList = document.createElement("ul");
  
        for (const observation of listing.observations) {
          const observationItem = document.createElement("li");
  
          const dateText = new Date(
            observation.observedAt
          ).toLocaleString("en-GB");
  
          const priceText =
            observation.askingPrice.toLocaleString("de-DE");
  
          const statusText =
            statusLabels[observation.status] ?? "Unknown";
  
          observationItem.textContent =
            `${dateText} · Asking price: €${priceText} · ${statusText}`;
  
          observationList.append(observationItem);
        }
  
        historyDetails.append(observationList);
        item.append(historyDetails);
      }

      if (listing.url) {
        try {
          const url = new URL(listing.url);
  
          if (url.protocol === "https:" || url.protocol === "http:") {
            const link = document.createElement("a");
            link.href = url.href;
            link.textContent = "Open original listing";
            link.target = "_blank";
            link.rel = "noopener noreferrer";
  
            const linkParagraph = document.createElement("p");
            linkParagraph.append(link);
            item.append(linkParagraph);
          }
        } catch (error) {
          console.warn("Invalid listing URL:", listing.url);
        }
      }
  
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

      if (listing.sellerDescription) {
        const descriptionDetails = document.createElement("details");
        const descriptionHeading = document.createElement("summary");
  
        descriptionHeading.textContent = "Original seller description";
        descriptionDetails.append(descriptionHeading);
  
        const description = document.createElement("p");
        description.className = "listing-notes";
        description.textContent = listing.sellerDescription;
  
        descriptionDetails.append(description);
        item.append(descriptionDetails);
      }

      if (listing.id) {
        const updateButton = document.createElement("button");
        updateButton.type = "button";
        updateButton.textContent = "Update listing";
  
        updateButton.addEventListener("click", function () {
          listingForm.reset();
  
          for (const [name, value] of Object.entries(listing)) {
            const field = listingForm.elements.namedItem(name);
  
            if (field && "value" in field) {
              field.value = value ?? "";
            }
          }
  
          editingListingId = listing.id;
  
          listingForm.querySelector('button[type="submit"]').textContent =
            "Save update";
  
          listingSummary.textContent =
            "Editing an existing listing. Saving will add a dated observation.";
  
          listingForm.scrollIntoView({ behavior: "smooth" });
        });
  
        item.append(updateButton);
      }
      savedListings.append(item);
    }
  }

listingForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const formData = new FormData(listingForm);
  
  const existingListing = listings.find(function (listing) {
    return listing.id === editingListingId;
  });

  const observedAt = new Date().toISOString();
  
  const listing = {
    id: existingListing?.id ?? crypto.randomUUID(),
    url: formData.get("url").trim(),
    entryType: formData.get("entryType"),
    listingStatus: formData.get("listingStatus"),
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
    firstObservedAt: existingListing?.firstObservedAt ?? observedAt,
    lastObservedAt: observedAt,
    sellerDescription: formData.get("sellerDescription").trim(),
    
  };

  listing.observations = [
    ...(existingListing?.observations ?? []),
    {
      observedAt,
      askingPrice: listing.price,
      status: listing.listingStatus,
    },
  ];

  const updatedListings = existingListing
    ? listings.map(function (savedListing) {
        return savedListing.id === existingListing.id
          ? listing
          : savedListing;
      })
    : [...listings, listing];

  try {
    saveListings(updatedListings);
    listings = updatedListings;
    renderListings();
    listingForm.reset();
    editingListingId = null;
    listingForm.querySelector('button[type="submit"]').textContent =
      "Add listing";
    listingSummary.textContent = existingListing
      ? "Listing updated. Previous observations preserved."
      : "Listing saved in this browser.";
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