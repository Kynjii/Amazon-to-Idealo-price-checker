// contentScript.js
function addIdealoButton() {
  // Check if we're on a product page
  const titleElement = document.getElementById("productTitle");
  if (!titleElement) return;

  // Extract the product title
  const productTitle = titleElement.innerText.trim();
  if (!productTitle) return;
  console.log(productTitle);

  // Create the Idealo button
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

  // Add the button to the page (below the product title)
  titleElement.parentElement.appendChild(idealoButton);
}

// Run the function when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", addIdealoButton);

console.log("Amazon to Idealo content script loaded.");
