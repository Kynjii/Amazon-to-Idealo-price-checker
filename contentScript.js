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
    console.log("Amazon page detected");
    const titleElement = document.getElementById("productTitle");
    const priceElement = document.querySelector(".a-price-whole");
    const fractionElement = document.querySelector(".a-price-fraction");

    if (titleElement && priceElement && fractionElement) {
      const amazonPrice = parseFloat(
        `${priceElement.innerText
          .trim()
          .replace(".", "")}.${fractionElement.innerText.trim()}`
      );

      if (!isNaN(amazonPrice)) {
        console.log("Amazon price extracted:", amazonPrice);
        chrome.storage.local.set({ amazonPrice }, () => {
          console.log("Amazon price saved to storage:", amazonPrice);
        });
      } else {
        console.warn("Failed to parse Amazon price");
      }

      addIdealoButton(titleElement);
    } else {
      console.warn("Amazon price elements not found");
    }
  } else if (currentUrl.includes("idealo.de/preisvergleich/")) {
    console.log("Idealo page detected");
    const searchQuery = new URL(window.location.href).searchParams.get("q");
    console.log("Search query:", searchQuery);

    if (!searchQuery) {
      console.warn("No search query found in URL");
      return;
    }

    chrome.storage.local.get("amazonPrice", (result) => {
      const amazonPrice = result.amazonPrice;
      if (!isNaN(amazonPrice)) {
        console.log("Amazon price retrieved from storage:", amazonPrice);

        const resultItems = document.querySelectorAll(
          '[data-testid="resultItem"]:has(.sr-productSummary__title_f5flP)'
        );

        resultItems.forEach((resultItem, index) => {
          console.log(`Processing result item ${index + 1}`);
          const titleElement = resultItem.querySelector(
            ".sr-productSummary__title_f5flP"
          );
          const priceElement = resultItem.querySelector(
            "[data-testid='detailedPriceInfo__price']"
          );

          if (titleElement && priceElement) {
            const resultTitle = titleElement.textContent.trim();
            console.log("Result title:", resultTitle);

            const similarity = cosine.similarity(searchQuery, resultTitle);
            const matchPercentage = Math.round(similarity * 100);
            console.log("Match percentage:", matchPercentage);

            const idealoPrice = extractPrice(
              priceElement.textContent.replace("ab", "").trim()
            );
            console.log("Idealo price extracted:", idealoPrice);

            const priceDifference =
              !isNaN(amazonPrice) && !isNaN(idealoPrice)
                ? (amazonPrice - idealoPrice).toFixed(2)
                : null;
            console.log("Price difference:", priceDifference);

            const annotationContainer = document.createElement("div");
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
            matchAnnotation.style = `
              display: inline-block;
              padding: 5px;
              background-color: ${
                matchPercentage >= 80
                  ? "#28a745"
                  : matchPercentage >= 60
                  ? "#ffc107"
                  : matchPercentage >= 40
                  ? "#fd7e14"
                  : "#dc3545"
              };
              color: white;
              font-size: 12px;
              font-weight: bold;
              border-radius: 3px;
            `;
            annotationContainer.appendChild(matchAnnotation);

            // Price Difference Annotation
            if (priceDifference !== null) {
              const priceDiffAnnotation = document.createElement("span");
              priceDiffAnnotation.textContent = `Price Diff: €${priceDifference}`;
              priceDiffAnnotation.style = `
                display: inline-block;
                padding: 5px;
                background-color: #007bff;
                color: white;
                font-size: 12px;
                font-weight: bold;
                border-radius: 3px;
              `;
              annotationContainer.appendChild(priceDiffAnnotation);
            } else {
              console.warn("Price difference could not be calculated");
            }

            resultItem.style.position = "relative";
            resultItem.appendChild(annotationContainer);
            console.log(`Annotations appended to result item ${index + 1}`);
          } else {
            console.warn(
              `Title or price element not found for result item ${index + 1}`
            );
          }
        });
      } else {
        console.warn("Amazon price not found in storage");
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
