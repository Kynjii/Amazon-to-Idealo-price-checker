console.log("Amazon to Idealo content script loaded.");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded, checking for product title...");

  const titleElement = document.getElementById("productTitle");

  if (!titleElement) {
    console.error("Product title element not found. Exiting.");
    return;
  }

  console.log("Product title element found:", titleElement.innerText.trim());

  // Extract product title
  const productTitle = titleElement.innerText.trim();

  if (!productTitle) {
    console.error("Product title is empty. Exiting.");
    return;
  }

  // Create Idealo button
  const idealoButton = document.createElement("a");
  idealoButton.innerText = "Search on Idealo";
  idealoButton.href = `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=${encodeURIComponent(
    productTitle
  )}`;
  idealoButton.target = "_blank";
  idealoButton.style = `
    display: inline-block;
    margin-top: 10px;
    padding: 10px 15px;
    background-color: #ff6600;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
  `;

  console.log("Adding Idealo button to page...");
  titleElement.parentElement.appendChild(idealoButton);
});
