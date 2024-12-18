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
  console.log("Checking URL after timeout");
  const currentUrl = window.location.href;
  console.log("Current URL:", currentUrl);

  if (currentUrl.includes("amazon")) {
    console.log("Amazon page detected");
    const titleElement = document.getElementById("productTitle");
    if (titleElement) {
      console.log("Product title found:", titleElement.innerText.trim());
      addIdealoButton(titleElement);
    } else {
      console.error("Product title element not found");
    }
  } else if (
    currentUrl.includes("idealo.de/preisvergleich/ProductCategory") ||
    currentUrl.includes("idealo.de/preisvergleich/MainSearchProductCategory")
  ) {
    console.log("Idealo page detected");

    setTimeout(() => {
      const searchQuery = new URL(window.location.href).searchParams.get("q"); // Extract the search query
      if (!searchQuery) {
        console.error("No search query found in URL");
        return;
      }
      console.log("Search query extracted:", searchQuery);

      // Function to add match percentage to each result
      function annotateResults() {
        const resultItems = document.querySelectorAll(
          ".sr-productSummary__title"
        );
        console.log("Number of results found:", resultItems.length);

        resultItems.forEach((titleElement, index) => {
          if (titleElement) {
            const resultTitle = titleElement.textContent.trim();
            console.log(`Result ${index + 1} title:`, resultTitle);

            // Calculate similarity
            const similarity = cosine.similarity(searchQuery, resultTitle);
            const matchPercentage = Math.round(similarity * 100);
            console.log(
              `Result ${index + 1} match percentage:`,
              matchPercentage
            );

            // Determine color based on percentage
            let color;
            if (matchPercentage >= 80) color = "#28a745"; // Green
            else if (matchPercentage >= 60) color = "#ffc107"; // Yellow
            else if (matchPercentage >= 40) color = "#fd7e14"; // Orange
            else color = "#dc3545"; // Red

            // Add annotation
            const annotation = document.createElement("span");
            annotation.textContent = `${matchPercentage}% match`;
            annotation.style = `
              display: inline-block;
              margin-left: 10px;
              padding: 5px;
              background-color: ${color};
              color: white;
              font-size: 12px;
              font-weight: bold;
              border-radius: 3px;
            `;
            titleElement.appendChild(annotation);
          } else {
            console.error(`Title element not found for result ${index + 1}`);
          }
        });
      }

      annotateResults(); // Run the function after DOM is ready
    }, 1500); // Wait 1 second to ensure Idealo content is fully loaded
  } else {
    console.log("Page not recognized for specific functionality");
  }
}, 1000); // Wait 3 seconds to ensure the DOM is fully loaded

// Amazon-specific functionality
function addIdealoButton(titleElement) {
  const productTitle = titleElement.innerText.trim();
  console.log("Adding Idealo button for product title:", productTitle);
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
