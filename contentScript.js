console.log("Amazon to Idealo content script loaded.");

setTimeout(() => {
  console.log("Checking for product title...");
  const titleElement = document.getElementById("productTitle");
  if (titleElement) {
    console.log("Product title element found:", titleElement.innerText.trim());
    addIdealoButton(titleElement);
  } else {
    console.error("Product title element not found.");
  }
}, 1500); // Wait 3 seconds

function checkForTitle() {
  const titleElement = document.getElementById("productTitle");
  if (titleElement) {
    console.log("Product title found:", titleElement.innerText.trim());
    addIdealoButton(titleElement);
  } else {
    console.error("Product title not found. Watching for changes...");
    observeForTitle();
  }
}

function observeForTitle() {
  const observer = new MutationObserver((mutations, obs) => {
    const titleElement = document.getElementById("productTitle");
    if (titleElement) {
      console.log(
        "Product title found via MutationObserver:",
        titleElement.innerText.trim()
      );
      obs.disconnect(); // Stop observing
      addIdealoButton(titleElement);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function addIdealoButton(titleElement) {
  const productTitle = titleElement.innerText.trim();
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
  titleElement.parentElement.appendChild(idealoButton);
  console.log("Idealo button added successfully.");
}
