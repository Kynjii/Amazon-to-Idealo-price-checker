// Cosine similarity function
const cosine = {
  similarity: function (s1, s2) {
    const terms = Array.from(new Set([...s1.split(""), ...s2.split("")]));
    const vec1 = terms.map((term) => s1.split(term).length - 1);
    const vec2 = terms.map((term) => s2.split(term).length - 1);

    const dotProduct = vec1.reduce((acc, cur, i) => acc + cur * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((acc, cur) => acc + cur ** 2, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((acc, cur) => acc + cur ** 2, 0));

    return magnitude1 && magnitude2
      ? dotProduct / (magnitude1 * magnitude2)
      : 0;
  },
};

// Function to extract price from a generic text string
function extractPrice(priceText) {
  const priceMatch = priceText.match(/\d+[.,]?\d*/);
  return priceMatch ? parseFloat(priceMatch[0].replace(",", ".")) : null;
}

setTimeout(() => {
  const currentUrl = window.location.href;

  if (currentUrl.includes("amazon")) {
    const titleElement = document.getElementById("productTitle");
    const priceElement = document.querySelector(".a-price-whole");
    const fractionElement = document.querySelector(".a-price-fraction");

    if (titleElement && priceElement && fractionElement) {
      const wholePart = priceElement.textContent.trim().replace(",", ".");
      const fractionPart = fractionElement.textContent.trim();
      const amazonPrice = parseFloat(`${wholePart}.${fractionPart}`);
      console.log(amazonPrice);

      chrome.storage.local.set({ amazonPrice }, () => {
        console.log("Amazon price saved to storage:", amazonPrice);
      });
      addIdealoButton(titleElement);
    }
  } else if (currentUrl.includes("idealo.de/preisvergleich/")) {
    chrome.storage.local.get(["amazonPrice"], (result) => {
      const amazonPrice = result.amazonPrice;
      console.log("Amazon price retrieved from storage:", amazonPrice);

      const searchQuery = new URL(window.location.href).searchParams.get("q");
      if (!searchQuery) return;

      const resultItems = document.querySelectorAll(
        '[data-testid="resultItem"]:has(.sr-productSummary__title_f5flP)'
      );

      let highestMatch = { element: null, value: 0 };
      let lowestPriceDiff = { element: null, value: Infinity };

      resultItems.forEach((resultItem) => {
        const titleElement = resultItem.querySelector(
          ".sr-productSummary__title_f5flP"
        );
        const priceElement = resultItem.querySelector(
          "[data-testid='detailedPriceInfo__price']"
        );

        if (titleElement && priceElement) {
          const resultTitle = titleElement.textContent.trim();
          const similarity = cosine.similarity(searchQuery, resultTitle);
          const matchPercentage = Math.round(similarity * 100);

          const idealoPrice = extractPrice(
            priceElement.textContent.replace("ab", "").trim()
          );
          const priceDifference =
            !isNaN(amazonPrice) && !isNaN(idealoPrice)
              ? (idealoPrice - amazonPrice).toFixed(2)
              : null;

          // Update highest match percentage
          if (matchPercentage > highestMatch.value) {
            highestMatch = { element: resultItem, value: matchPercentage };
          }

          // Update lowest price difference (most negative value)
          if (priceDifference < lowestPriceDiff.value) {
            lowestPriceDiff = { element: resultItem, value: priceDifference };
          }
        }
      });

      const toggleExtensionUI = () => {
        const extensionElements = document.querySelectorAll(
          '[data-extension-ui="true"]'
        );

        if (extensionElements.length > 0) {
          const currentDisplay = extensionElements[0].style.display;
          const newDisplay = currentDisplay === "none" ? "block" : "none";

          extensionElements.forEach((element) => {
            element.style.display = newDisplay;
          });

          console.log(`Extension UI toggled to: ${newDisplay}`);
        } else {
          console.warn("No extension UI elements found to toggle.");
        }
      };

      const navigateToElement = (element, label) => {
        if (element) {
          const linkElement = element.querySelector("a");
          if (linkElement) {
            console.log(`Navigating to ${label} using <a>:`, linkElement);
            linkElement.click();
            return;
          }

          const buttonElement = element.querySelector(
            "button.sr-resultItemLink__button_k3jEE"
          );
          if (buttonElement) {
            buttonElement.click();
          }
        } else {
          console.error(`No highlighted ${label} element.`);
        }
      };

      const highlightClosestMatch = () =>
        navigateToElement(highestMatch.element, "Closest Match");
      const highlightBestDeal = () =>
        navigateToElement(lowestPriceDiff.element, "Best Deal");

      const createNavButtons = () => {
        const controlsContainer =
          document.querySelector('[data-extension-ui="true"]') ||
          document.createElement("div");
        if (!controlsContainer.parentElement) {
          controlsContainer.style = `
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 50%;
            right: 10px;
            transform: translateY(-50%);
            gap: 10px;
            z-index: 9999;
          `;
          controlsContainer.setAttribute("data-extension-ui", "true");
          document.body.appendChild(controlsContainer);
        }

        controlsContainer.innerHTML = "";

        if (highestMatch.element) {
          const closestMatchButton = document.createElement("button");
          closestMatchButton.textContent = "Closest Match";
          closestMatchButton.style = `
            padding: 10px;
            background-color: #28a745;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
          `;
          closestMatchButton.addEventListener("click", highlightClosestMatch);
          controlsContainer.appendChild(closestMatchButton);
        }

        if (lowestPriceDiff.element) {
          const bestDealButton = document.createElement("button");
          bestDealButton.textContent = "Best Deal";
          bestDealButton.style = `
            padding: 10px;
            background-color: #ffc107;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
          `;
          bestDealButton.addEventListener("click", highlightBestDeal);
          controlsContainer.appendChild(bestDealButton);
        }

        const toggleButton = document.createElement("button");
        toggleButton.textContent = "Toggle Extension UI";
        toggleButton.style = `
          padding: 10px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 14px;
          cursor: pointer;
        `;
        toggleButton.addEventListener("click", toggleExtensionUI);
        controlsContainer.appendChild(toggleButton);
      };

      createNavButtons();

      // Highlight elements
      if (highestMatch.element) {
        highestMatch.element.style.border = "3px solid #28a745";
      }
      if (lowestPriceDiff.element) {
        lowestPriceDiff.element.style.border = "3px solid #ffc107";
      }
      if (highestMatch.element === lowestPriceDiff.element) {
        highestMatch.element.style.border = "3px solid purple";
      }
    });
  }
}, 1000);

// Function to add Idealo button
function addIdealoButton(titleElement) {
  const productTitle = titleElement.innerText.trim();
  const idealoButton = document.createElement("a");
  idealoButton.innerText = "🔍 Search on Idealo";
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
      font-size: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      position: relative;
    `;
  titleElement.parentElement.appendChild(idealoButton);
}
