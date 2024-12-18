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
      const amazonPrice = parseFloat(`${wholePart}${fractionPart}`);

      chrome.storage.local.set({ amazonPrice }, () => {});
      addIdealoButton(titleElement);
    }
  } else if (currentUrl.includes("idealo.de/preisvergleich/")) {
    chrome.storage.local.get(["amazonPrice"], (result) => {
      const amazonPrice = result.amazonPrice;

      const searchQuery = new URL(window.location.href).searchParams.get("q");
      if (!searchQuery) return;

      const resultItems = document.querySelectorAll(
        '[data-testid="resultItem"]:has(.sr-productSummary__title_f5flP)'
      );

      let highestMatch = { element: null, value: 0 };
      let lowestPriceDiff = { element: null, value: Number.POSITIVE_INFINITY };

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

          // Create annotation container
          const annotationContainer = document.createElement("div");
          annotationContainer.setAttribute("data-extension-ui", "true");
          annotationContainer.style = `
            display: flex;
            flex-direction: column;
            gap: 5px;
            position: absolute;
            top: 0.5rem;
            left: 0.3rem;
            z-index: 9999;
          `;

          // Match Percentage Annotation
          const matchAnnotation = document.createElement("span");
          matchAnnotation.textContent = `${matchPercentage}% match`;
          matchAnnotation.classList.add("extension-annotation");
          matchAnnotation.style = `
            display: flex;
            padding: 5px;
            background-color: ${
              matchPercentage >= 90
                ? "rgba(76, 175, 80, 0.7)" // green
                : matchPercentage >= 80
                ? "rgba(255, 193, 7, 0.7)" // yellow
                : "#E0E0E0" // gray
            };
            color: white;
            font-size: 12px;
            font-weight: bold;
            align-items: center;
            justify-content: center;
            border-radius: 3px;
          `;
          annotationContainer.appendChild(matchAnnotation);

          // Price Difference Annotation
          if (priceDifference !== null) {
            const priceDiffAnnotation = document.createElement("span");
            priceDiffAnnotation.textContent = `€${priceDifference}`;
            priceDiffAnnotation.classList.add(
              "extension-annotation",
              "lowest-price-highlight"
            );
            priceDiffAnnotation.style = `
              display: flex;
              padding: 5px;
              background-color: ${
                priceDifference < 0
                  ? "rgba(76, 175, 80, 0.7)" // green for better deal
                  : "rgba(244, 67, 54, 0.7)" // red for worse deal
              };
              color: white;
              font-size: 12px;
              font-weight: bold;
              align-items: center;
              justify-content: center;
              border-radius: 3px;
            `;
            annotationContainer.appendChild(priceDiffAnnotation);

            // Highlight the lowest price difference
            if (
              parseFloat(priceDifference) < lowestPriceDiff.value &&
              !isNaN(priceDifference)
            ) {
              lowestPriceDiff = {
                element: resultItem,
                value: parseFloat(priceDifference),
              };
              priceDiffAnnotation.style.backgroundColor =
                "rgba(0, 128, 0, 0.9)";
            }
          }

          // Ensure the resultItem container has relative positioning
          resultItem.style.position = "relative";
          resultItem.appendChild(annotationContainer);

          // Update highest match percentage
          if (matchPercentage > highestMatch.value) {
            highestMatch = { element: resultItem, value: matchPercentage };
          }
        }
      });

      const toggleExtensionUI = () => {
        const extensionElements = document.querySelectorAll(
          '[data-extension-ui="true"], .extension-annotation'
        );

        if (extensionElements.length > 0) {
          const currentDisplay = extensionElements[0].style.display || "flex";
          const newDisplay = currentDisplay === "none" ? "flex" : "none";

          extensionElements.forEach((element) => {
            element.style.display = newDisplay;
          });
        }
      };

      const navigateToElement = (element, label) => {
        if (element) {
          const linkElement = element.querySelector("a");
          if (linkElement) {
            linkElement.click();
            return;
          }

          const buttonElement = element.querySelector(
            "button.sr-resultItemLink__button_k3jEE"
          );
          if (buttonElement) {
            buttonElement.click();
          } else {
            console.error(
              `No <a> or <button> found for ${label} inside:`,
              element
            );
          }
        }
      };

      const createNavButtons = () => {
        let controlsContainer = document.querySelector(
          '[data-nav-buttons="true"]'
        );

        if (!controlsContainer) {
          controlsContainer = document.createElement("div");
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
          controlsContainer.setAttribute("data-nav-buttons", "true");
          document.body.appendChild(controlsContainer);
        }

        // Remove existing buttons except for the toggle button
        [...controlsContainer.children].forEach((child) => {
          if (!child.getAttribute("data-toggle-ui")) {
            controlsContainer.removeChild(child);
          }
        });

        // Add Closest Match button
        if (highestMatch.element) {
          const closestMatchButton = document.createElement("button");
          closestMatchButton.textContent = "Closest Match";
          closestMatchButton.style = `
            padding: 10px;
            background-color: rgba(76, 175, 80, 0.8);
            color: #FFFFFF;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
          `;
          closestMatchButton.addEventListener("click", () =>
            navigateToElement(highestMatch.element, "Closest Match")
          );
          controlsContainer.appendChild(closestMatchButton);
        }

        // Add Best Deal button
        if (lowestPriceDiff.element) {
          const bestDealButton = document.createElement("button");
          bestDealButton.textContent = "Best Deal";
          bestDealButton.style = `
            padding: 10px;
            background-color: rgba(255, 193, 7, 0.8);
            color: #FFFFFF;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
          `;
          bestDealButton.addEventListener("click", () =>
            navigateToElement(lowestPriceDiff.element, "Best Deal")
          );
          controlsContainer.appendChild(bestDealButton);
        }

        // Add Toggle UI button if not already present
        if (!document.querySelector('[data-toggle-ui="true"]')) {
          const toggleButton = document.createElement("button");
          toggleButton.textContent = "Toggle UI";
          toggleButton.style = `
            padding: 10px;
            background-color: rgba(30, 136, 229, 0.8);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
          `;
          toggleButton.setAttribute("data-toggle-ui", "true");
          toggleButton.addEventListener("click", toggleExtensionUI);
          controlsContainer.appendChild(toggleButton);
        }
      };

      createNavButtons();
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
    background-color: rgba(255, 193, 7, 0.8);
    color: black;
    text-decoration: none;
    border-radius: 5px;
    font-size: 14px;
    cursor: pointer;
  `;
  titleElement.parentElement.appendChild(idealoButton);
}
