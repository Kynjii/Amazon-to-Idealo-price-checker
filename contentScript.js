// Cosine similarity function
const cosine = {
  similarity: function (s1, s2) {
    const terms = Array.from(new Set([...s1.split(""), ...s2.split("")]));
    const vec1 = terms.map((term) => s1.split(term).length - 1);
    const vec2 = terms.map((term) => s2.split(term).length - 1);

    const dotProduct = vec1.reduce((acc, cur, i) => acc + cur * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((acc, cur) => acc + cur ** 2, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((acc, cur) => acc + cur ** 2, 0));

    return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
  },
};

// Function to extract price from a generic text string
function extractPrice(priceText) {
  const priceMatch = priceText.match(/\d+[.,]?\d*/);
  return priceMatch ? parseFloat(priceMatch[0].replace(",", ".")) : null;
}

setTimeout(() => {
  // Helper to refresh mydealz merchant filter
  function refreshMyDealzMerchantFilter() {
    try {
      const productCards = Array.from(document.querySelectorAll('article[data-t="thread"]'));
      const merchantNames = new Set();
      const cardMerchantMap = new Map();

      productCards.forEach((card) => {
        const merchantLink = card.querySelector('a[data-t="merchantLink"]');
        if (merchantLink) {
          const merchantName = merchantLink.textContent.trim();
          merchantNames.add(merchantName);
          cardMerchantMap.set(card, merchantName);
        }
      });

      console.log("Mydealz: Found", merchantNames.size, "merchants");

      // Remove old filter container and icon if present
      const oldContainer = document.querySelector('[data-mydealz-merchant-filter="true"]');
      if (oldContainer) oldContainer.remove();
      const oldIcon = document.querySelector('[data-mydealz-merchant-filter-icon="true"]');
      if (oldIcon) oldIcon.remove();

      // Load saved state
      chrome.storage.local.get(["mydealzFilterOpen", "mydealzSelectedMerchants"], (result) => {
        const savedOpen = result.mydealzFilterOpen || false;
        const savedSelections = result.mydealzSelectedMerchants || [];

        // Combine current merchants with saved selections to always show saved items
        const allMerchantNames = new Set([...merchantNames, ...savedSelections]);

        // Create filter icon
        const iconBtn = document.createElement("button");
        iconBtn.setAttribute("data-mydealz-merchant-filter-icon", "true");
        iconBtn.title = "Imi Filter öffnen";
        iconBtn.style = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 1001;
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 50%;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      cursor: pointer;
      padding: 0;
    `;
        iconBtn.innerHTML = `<img src="${chrome.runtime.getURL("DeanHead.png")}" width="25" height="25" style="border-radius: 50%;">`;
        document.body.appendChild(iconBtn);

        // Add a simple click handler for debugging
        iconBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
        });

        // Create filter panel (hidden by default)
        if (allMerchantNames.size > 0) {
          let filterContainer = document.createElement("div");
          filterContainer.setAttribute("data-mydealz-merchant-filter", "true");
          filterContainer.setAttribute("data-mydealz-merchant-filter-panel", "true");
          filterContainer.style = `
        position: fixed;
        top: 60px;
        right: 16px;
        z-index: 1000;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 14px;
        color: #333;
        width: 280px;
        max-height: 400px;
        display: none;
        flex-direction: column;
        opacity: 0;
        transform: translateY(-10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      `;

          const label = document.createElement("label");
          label.textContent = "Imi Filter";
          label.style = `
        font-weight: bold;
        margin-bottom: 12px;
        color: #333;
        font-size: 16px;
      `;
          filterContainer.appendChild(label);

          const closeBtn = document.createElement("button");
          closeBtn.textContent = "×";
          closeBtn.title = "Schließen";
          closeBtn.style = `
        position: absolute;
        top: 8px;
        right: 12px;
        background: none;
        border: none;
        font-size: 20px;
        color: #666;
        cursor: pointer;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
          filterContainer.appendChild(closeBtn);

          const checkboxList = document.createElement("div");
          checkboxList.style = `
        overflow-y: auto;
        max-height: 300px;
        width: 100%;
      `;

          // Sort merchant names: selected ones first, then alphabetical
          const sortedMerchantNames = Array.from(allMerchantNames).sort((a, b) => {
            const aSelected = savedSelections.includes(a);
            const bSelected = savedSelections.includes(b);

            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            return a.localeCompare(b);
          });

          sortedMerchantNames.forEach((name) => {
            // Count current results for this merchant
            const resultCount = Array.from(productCards).filter((card) => {
              const merchantLink = card.querySelector('a[data-t="merchantLink"]');
              return merchantLink && merchantLink.textContent.trim() === name;
            }).length;

            const wrapper = document.createElement("div");
            wrapper.style = `
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          padding: 4px 0;
        `;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = name;
            checkbox.id = `mydealz-merchant-filter-${name.replace(/\s+/g, "-")}`;
            checkbox.checked = savedSelections.includes(name);

            const checkboxLabel = document.createElement("label");
            checkboxLabel.textContent = `${name} (${resultCount})`;
            checkboxLabel.setAttribute("for", checkbox.id);
            checkboxLabel.style = `
          margin-left: 8px;
          color: #333;
          cursor: pointer;
          flex: 1;
        `;

            // Add visual indicator for selected items
            if (savedSelections.includes(name)) {
              wrapper.style.fontWeight = "bold";
              wrapper.style.backgroundColor = "#f0f8ff";
              wrapper.style.borderRadius = "4px";
              wrapper.style.padding = "6px 4px";
            }

            wrapper.appendChild(checkbox);
            wrapper.appendChild(checkboxLabel);
            checkboxList.appendChild(wrapper);
          });
          filterContainer.appendChild(checkboxList);
          document.body.appendChild(filterContainer);

          function updateFilter() {
            const checked = Array.from(checkboxList.querySelectorAll('input[type="checkbox"]:checked')).map((cb) => cb.value);
            // Save selections
            chrome.storage.local.set({ mydealzSelectedMerchants: checked });

            productCards.forEach((card) => {
              if (checked.length === 0 || checked.includes(cardMerchantMap.get(card))) {
                card.style.display = "";
              } else {
                card.style.display = "none";
              }
            });
          }
          checkboxList.addEventListener("change", updateFilter);

          // Apply initial filter based on saved selections
          updateFilter();

          // Restore open state
          if (savedOpen) {
            filterContainer.style.display = "flex";
            setTimeout(() => {
              filterContainer.style.opacity = "1";
              filterContainer.style.transform = "translateY(0)";
            }, 10);
            iconBtn.title = "Imi Filter schließen";
          }

          // Show/hide logic with toggle functionality
          iconBtn.addEventListener("click", () => {
            const isVisible = filterContainer.style.display === "flex";
            if (isVisible) {
              // Hide the filter
              filterContainer.style.opacity = "0";
              filterContainer.style.transform = "translateY(-10px)";
              setTimeout(() => {
                filterContainer.style.display = "none";
              }, 300);
              iconBtn.title = "Imi Filter öffnen";
              chrome.storage.local.set({ mydealzFilterOpen: false });
            } else {
              // Show the filter
              filterContainer.style.display = "flex";
              setTimeout(() => {
                filterContainer.style.opacity = "1";
                filterContainer.style.transform = "translateY(0)";
              }, 10);
              iconBtn.title = "Imi Filter schließen";
              chrome.storage.local.set({ mydealzFilterOpen: true });
            }
          });

          closeBtn.addEventListener("click", () => {
            filterContainer.style.opacity = "0";
            filterContainer.style.transform = "translateY(-10px)";
            setTimeout(() => {
              filterContainer.style.display = "none";
            }, 300);
            iconBtn.title = "Imi Filter öffnen";
            chrome.storage.local.set({ mydealzFilterOpen: false });
          });

          // Click outside to close (but not on navigation/pagination elements)
          document.addEventListener("mousedown", (e) => {
            if (filterContainer.style.display === "flex" && !filterContainer.contains(e.target) && !iconBtn.contains(e.target)) {
              // Don't close if clicking on pagination or navigation elements
              const isPaginationClick = e.target.closest("a[href]") || e.target.closest('[class*="pagination"]') || e.target.closest('[class*="nav"]') || e.target.closest("button");

              if (!isPaginationClick) {
                filterContainer.style.opacity = "0";
                filterContainer.style.transform = "translateY(-10px)";
                setTimeout(() => {
                  filterContainer.style.display = "none";
                }, 300);
                iconBtn.title = "Imi Filter öffnen";
                chrome.storage.local.set({ mydealzFilterOpen: false });
              } else {
                console.log("Mydealz: Ignoring pagination/navigation click");
              }
            }
          });
        }
      }); // Close chrome.storage.local.get callback
    } catch (error) {
      console.error("Mydealz filter error:", error);
    }
  }

  // Helper to refresh filter dropdown
  function refreshBestDealFilter() {
    const productCards = Array.from(document.querySelectorAll(".sr-resultList__item_m6xdA"));
    const filterNames = new Set();
    const cardFilterMap = new Map();
    productCards.forEach((card) => {
      const bestDealElement = card.querySelector('[aria-label="Best-Deal"]');
      if (bestDealElement) {
        const img = bestDealElement.querySelector('img[alt^="Best-Deal von "]');
        if (img) {
          const altText = img.getAttribute("alt");
          const match = altText.match(/Best-Deal von (.+)/);
          if (match) {
            const filterName = match[1];
            filterNames.add(filterName);
            cardFilterMap.set(card, filterName);
          }
        }
      }
    });

    // Preserve current state before removing old elements
    const oldContainer = document.querySelector('[data-best-deal-filter="true"]');
    const oldIcon = document.querySelector('[data-best-deal-filter-icon="true"]');

    if (oldContainer && oldIcon) {
      // Check if filter is currently open
      const currentOpen = oldContainer.style.display === "flex";
      // Get current checkbox selections
      const checkboxes = oldContainer.querySelectorAll('input[type="checkbox"]:checked');
      const currentSelections = Array.from(checkboxes).map((cb) => cb.value);

      // Save current state before removal
      chrome.storage.local.set({
        idealoBestDealFilterOpen: currentOpen,
        idealoSelectedProviders: currentSelections,
      });
    }

    // Remove old filter container and icon if present
    if (oldContainer) oldContainer.remove();
    if (oldIcon) oldIcon.remove();

    // Load saved state (like mydealz does)
    chrome.storage.local.get(["idealoBestDealFilterOpen", "idealoSelectedProviders"], (result) => {
      const savedOpen = result.idealoBestDealFilterOpen || false;
      const savedSelections = result.idealoSelectedProviders || [];

      // Combine current filter names with saved selections to always show saved items
      const allFilterNames = new Set([...filterNames, ...savedSelections]);

      // Create filter icon
      const iconBtn = document.createElement("button");
      iconBtn.setAttribute("data-best-deal-filter-icon", "true");
      iconBtn.title = "Imi Filter öffnen";
      iconBtn.style = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 1001;
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 50%;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      cursor: pointer;
      padding: 0;
    `;
      iconBtn.innerHTML = `<img src="${chrome.runtime.getURL("DeanHead.png")}" width="25" height="25" style="border-radius: 50%;">`;
      document.body.appendChild(iconBtn);

      // Create filter panel (hidden by default)
      if (allFilterNames.size > 0) {
        let filterContainer = document.createElement("div");
        filterContainer.setAttribute("data-best-deal-filter", "true");
        filterContainer.setAttribute("data-best-deal-filter-panel", "true");
        filterContainer.style = `
        position: fixed;
        top: 60px;
        right: 16px;
        z-index: 1000;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 14px;
        color: #333;
        width: 280px;
        max-height: 400px;
        display: none;
        flex-direction: column;
        opacity: 0;
        transform: translateY(-10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      `;

        const label = document.createElement("label");
        label.textContent = "Imi Filter";
        label.style = `
        font-weight: bold;
        margin-bottom: 12px;
        color: #333;
        font-size: 16px;
      `;
        filterContainer.appendChild(label);

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "×";
        closeBtn.title = "Schließen";
        closeBtn.style = `
        position: absolute;
        top: 8px;
        right: 12px;
        background: none;
        border: none;
        font-size: 20px;
        color: #666;
        cursor: pointer;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
        filterContainer.appendChild(closeBtn);

        const checkboxList = document.createElement("div");
        checkboxList.style = `
        overflow-y: auto;
        max-height: 300px;
        width: 100%;
      `;

        // Sort filter names: selected ones first, then alphabetical
        const sortedFilterNames = Array.from(allFilterNames).sort((a, b) => {
          const aSelected = savedSelections.includes(a);
          const bSelected = savedSelections.includes(b);

          if (aSelected && !bSelected) return -1;
          if (!aSelected && bSelected) return 1;
          return a.localeCompare(b);
        });

        sortedFilterNames.forEach((name) => {
          // Count current results for this provider
          const resultCount = Array.from(productCards).filter((card) => {
            const bestDealElement = card.querySelector('[aria-label="Best-Deal"]');
            if (bestDealElement) {
              const img = bestDealElement.querySelector('img[alt^="Best-Deal von "]');
              if (img) {
                const altText = img.getAttribute("alt");
                const match = altText.match(/Best-Deal von (.+)/);
                return match && match[1] === name;
              }
            }
            return false;
          }).length;

          const wrapper = document.createElement("div");
          wrapper.style = `
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          padding: 4px 0;
        `;

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.value = name;
          checkbox.id = `bestdeal-filter-${name.replace(/\s+/g, "-")}`;
          checkbox.checked = savedSelections.includes(name);

          const checkboxLabel = document.createElement("label");
          checkboxLabel.textContent = `${name} (${resultCount})`;
          checkboxLabel.setAttribute("for", checkbox.id);
          checkboxLabel.style = `
          margin-left: 8px;
          color: #333;
          cursor: pointer;
          flex: 1;
        `;

          // Add visual indicator for selected items
          if (savedSelections.includes(name)) {
            wrapper.style.fontWeight = "bold";
            wrapper.style.backgroundColor = "#f0f8ff";
            wrapper.style.borderRadius = "4px";
            wrapper.style.padding = "6px 4px";
          }

          wrapper.appendChild(checkbox);
          wrapper.appendChild(checkboxLabel);
          checkboxList.appendChild(wrapper);
        });
        filterContainer.appendChild(checkboxList);
        document.body.appendChild(filterContainer);

        function updateFilter() {
          const checked = Array.from(checkboxList.querySelectorAll('input[type="checkbox"]:checked')).map((cb) => cb.value);
          // Save selections
          chrome.storage.local.set({ idealoSelectedProviders: checked });

          productCards.forEach((card) => {
            if (checked.length === 0 || checked.includes(cardFilterMap.get(card))) {
              card.style.display = "";
            } else {
              card.style.display = "none";
            }
          });
        }
        checkboxList.addEventListener("change", updateFilter);

        // Apply initial filter based on saved selections
        updateFilter();

        // Restore open state
        if (savedOpen) {
          filterContainer.style.display = "flex";
          setTimeout(() => {
            filterContainer.style.opacity = "1";
            filterContainer.style.transform = "translateY(0)";
          }, 10);
          iconBtn.title = "Imi Filter schließen";
        }

        // Show/hide logic with toggle functionality
        iconBtn.addEventListener("click", () => {
          const isVisible = filterContainer.style.display === "flex";
          if (isVisible) {
            // Hide the filter
            filterContainer.style.opacity = "0";
            filterContainer.style.transform = "translateY(-10px)";
            setTimeout(() => {
              filterContainer.style.display = "none";
            }, 300);
            iconBtn.title = "Imi Filter öffnen";
            chrome.storage.local.set({ idealoBestDealFilterOpen: false });
          } else {
            // Show the filter
            filterContainer.style.display = "flex";
            setTimeout(() => {
              filterContainer.style.opacity = "1";
              filterContainer.style.transform = "translateY(0)";
            }, 10);
            iconBtn.title = "Imi Filter schließen";
            chrome.storage.local.set({ idealoBestDealFilterOpen: true });
          }
        });

        closeBtn.addEventListener("click", () => {
          filterContainer.style.opacity = "0";
          filterContainer.style.transform = "translateY(-10px)";
          setTimeout(() => {
            filterContainer.style.display = "none";
          }, 300);
          iconBtn.title = "Imi Filter öffnen";

          // Save closed state
          chrome.storage.local.set({ idealoBestDealFilterOpen: false });
        });

        // Click outside to close (but not on navigation/pagination elements)
        document.addEventListener("mousedown", (e) => {
          if (filterContainer.style.display === "flex" && !filterContainer.contains(e.target) && !iconBtn.contains(e.target)) {
            // Don't close if clicking on pagination or navigation elements
            const isPaginationClick = e.target.closest("a.sr-pageArrow_HufQY") || e.target.closest('[class*="pagination"]') || e.target.closest('[class*="nav"]') || e.target.closest("a[href]");

            if (!isPaginationClick) {
              filterContainer.style.opacity = "0";
              filterContainer.style.transform = "translateY(-10px)";
              setTimeout(() => {
                filterContainer.style.display = "none";
              }, 300);
              iconBtn.title = "Imi Filter öffnen";

              // Save closed state
              chrome.storage.local.set({ idealoBestDealFilterOpen: false });
            } else {
              console.log("Idealo: Ignoring pagination/navigation click");
            }
          }
        });
      }
    }); // Close chrome.storage.local.get callback
  }
  const currentUrl = window.location.href;

  // mydealz.de hot deals page: filter by merchant
  if (currentUrl.includes("mydealz.de/heisseste")) {
    refreshMyDealzMerchantFilter();

    // Set up throttled MutationObserver to refresh filter when content changes
    let observerTimeout;
    let isRefreshing = false;

    const observer = new MutationObserver((mutations) => {
      // Skip if we're already refreshing to prevent infinite loops
      if (isRefreshing) return;

      // Check if any mutations involve article elements (the actual content we care about)
      const hasRelevantChanges = mutations.some((mutation) => {
        // Ignore changes to our own filter elements
        if (mutation.target.hasAttribute && (mutation.target.hasAttribute("data-mydealz-merchant-filter") || mutation.target.hasAttribute("data-mydealz-merchant-filter-icon") || mutation.target.hasAttribute("data-mydealz-merchant-filter-panel"))) {
          return false;
        }

        // Look for changes to article elements or their parents
        return Array.from(mutation.addedNodes).some((node) => node.nodeType === Node.ELEMENT_NODE && (node.tagName === "ARTICLE" || (node.querySelector && node.querySelector('article[data-t="thread"]'))));
      });

      if (!hasRelevantChanges) return;

      // Clear existing timeout and set new one (throttling)
      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        isRefreshing = true;
        refreshMyDealzMerchantFilter();
        // Reset flag after a delay
        setTimeout(() => {
          isRefreshing = false;
        }, 100);
      }, 1000); // Increased delay to reduce frequency
    });

    // Only observe the main content area, not the entire body
    const contentArea = document.querySelector("main") || document.body;
    observer.observe(contentArea, {
      childList: true,
      subtree: true,
    });
  }

  // Idealo Deals page: extract filter names from Best-Deal cards
  if (currentUrl.includes("idealo.de/preisvergleich/deals")) {
    refreshBestDealFilter();
    // Listen for pagination clicks (both arrows and page numbers) to refresh filter
    function addPaginationListener() {
      // Listen for arrow clicks (both next and previous)
      document.querySelectorAll("a.sr-pageArrow_HufQY, a.sr-pageArrow--left_zcrnF").forEach((arrow) => {
        arrow.addEventListener("click", () => {
          // Wait for new content to load, then refresh filter
          setTimeout(() => refreshBestDealFilter(), 500);
        });
      });

      // Listen for page number clicks
      document.querySelectorAll("a.sr-pageElement_S1HzJ").forEach((pageLink) => {
        pageLink.addEventListener("click", () => {
          // Wait for new content to load, then refresh filter
          setTimeout(() => refreshBestDealFilter(), 500);
        });
      });
    }
    addPaginationListener();
    // Also re-add listeners after filter refresh
    const origRefresh = refreshBestDealFilter;
    refreshBestDealFilter = function () {
      origRefresh();
      addPaginationListener();
    };
  }

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
    // Set up price chart detection
    setTimeout(() => setupPriceChartDetection(), 1000);

    chrome.storage.local.get(["amazonPrice"], (result) => {
      const amazonPrice = result.amazonPrice;

      const searchQuery = new URL(window.location.href).searchParams.get("q");
      if (!searchQuery) return;

      const resultItems = document.querySelectorAll('[data-testid="resultItem"]:has(.sr-productSummary__title_f5flP)');

      let highestMatch = { element: null, value: 0 };
      let lowestPriceDiff = { element: null, value: Number.POSITIVE_INFINITY };

      resultItems.forEach((resultItem) => {
        const titleElement = resultItem.querySelector(".sr-productSummary__title_f5flP");
        const priceElement = resultItem.querySelector("[data-testid='detailedPriceInfo__price']");

        if (titleElement && priceElement) {
          const resultTitle = titleElement.textContent.trim();
          const similarity = cosine.similarity(searchQuery, resultTitle);
          const matchPercentage = Math.round(similarity * 100);

          const idealoPrice = extractPrice(priceElement.textContent.replace("ab", "").trim());
          const priceDifference = !isNaN(amazonPrice) && !isNaN(idealoPrice) ? (idealoPrice - amazonPrice).toFixed(2) : null;

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
          matchAnnotation.classList.add("extension-annotation");
          matchAnnotation.style = `
            display: flex;
            padding: 5px;
            background-color: ${matchPercentage >= 90 ? "green" : matchPercentage >= 80 ? "#FFCC80" : matchPercentage >= 0 ? "#E0E0E0" : "#dc3545"};
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
            priceDiffAnnotation.classList.add("extension-annotation", "lowest-price-highlight");
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

            // Reset previous lowestPriceDiff styling
            if (lowestPriceDiff.element) {
              lowestPriceDiff.element.classList.remove("lowest-price-highlight");
              lowestPriceDiff.element.style.backgroundColor = "transparent";
            }

            // Update lowest price difference
            if (priceDifference !== null && !isNaN(priceDifference)) {
              const numericPriceDifference = parseFloat(priceDifference);
              if (numericPriceDifference < lowestPriceDiff.value) {
                if (lowestPriceDiff.element) {
                  lowestPriceDiff.element.classList.remove("lowest-price-highlight");
                  lowestPriceDiff.element.style.backgroundColor = "transparent";
                }

                lowestPriceDiff = {
                  element: resultItem,
                  value: numericPriceDifference,
                };

                lowestPriceDiff.element.classList.add("lowest-price-highlight");
                lowestPriceDiff.element.style.backgroundColor = "#A5D6A7";
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
          const buttonElement = element.querySelector("button.sr-resultItemLink__button_k3jEE");
          if (buttonElement) {
            buttonElement.click();
          } else {
            console.error(`No <a> or <button> found for ${label} inside:`, element);
          }
        } else {
          console.error(`No highlighted ${label} element.`);
        }
      };

      const highlightClosestMatch = () => navigateToElement(highestMatch.element, "Bester Match");

      const highlightBestDeal = () => navigateToElement(lowestPriceDiff.element, "Bestes Deal");

      const toggleExtensionUI = () => {
        const extensionElements = document.querySelectorAll('[data-extension-ui="true"], [data-product-container="true"], .extension-annotation');

        if (extensionElements.length > 0) {
          const currentDisplay = extensionElements[0].style.display || "flex";
          const newDisplay = currentDisplay === "none" ? "flex" : "none";

          extensionElements.forEach((element) => {
            if (newDisplay === "none") {
              // Store current styles before hiding
              if (element.classList.contains("highlighted-element")) {
                element.dataset.originalBorder = element.style.border;
                element.dataset.originalBackground = element.style.backgroundColor;
                element.style.border = "0";
                element.style.backgroundColor = "transparent";
              }
              // Only hide non-product-container elements
              if (!element.hasAttribute("data-product-container")) {
                element.style.display = newDisplay;
              }
            } else {
              // Restore styles for highlights
              if (element.classList.contains("highlighted-element")) {
                element.style.border = element.dataset.originalBorder || "";
                element.style.backgroundColor = element.dataset.originalBackground || "";
              }
              if (element.classList.contains("extension-annotation")) {
                element.style.display = "flex";
              }
              // Only update display for non-product-container elements
              if (!element.hasAttribute("data-product-container")) {
                element.style.display = newDisplay;
              }
            }
          });
        } else {
          console.warn("No extension UI elements found to toggle.");
        }
      };

      const createNavButtons = () => {
        let controlsContainer = document.querySelector('[data-nav-buttons="true"]');

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
          closestMatchButton.textContent = "Bester Match";
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
            closestMatchButton.style.backgroundColor = "#45c765";
            closestMatchButton.style.color = "black";
            if (highestMatch.element) {
              highestMatch.element.style.backgroundColor = "rgba(165,214,167, 0.4)";
              highestMatch.element.style.border = "3px solid #28a745";
            }
          });
          closestMatchButton.addEventListener("mouseout", () => {
            closestMatchButton.style.backgroundColor = "#A5D6A7";
            closestMatchButton.style.color = "#4F4F4F";
            if (highestMatch.element) {
              highestMatch.element.style.backgroundColor = "rgba(165,214,167, 0.2)";
              highestMatch.element.style.border = "3px dashed green";
            }
          });
          closestMatchButton.addEventListener("click", highlightClosestMatch);
          controlsContainer.appendChild(closestMatchButton);
        }

        // Add Best Deal button
        if (lowestPriceDiff.element) {
          const bestDealButton = document.createElement("button");
          bestDealButton.textContent = "Bestes Deal";
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
            bestDealButton.style.backgroundColor = "#ffd740";
            bestDealButton.style.color = "black";
            if (lowestPriceDiff.element) {
              lowestPriceDiff.element.style.backgroundColor = "rgba(255,209,128, 0.4)";
              lowestPriceDiff.element.style.border = "3px solid #ffc107";
            }
          });
          bestDealButton.addEventListener("mouseout", () => {
            bestDealButton.style.backgroundColor = "#FFD180";
            bestDealButton.style.color = "#4F4F4F";
            if (lowestPriceDiff.element) {
              lowestPriceDiff.element.style.backgroundColor = "rgba(255,209,128, 0.2)";
              lowestPriceDiff.element.style.border = "3px dashed orange";
            }
          });

          bestDealButton.addEventListener("click", highlightBestDeal);
          controlsContainer.appendChild(bestDealButton);
        }

        // Add Toggle UI button if not already present
        if (!document.querySelector('[data-toggle-ui="true"]')) {
          const toggleButton = document.createElement("button");
          toggleButton.textContent = "An/Aus";
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
            toggleButton.style.backgroundColor = "#3399ff";
            toggleButton.style.color = "black";
          });
          toggleButton.addEventListener("mouseout", () => {
            toggleButton.style.backgroundColor = "#BBDEFB";
            toggleButton.style.color = "#4F4F4F";
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
        lowestPriceDiff.element.style.backgroundColor = "rgba(255,209,128, 0.2)";
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

// Function to set up price chart detection
function setupPriceChartDetection() {
  // Watch for clicks in the price chart area
  const priceChartContainer = document.querySelector(".oopStage-price-chart");
  if (priceChartContainer) {
    priceChartContainer.addEventListener("click", () => {
      // Add percentages when price chart is clicked
      setTimeout(() => addPriceHistoryPercentages(), 500);
      setTimeout(() => addPriceHistoryPercentages(), 1500);
      setTimeout(() => addPriceHistoryPercentages(), 3000);

      // Set up time button listeners
      setTimeout(() => addTimeButtonListeners(), 1000);
    });
  }

  // Also check if price chart modal is already open
  if (document.querySelector('.priceHistoryStatistics[data-testid="price-history-statistics"]')) {
    addPriceHistoryPercentages();
    addTimeButtonListeners();
  }
}

// Function to add listeners to time period buttons
function addTimeButtonListeners() {
  const timeButtons = document.querySelectorAll('ul[data-testid="header-links-modal-list"] button, ul[data-testid="header-buttons-embedded-list"] button');

  timeButtons.forEach((button) => {
    if (!button.hasAttribute("data-percentage-listener")) {
      button.setAttribute("data-percentage-listener", "true");
      button.addEventListener("click", () => {
        // Clear existing percentages first
        document.querySelectorAll(".price-percentage-change").forEach((el) => el.remove());
        // Refresh percentages after a delay to allow content to update
        setTimeout(() => addPriceHistoryPercentages(), 1000);
        setTimeout(() => addPriceHistoryPercentages(), 2000);
      });
    }
  });
}

// Function to add percentage calculations to price history statistics
function addPriceHistoryPercentages() {
  // Clear any existing percentage elements from previous runs
  document.querySelectorAll(".price-percentage-change").forEach((el) => el.remove());

  const priceHistorySection = document.querySelector('.priceHistoryStatistics[data-testid="price-history-statistics"]');
  if (!priceHistorySection) {
    return;
  }

  const rows = priceHistorySection.querySelectorAll(".priceHistoryStatistics-row");

  rows.forEach((row, index) => {
    const titleElement = row.querySelector(".priceHistoryStatistics-title");
    const valueElement = row.querySelector(".priceHistoryStatistics-amount");
    const changeElement = row.querySelector(".priceHistoryStatistics-change");
    const statusDiv = row.querySelector(".priceHistoryStatistics-status");

    if (!titleElement || !valueElement || !changeElement || !statusDiv) {
      return;
    }

    const valueText = valueElement.textContent.replace(/[^\d,]/g, "").replace(",", ".");
    const changeText = changeElement.textContent.replace(/[^\d,]/g, "").replace(",", ".");

    const currentValue = parseFloat(valueText);
    const changeAmount = parseFloat(changeText);

    if (isNaN(currentValue) || isNaN(changeAmount)) {
      return;
    }

    // The "amount" value is the historical price, "change" is how much it changed to today
    const historicalPrice = currentValue; // This is actually the historical price (0.79€)
    const isIncrease = changeElement.classList.contains("increased");
    const isDecrease = changeElement.classList.contains("decreased");
    const isNeutral = changeElement.classList.contains("neutral");

    if (isNeutral || changeAmount === 0) {
      return;
    }

    // Calculate current price based on historical price + change
    if (isIncrease) {
      // Today's price = historical + change (0.79 + 4.19 = 4.98€)
    } else if (isDecrease) {
      // Today's price = historical - change
    } else {
      return;
    }

    // Calculate percentage change from historical price to current price
    const percentageChange = (changeAmount / historicalPrice) * 100;

    // Check if percentage div already exists in this specific row
    const existingPercentage = row.querySelector(".price-percentage-change");
    if (existingPercentage) {
      existingPercentage.remove();
    }

    // Skip if the calculation results in invalid numbers
    if (!isFinite(percentageChange) || historicalPrice <= 0) {
      return;
    }

    // Create percentage div
    const percentageDiv = document.createElement("div");
    percentageDiv.className = "price-percentage-change";
    percentageDiv.style = `
      font-size: 12px;
      font-weight: bold;
      color: ${isIncrease ? "#dc3545" : "#28a745"};
      margin-bottom: 4px;
    `;

    // Format percentage display properly, handling large numbers
    const formattedPercentage = Math.abs(percentageChange).toFixed(1);
    percentageDiv.textContent = `${isIncrease ? "+" : "-"}${formattedPercentage}%`;

    // Make the row container relative and add percentage as centered overlay
    row.style.position = "relative";

    // Position it absolutely relative to the row, centered but shifted 15% left
    percentageDiv.style = `
      position: absolute;
      top: 50%;
      left: 35%;
      transform: translate(-50%, -50%);
      font-size: 14px;
      font-weight: bold;
      color: ${isIncrease ? "#dc3545" : "#28a745"};
      background: rgba(255, 255, 255, 0.95);
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid ${isIncrease ? "#dc3545" : "#28a745"};
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 10;
      pointer-events: none;
    `;

    row.appendChild(percentageDiv);
  });
}

// Function to extract the Artikelnummer from the Amazon product page
function extractArtikelnummer() {
  const tableRows = document.querySelectorAll("#productDetails_techSpec_section_1 tr");

  for (const row of tableRows) {
    const th = row.querySelector("th");
    const td = row.querySelector("td");

    if (th && td && th.textContent.trim() === "Artikelnummer") {
      return td.textContent.trim();
    }
  }
  return null;
}

// Function to extract the unique identifier from the Amazon URL
function extractAmazonIdentifier() {
  const match = window.location.href.match(/\/dp\/([A-Z0-9]+)/);
  return match ? match[1] : null; // Return the matched identifier or null if not found
}

// Function to add Idealo button
function addIdealoButton(titleElement) {
  const productTitle = titleElement.innerText.trim();
  const artikelnummer = extractArtikelnummer();
  const amazonIdentifier = extractAmazonIdentifier();

  // Construct the search query with the new queries at the start
  const searchQueryParts = [];
  if (artikelnummer) searchQueryParts.push(artikelnummer);
  if (amazonIdentifier) searchQueryParts.push(amazonIdentifier);
  searchQueryParts.push(productTitle);
  const searchQuery = searchQueryParts.map(encodeURIComponent).join(" ");

  const idealoButton = document.createElement("a");
  idealoButton.innerText = "🔍 Suche auf Idealo";
  idealoButton.href = `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=${searchQuery}`;
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
    idealoButton.style.backgroundColor = "#FF8C00";
    idealoButton.style.color = "black";
    idealoButton.style.transform = "scale(1.05)";
  });
  idealoButton.addEventListener("mouseout", () => {
    idealoButton.style.backgroundColor = "#FFD180";
    idealoButton.style.color = "#4F4F4F";
    idealoButton.style.transform = "scale(1)";
  });

  titleElement.parentElement.appendChild(idealoButton);
}
