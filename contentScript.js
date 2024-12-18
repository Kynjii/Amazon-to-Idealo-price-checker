// Content script for Amazon and Idealo functionality

// Function to dynamically load the string-comparison library (for Idealo-based use)
function loadLibrary(callback) {
  const script = document.createElement("script");
  script.src =
    "https://cdn.jsdelivr.net/npm/string-comparison@latest/dist/string-comparison.min.js";
  script.onload = callback;
  document.head.appendChild(script);
}

// Check the current URL to determine functionality
document.addEventListener("DOMContentLoaded", () => {
  const currentUrl = window.location.href;

  if (currentUrl.includes("amazon")) {
    // Amazon functionality
    console.log("Amazon page detected");
    setTimeout(() => {
      const titleElement = document.getElementById("productTitle");
      if (titleElement) {
        console.log("Product title found:", titleElement.innerText.trim());
        addIdealoButton(titleElement);
      } else {
        console.error("Product title element not found");
      }
    }, 1000); // Wait 1 second to ensure the DOM is fully loaded
  } else if (
    currentUrl.includes("idealo.de/preisvergleich/MainSearchProductCategory")
  ) {
    // Idealo functionality
    console.log("Idealo page detected");
    loadLibrary(() => {
      const searchQuery = new URL(window.location.href).searchParams.get("q"); // Extract the search query
      if (!searchQuery) {
        console.error("No search query found in URL");
        return;
      }
      console.log("Search query extracted:", searchQuery);

      // Function to add match percentage to each result
      function annotateResults() {
        const resultItems = document.querySelectorAll(".offer-list-item"); // Adjust selector to match Idealo's DOM
        console.log("Number of results found:", resultItems.length);
        const similarity = stringComparison.cosine;

        resultItems.forEach((item, index) => {
          const titleElement = item.querySelector(".offer-title"); // Adjust selector to match Idealo's DOM
          if (titleElement) {
            const resultTitle = titleElement.textContent.trim();
            console.log(`Result ${index + 1} title:`, resultTitle);

            // Use string-comparison library to calculate similarity
            const matchPercentage = Math.round(
              similarity.similarity(searchQuery, resultTitle) * 100
            );
            console.log(
              `Result ${index + 1} match percentage:`,
              matchPercentage
            );

            // Determine color based on percentage
            let color;
            if (matchPercentage >= 80) {
              color = "#28a745"; // Green for high match
            } else if (matchPercentage >= 60) {
              color = "#ffc107"; // Yellow for medium match
            } else if (matchPercentage >= 40) {
              color = "#fd7e14"; // Orange for low match
            } else {
              color = "#dc3545"; // Red for very low match
            }

            // Add percentage annotation
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
            console.error(`Result ${index + 1} title element not found`);
          }
        });
      }

      annotateResults(); // Run the function after DOM is ready
    });
  } else {
    console.log("Page not recognized for specific functionality");
  }
});

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
