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

// Check the current URL to determine functionality
setTimeout(() => {
  const currentUrl = window.location.href;

  if (currentUrl.includes("amazon")) {
    const titleElement = document.getElementById("productTitle");
    if (titleElement) {
      addIdealoButton(titleElement);
    }
  } else if (
    currentUrl.includes("idealo.de/preisvergleich/ProductCategory") ||
    currentUrl.includes("idealo.de/preisvergleich/MainSearchProductCategory")
  ) {
    const searchQuery = new URL(window.location.href).searchParams.get("q");
    if (!searchQuery) {
      return;
    }

    // Select all result items that have the product title inside
    const resultItems = document.querySelectorAll(
      '[data-testid="resultItem"]:has(.sr-productSummary__title_f5flP)'
    );

    resultItems.forEach((resultItem, index) => {
      const titleElement = resultItem.querySelector(
        ".sr-productSummary__title_f5flP"
      );
      if (titleElement) {
        const resultTitle = titleElement.textContent.trim();
        const similarity = cosine.similarity(searchQuery, resultTitle);
        const matchPercentage = Math.round(similarity * 100);

        let color;
        if (matchPercentage >= 80) color = "#28a745";
        else if (matchPercentage >= 60) color = "#ffc107";
        else if (matchPercentage >= 40) color = "#fd7e14";
        else color = "#dc3545";

        // Create the annotation element
        const annotation = document.createElement("span");
        annotation.textContent = `${matchPercentage}% match`;
        annotation.style = `
          display: inline-block;
          padding: 5px;
          background-color: ${color};
          color: white;
          font-size: 12px;
          font-weight: bold;
          border-radius: 3px;
          position: absolute;
          top: 0.3rem;
          left: 0.3rem;
          z-index: 9999;
        `;

        // Ensure the parent container has relative positioning
        resultItem.style.position = "relative";

        resultItem.appendChild(annotation); // Append annotation to the result item
      } else {
        console.warn(`Title element not found in result item ${index + 1}`);
      }
    });
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
