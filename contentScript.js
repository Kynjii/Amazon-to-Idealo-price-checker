// Content script for Amazon and Idealo functionality

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

// Function to extract price from Amazon price structure
function extractPriceFromAmazon() {
  const priceWholeElement = document.querySelector(".a-price-whole");
  const priceFractionElement = document.querySelector(".a-price-fraction");
  if (priceWholeElement && priceFractionElement) {
    const whole = priceWholeElement.textContent.trim().replace(".", "");
    const fraction = priceFractionElement.textContent.trim();
    return parseFloat(`${whole}.${fraction}`);
  }
  return null;
}

// Function to extract price from Idealo price structure
function extractPriceFromIdealo(priceElement) {
  if (priceElement) {
    const priceText = priceElement.textContent.trim();
    return extractPrice(priceText);
  }
  return null;
}

// Function to extract price from a generic text string (e.g., "€19.99")
function extractPrice(priceText) {
  const priceMatch = priceText.match(/\d+[.,]?\d*/);
  return priceMatch ? parseFloat(priceMatch[0].replace(",", ".")) : null;
}

function highlightBestMatch(resultItems) {
  let highestMatch = { element: null, value: 0 };
  let largestPriceDiff = { element: null, value: -Infinity };

  resultItems.forEach((resultItem) => {
    const matchElement = resultItem.querySelector("[data-match-percentage]");
    const priceDiffElement = resultItem.querySelector(
      "[data-price-difference]"
    );

    if (matchElement) {
      const matchValue = parseInt(
        matchElement.getAttribute("data-match-percentage"),
        10
      );
      if (matchValue > highestMatch.value) {
        highestMatch = { element: matchElement, value: matchValue }; // Target the `span` element
      }
    }

    if (priceDiffElement) {
      const priceDiffValue = parseFloat(
        priceDiffElement.getAttribute("data-price-difference")
      );
      if (priceDiffValue > largestPriceDiff.value) {
        largestPriceDiff = { element: priceDiffElement, value: priceDiffValue }; // Target the `span` element
      }
    }
  });

  if (highestMatch.element) {
    highestMatch.element.style.border = "2px solid #FFD700"; // Highlight highest match
  }

  if (largestPriceDiff.element) {
    largestPriceDiff.element.style.border = "2px solid #FFD700"; // Highlight largest price difference
  }
}

