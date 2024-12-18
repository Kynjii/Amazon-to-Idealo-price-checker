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
          matchAnnotation.textContent = `${matchPercentage}%`;
          matchAnnotation.classList.add("extension-annotation"); // Add class
          matchAnnotation.style = `
            display: flex;
            padding: 5px;
            background-color: ${
              matchPercentage >= 90
                ? "green"
                : matchPercentage >= 80
                ? "#FFCC80"
                : matchPercentage >= 0
                ? "#E0E0E0"
                : "#dc3545"
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
            priceDiffAnnotation.classList.add("extension-annotation"); // Add class
            priceDiffAnnotation.style = `
              display: flex;
              padding: 5px;
              background-color: ${priceDifference < 0 ? "#A5D6A7" : "#EF9A9A"};
              color: white;
              font-size: 12px;
              font-weight: bold;
              align-items: center;
              justify-content: center;
              border-radius: 3px;
            `;
            annotationContainer.appendChild(priceDiffAnnotation);

            // Update lowest price difference
            if (priceDifference !== null && !isNaN(priceDifference)) {
              const numericPriceDifference = parseFloat(priceDifference);
              if (numericPriceDifference < lowestPriceDiff.value) {
                lowestPriceDiff = {
                  element: resultItem,
                  value: numericPriceDifference,
                };
              }
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

      const navigateToElement = (element, label) => {
        if (element) {
          // Try finding an <a> tag first
          const linkElement = element.querySelector("a");
          if (linkElement) {
            linkElement.click();
            return;
          }

          // Fallback to <button> if no <a> is found
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
        } else {
          console.error(`No highlighted ${label} element.`);
        }
      };

      const highlightClosestMatch = () =>
        navigateToElement(highestMatch.element, "Closest Match");

      const highlightBestDeal = () =>
        navigateToElement(lowestPriceDiff.element, "Best Deal");

      const toggleExtensionUI = () => {
        // Select all extension-created elements except the nav buttons
        const extensionElements = document.querySelectorAll(
          '[data-extension-ui="true"]:not([data-product-container="true"]), .extension-annotation, highlighted-element'
        );

        if (extensionElements.length > 0) {
          const currentDisplay = extensionElements[0].style.display || "flex"; // Default to "flex"
          const newDisplay = currentDisplay === "none" ? "flex" : "none";

          extensionElements.forEach((element) => {
            if (newDisplay === "none") {
              // Reset specific styles for highlights
              if (element.classList.contains("highlighted-element")) {
                element.style.border = "none"; // Remove the border
                element.style.backgroundColor = "transparent"; // Remove background
              }
            } else {
              // Restore styles for highlights
              if (element.classList.contains("highlighted-element")) {
                element.style.border = element.dataset.originalBorder || ""; // Restore border
                element.style.backgroundColor =
                  element.dataset.originalBackground || ""; // Restore background
              }
              if (element.classList.contains("extension-annotation")) {
                element.style.display = "flex"; // Show annotations
              }
            }
            element.style.display = newDisplay;
          });
        } else {
          console.warn("No extension UI elements found to toggle.");
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
            background-color: #A5D6A7;
            color: #4F4F4F;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
            transition: background-color 0.2s ease-in-out;
          `;
          closestMatchButton.addEventListener("mouseover", () => {
            closestMatchButton.style.backgroundColor = "#45c765"; // Brighter green
            closestMatchButton.style.color = "black"; // Black text
            if (highestMatch.element) {
              highestMatch.element.style.backgroundColor =
                "rgba(165,214,167, 0.4)"; // Slightly brighter green
              highestMatch.element.style.border = "3px solid #28a745"; // Green border
            }
          });
          closestMatchButton.addEventListener("mouseout", () => {
            closestMatchButton.style.backgroundColor = "#A5D6A7"; // Original green
            closestMatchButton.style.color = "#4F4F4F"; // Original text color
            if (highestMatch.element) {
              highestMatch.element.style.backgroundColor =
                "rgba(165,214,167, 0.2)"; // Restore original background
              highestMatch.element.style.border = "3px dashed green"; // Restore original border
            }
          });
          closestMatchButton.addEventListener("click", highlightClosestMatch);
          controlsContainer.appendChild(closestMatchButton);
        }

        // Add Best Deal button
        if (lowestPriceDiff.element) {
          const bestDealButton = document.createElement("button");
          bestDealButton.textContent = "Best Deal";
          bestDealButton.style = `
            padding: 10px;
            background-color: #FFD180;
            color: #4F4F4F;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            margin-top: 5px;
            cursor: pointer;
            transition: background-color 0.2s ease-in-out;
          `;

          // Add hover effect
          bestDealButton.addEventListener("mouseover", () => {
            bestDealButton.style.backgroundColor = "#ffd740"; // Brighter yellow
            bestDealButton.style.color = "black"; // Black text
            if (lowestPriceDiff.element) {
              lowestPriceDiff.element.style.backgroundColor =
                "rgba(255,209,128, 0.4)"; // Slightly brighter yellow
              lowestPriceDiff.element.style.border = "3px solid #ffc107"; // Yellow border
            }
          });
          bestDealButton.addEventListener("mouseout", () => {
            bestDealButton.style.backgroundColor = "#FFD180"; // Original yellow
            bestDealButton.style.color = "#4F4F4F"; // Original text color
            if (lowestPriceDiff.element) {
              lowestPriceDiff.element.style.backgroundColor =
                "rgba(255,209,128, 0.2)"; // Restore original background
              lowestPriceDiff.element.style.border = "3px dashed orange"; // Restore original border
            }
          });

          bestDealButton.addEventListener("click", highlightBestDeal);
          controlsContainer.appendChild(bestDealButton);
        }

        // Add Toggle UI button if not already present
        if (!document.querySelector('[data-toggle-ui="true"]')) {
          const toggleButton = document.createElement("button");
          toggleButton.textContent = "Toggle UI";
          toggleButton.style = `
            padding: 10px;
            background-color: #BBDEFB;
            color: #4F4F4F;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
            transition: background-color 0.2s ease-in-out;
          `;

          // Add hover effect
          toggleButton.setAttribute("data-toggle-ui", "true");
          toggleButton.addEventListener("mouseover", () => {
            toggleButton.style.backgroundColor = "#3399ff"; // Brighter blue
            toggleButton.style.color = "black"; // Black text
          });
          toggleButton.addEventListener("mouseout", () => {
            toggleButton.style.backgroundColor = "#BBDEFB"; // Original blue
            toggleButton.style.color = "#4F4F4F"; // Original text color
          });

          toggleButton.setAttribute("data-toggle-ui", "true");
          toggleButton.addEventListener("click", toggleExtensionUI);
          controlsContainer.appendChild(toggleButton);
        }
      };

      // Apply highlights and add specific classes for toggling
      if (highestMatch.element) {
        highestMatch.element.classList.add("highlighted-element");
        highestMatch.element.setAttribute("data-product-container", "true");
        highestMatch.element.style.border = "3px dashed green";
        highestMatch.element.style.boxStyle = "0 0 5px rgba(0, 0, 0, 0.2)";
        highestMatch.element.style.backgroundColor = "rgba(165,214,167, 0.2)";
      }
      if (lowestPriceDiff.element) {
        lowestPriceDiff.element.classList.add("highlighted-element");
        lowestPriceDiff.element.setAttribute("data-product-container", "true");
        lowestPriceDiff.element.style.border = "3px dashed orange";
        lowestPriceDiff.element.style.boxStyle = "0 0 5px rgba(0, 0, 0, 0.2)";
        lowestPriceDiff.element.style.backgroundColor =
          "rgba(255,209,128, 0.2)";
      }
      if (highestMatch.element === lowestPriceDiff.element) {
        highestMatch.element.classList.add("highlighted-element");
        highestMatch.element.setAttribute("data-product-container", "true");
        highestMatch.element.style.border = "3px dashed #800080";
        highestMatch.element.style.boxStyle = "0 0 5px rgba(0, 0, 0, 0.2)";
        highestMatch.element.style.backgroundColor = "rgba(128, 0, 128, 0.2)";
      }

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
      margin: 8px 2px;
      padding: 0px 8px;
      background-color: #FFD180;
      color: #4F4F4F;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      font-size: 0.75rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      position: relative;
    `;

  // Add hover effect
  idealoButton.addEventListener("mouseover", () => {
    idealoButton.style.backgroundColor = "#FF8C00"; // orange
    idealoButton.style.color = "black"; // Black text
    idealoButton.style.transform = "scale(1.05)"; // Slightly enlarge
  });
  idealoButton.addEventListener("mouseout", () => {
    idealoButton.style.backgroundColor = "#FFD180"; // Original orange
    idealoButton.style.color = "#4F4F4F"; // Original text color
    idealoButton.style.transform = "scale(1)"; // Restore original size
  });

  titleElement.parentElement.appendChild(idealoButton);
}
