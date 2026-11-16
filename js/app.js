const listingForm = document.querySelector("#listing-form");
const listingSummary = document.querySelector("#listing-summary");

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
  };

  const modelText =
    listing.model === "other" ? "Other E39" : `BMW ${listing.model}`;

  const priceText = listing.price.toLocaleString("de-DE");

  const mileageText =
    listing.mileage === null
      ? "Mileage unknown"
      : `${listing.mileage.toLocaleString("de-DE")} km`;

  listingSummary.textContent =
    `${modelText} · €${priceText} · ${mileageText}. Not yet evaluated.`;
});