// Check the current URL to determine functionality
setTimeout(() => {
  const currentUrl = window.location.href;

  if (currentUrl.includes("amazon")) {
    setTimeout(() => {
      const titleElement = document.getElementById("productTitle");
      const amazonPrice = extractPriceFromAmazon();

      if (titleElement && amazonPrice !== null) {
        console.log("Amazon price extracted:", amazonPrice);
        titleElement.setAttribute("data-amazon-price", amazonPrice); // Store the Amazon price for later use
        addIdealoButton(titleElement);
      } else {
        console.warn("Title element or price not found on Amazon page.");
      }
    }, 1000);
  } else if (
    currentUrl.includes("idealo.de/preisvergleich/ProductCategory") ||
    currentUrl.includes("idealo.de/preisvergleich/MainSearchProductCategory")
  ) {
    const searchQuery = new URL(window.location.href).searchParams.get("q");
    if (!searchQuery) {
      return;
    }

    // Use MutationObserver to handle dynamically loaded content
    observeDOM(".sr-productSummary__title_f5flP", (resultItems) => {
      resultItems.forEach((titleElement, index) => {
        if (titleElement) {
          const resultTitle = titleElement.textContent.trim();
          const similarity = cosine.similarity(searchQuery, resultTitle);
          const matchPercentage = Math.round(similarity * 100);

<<<<<<< HEAD
    console.log(`Found ${resultItems.length} result items.`);

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

        const idealoPrice = extractPriceFromIdealo(priceElement);
        const amazonPrice = parseFloat(
          document
            .querySelector("[data-amazon-price]")
            ?.getAttribute("data-amazon-price")
        );

        let priceDifference = null;
        if (!isNaN(amazonPrice) && !isNaN(idealoPrice)) {
          priceDifference = (amazonPrice - idealoPrice).toFixed(2);
        }

        let color;
        if (matchPercentage >= 80) color = "#28a745";
        else if (matchPercentage >= 60) color = "#ffc107";
        else if (matchPercentage >= 40) color = "#fd7e14";
        else color = "#dc3545";

        // Create the annotation element
        const annotation = document.createElement("span");
        annotation.textContent = `${matchPercentage}% match`;
        annotation.setAttribute("data-match-percentage", matchPercentage); // Added
        annotation.style = `
          display: inline-block;
          margin-top: 5px;
          padding: 5px;
          background-color: ${color};
          color: white;
          font-size: 12px;
          font-weight: bold;
          border-radius: 3px;
          position: absolute;
          top: 0.5rem;
          left: 0.1rem;
          z-index: 9999;
        `;

        resultItem.appendChild(annotation); // Append match percentage annotation
        console.log(
          `Match percentage annotation appended for result item ${index + 1}`
        );

        /// Append price difference annotation
        if (priceDifference !== null) {
          const priceDiffAnnotation = document.createElement("div");
          priceDiffAnnotation.textContent = `Price Diff: €${priceDifference}`;
          priceDiffAnnotation.setAttribute(
            "data-price-difference",
            priceDifference
          );
          priceDiffAnnotation.style = `
    display: inline-block;
    margin-left: 10px;
    padding: 5px;
    background-color: #007bff;
    color: white;
    font-size: 12px;
    font-weight: bold;
    border-radius: 3px;
    position: absolute;
    top: 1.5rem;
    left: 0.1rem;
    z-index: 9999;
  `;
          resultItem.appendChild(priceDiffAnnotation);

          // Ensure the parent container has relative positioning
          resultItem.style.position = "relative";
        }
      }
=======
          let color;
          if (matchPercentage >= 80) color = "#28a745";
          else if (matchPercentage >= 60) color = "#ffc107";
          else if (matchPercentage >= 40) color = "#fd7e14";
          else color = "#dc3545";

          const annotation = document.createElement("span");
          annotation.textContent = `${matchPercentage}% match`;
          titleElement.style.position = "relative";
          annotation.style = `
            display: inline-block;
            margin-left: 10px;
            padding: 5px;
            background-color: ${color};
            color: white;
            font-size: 12px;
            font-weight: bold;
            border-radius: 3px;
            position: absolute;
            top: 0.5rem;
            left: 0.1rem; 
            z-index: 9999; 
      `;
          // Find the nearest sr-resultList__item_m6xdA container
          const resultItem = titleElement.closest(".sr-resultList__item_m6xdA");
          if (resultItem) {
            resultItem.appendChild(annotation); // Append annotation to the result item
          } else {
            console.error(
              "Could not find sr-resultList__item_m6xdA for this title"
            );
          }
        }
      });
>>>>>>> parent of b37fef7 (working)
    });

    // Highlight best match and largest price difference
    highlightBestMatch(resultItems);
  }
}, 1000);

// MutationObserver function
function observeDOM(selector, callback) {
  const observer = new MutationObserver((mutations, obs) => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      obs.disconnect(); // Stop observing
      callback(elements);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Amazon-specific functionality
function addIdealoButton(titleElement) {
  console.log("Adding Idealo button for:", titleElement.innerText.trim());

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
    line-height: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
    transition: all 0.3s ease;
    position: relative;
    z-index: 9999;
  `;
  idealoButton.addEventListener("mouseover", () => {
    idealoButton.style.backgroundColor = "#e55c00";
    idealoButton.style.boxShadow = "0 6px 8px rgba(0, 0, 0, 0.15)";
    idealoButton.style.transform = "scale(1.05)";
  });

  idealoButton.addEventListener("mouseout", () => {
    idealoButton.style.backgroundColor = "#ff6600";
    idealoButton.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    idealoButton.style.transform = "scale(1)";
  });

  titleElement.parentElement.appendChild(idealoButton);
}
