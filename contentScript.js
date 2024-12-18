setTimeout(() => {
  const titleElement = document.getElementById("productTitle");
  if (titleElement) {
    addIdealoButton(titleElement);
  } else {
  }
}, 1000); // Wait 1 seconds

function checkForTitle() {
  const titleElement = document.getElementById("productTitle");
  if (titleElement) {
    addIdealoButton(titleElement);
  } else {
    observeForTitle();
  }
}

function observeForTitle() {
  const observer = new MutationObserver((mutations, obs) => {
    const titleElement = document.getElementById("productTitle");
    if (titleElement) {
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
}
