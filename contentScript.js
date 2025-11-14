const cosine = {
    similarity: function (s1, s2) {
        const terms = Array.from(new Set([...s1.split(""), ...s2.split("")]));
        const vec1 = terms.map((term) => s1.split(term).length - 1);
        const vec2 = terms.map((term) => s2.split(term).length - 1);

        const dotProduct = vec1.reduce((acc, cur, i) => acc + cur * vec2[i], 0);
        const magnitude1 = Math.sqrt(vec1.reduce((acc, cur) => acc + cur ** 2, 0));
        const magnitude2 = Math.sqrt(vec2.reduce((acc, cur) => acc + cur ** 2, 0));

        return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
    }
};

function extractPrice(priceText) {
    const priceMatch = priceText.match(/\d+[.,]?\d*/);
    return priceMatch ? parseFloat(priceMatch[0].replace(",", ".")) : null;
}

setTimeout(() => {
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

            const oldContainer = document.querySelector('[data-mydealz-merchant-filter="true"]');
            if (oldContainer) oldContainer.remove();
            const oldIcon = document.querySelector('[data-mydealz-merchant-filter-icon="true"]');
            if (oldIcon) oldIcon.remove();

            chrome.storage.local.get(["mydealzFilterOpen", "mydealzSelectedMerchants"], (result) => {
                const savedOpen = result.mydealzFilterOpen || false;
                const savedSelections = result.mydealzSelectedMerchants || [];

                const allMerchantNames = new Set([...merchantNames, ...savedSelections]);

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

                iconBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });

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

                    const sortedMerchantNames = Array.from(allMerchantNames).sort((a, b) => {
                        const aSelected = savedSelections.includes(a);
                        const bSelected = savedSelections.includes(b);

                        if (aSelected && !bSelected) return -1;
                        if (!aSelected && bSelected) return 1;
                        return a.localeCompare(b);
                    });

                    sortedMerchantNames.forEach((name) => {
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

                    updateFilter();

                    if (savedOpen) {
                        filterContainer.style.display = "flex";
                        setTimeout(() => {
                            filterContainer.style.opacity = "1";
                            filterContainer.style.transform = "translateY(0)";
                        }, 10);
                        iconBtn.title = "Imi Filter schließen";
                    }

                    iconBtn.addEventListener("click", () => {
                        const isVisible = filterContainer.style.display === "flex";
                        if (isVisible) {
                            filterContainer.style.opacity = "0";
                            filterContainer.style.transform = "translateY(-10px)";
                            setTimeout(() => {
                                filterContainer.style.display = "none";
                            }, 300);
                            iconBtn.title = "Imi Filter öffnen";
                            chrome.storage.local.set({ mydealzFilterOpen: false });
                        } else {
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

                    document.addEventListener("mousedown", (e) => {
                        if (filterContainer.style.display === "flex" && !filterContainer.contains(e.target) && !iconBtn.contains(e.target)) {
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
            });
        } catch (error) {
            console.error("Mydealz filter error:", error);
        }
    }

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

        const oldContainer = document.querySelector('[data-best-deal-filter="true"]');
        const oldIcon = document.querySelector('[data-best-deal-filter-icon="true"]');

        if (oldContainer && oldIcon) {
            const currentOpen = oldContainer.style.display === "flex";

            const checkboxes = oldContainer.querySelectorAll('input[type="checkbox"]:checked');
            const currentSelections = Array.from(checkboxes).map((cb) => cb.value);

            chrome.storage.local.set({
                idealoBestDealFilterOpen: currentOpen,
                idealoSelectedProviders: currentSelections
            });
        }

        if (oldContainer) oldContainer.remove();
        if (oldIcon) oldIcon.remove();

        chrome.storage.local.get(["idealoBestDealFilterOpen", "idealoSelectedProviders"], (result) => {
            const savedOpen = result.idealoBestDealFilterOpen || false;
            const savedSelections = result.idealoSelectedProviders || [];

            const allFilterNames = new Set([...filterNames, ...savedSelections]);

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

                const sortedFilterNames = Array.from(allFilterNames).sort((a, b) => {
                    const aSelected = savedSelections.includes(a);
                    const bSelected = savedSelections.includes(b);

                    if (aSelected && !bSelected) return -1;
                    if (!aSelected && bSelected) return 1;
                    return a.localeCompare(b);
                });

                sortedFilterNames.forEach((name) => {
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

                updateFilter();

                if (savedOpen) {
                    filterContainer.style.display = "flex";
                    setTimeout(() => {
                        filterContainer.style.opacity = "1";
                        filterContainer.style.transform = "translateY(0)";
                    }, 10);
                    iconBtn.title = "Imi Filter schließen";
                }

                iconBtn.addEventListener("click", () => {
                    const isVisible = filterContainer.style.display === "flex";
                    if (isVisible) {
                        filterContainer.style.opacity = "0";
                        filterContainer.style.transform = "translateY(-10px)";
                        setTimeout(() => {
                            filterContainer.style.display = "none";
                        }, 300);
                        iconBtn.title = "Imi Filter öffnen";
                        chrome.storage.local.set({ idealoBestDealFilterOpen: false });
                    } else {
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

                    chrome.storage.local.set({ idealoBestDealFilterOpen: false });
                });

                document.addEventListener("mousedown", (e) => {
                    if (filterContainer.style.display === "flex" && !filterContainer.contains(e.target) && !iconBtn.contains(e.target)) {
                        const isPaginationClick = e.target.closest("a.sr-pageArrow_HufQY") || e.target.closest('[class*="pagination"]') || e.target.closest('[class*="nav"]') || e.target.closest("a[href]");

                        if (!isPaginationClick) {
                            filterContainer.style.opacity = "0";
                            filterContainer.style.transform = "translateY(-10px)";
                            setTimeout(() => {
                                filterContainer.style.display = "none";
                            }, 300);
                            iconBtn.title = "Imi Filter öffnen";

                            chrome.storage.local.set({ idealoBestDealFilterOpen: false });
                        } else {
                            console.log("Idealo: Ignoring pagination/navigation click");
                        }
                    }
                });
            }
        });
    }
    const currentUrl = window.location.href;

    if (currentUrl.includes("mydealz.de/heisseste")) {
        refreshMyDealzMerchantFilter();

        let observerTimeout;
        let isRefreshing = false;

        const observer = new MutationObserver((mutations) => {
            if (isRefreshing) return;

            const hasRelevantChanges = mutations.some((mutation) => {
                if (mutation.target.hasAttribute && (mutation.target.hasAttribute("data-mydealz-merchant-filter") || mutation.target.hasAttribute("data-mydealz-merchant-filter-icon") || mutation.target.hasAttribute("data-mydealz-merchant-filter-panel"))) {
                    return false;
                }

                return Array.from(mutation.addedNodes).some((node) => node.nodeType === Node.ELEMENT_NODE && (node.tagName === "ARTICLE" || (node.querySelector && node.querySelector('article[data-t="thread"]'))));
            });

            if (!hasRelevantChanges) return;

            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
                isRefreshing = true;
                refreshMyDealzMerchantFilter();

                setTimeout(() => {
                    isRefreshing = false;
                }, 100);
            }, 1000);
        });

        const contentArea = document.querySelector("main") || document.body;
        observer.observe(contentArea, {
            childList: true,
            subtree: true
        });
    }

    if (currentUrl.includes("idealo.de/preisvergleich/deals")) {
        refreshBestDealFilter();
        function addPaginationListener() {
            document.querySelectorAll("a.sr-pageArrow_HufQY, a.sr-pageArrow--left_zcrnF").forEach((arrow) => {
                arrow.addEventListener("click", () => {
                    setTimeout(() => refreshBestDealFilter(), 500);
                });
            });

            document.querySelectorAll("a.sr-pageElement_S1HzJ").forEach((pageLink) => {
                pageLink.addEventListener("click", () => {
                    setTimeout(() => refreshBestDealFilter(), 500);
                });
            });
        }
        addPaginationListener();
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

                        if (lowestPriceDiff.element) {
                            lowestPriceDiff.element.classList.remove("lowest-price-highlight");
                            lowestPriceDiff.element.style.backgroundColor = "transparent";
                        }

                        if (priceDifference !== null && !isNaN(priceDifference)) {
                            const numericPriceDifference = parseFloat(priceDifference);
                            if (numericPriceDifference < lowestPriceDiff.value) {
                                if (lowestPriceDiff.element) {
                                    lowestPriceDiff.element.classList.remove("lowest-price-highlight");
                                    lowestPriceDiff.element.style.backgroundColor = "transparent";
                                }

                                lowestPriceDiff = {
                                    element: resultItem,
                                    value: numericPriceDifference
                                };

                                lowestPriceDiff.element.classList.add("lowest-price-highlight");
                                lowestPriceDiff.element.style.backgroundColor = "#A5D6A7";
                            }
                        }
                    }

                    resultItem.style.position = "relative";
                    resultItem.appendChild(annotationContainer);

                    if (matchPercentage > highestMatch.value) {
                        highestMatch = { element: resultItem, value: matchPercentage };
                    }
                }
            });

            const navigateToElement = (element, label) => {
                if (element) {
                    const linkElement = element.querySelector("a");
                    if (linkElement) {
                        linkElement.click();
                        return;
                    }

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
                            if (element.classList.contains("highlighted-element")) {
                                element.dataset.originalBorder = element.style.border;
                                element.dataset.originalBackground = element.style.backgroundColor;
                                element.style.border = "0";
                                element.style.backgroundColor = "transparent";
                            }
                            if (!element.hasAttribute("data-product-container")) {
                                element.style.display = newDisplay;
                            }
                        } else {
                            if (element.classList.contains("highlighted-element")) {
                                element.style.border = element.dataset.originalBorder || "";
                                element.style.backgroundColor = element.dataset.originalBackground || "";
                            }
                            if (element.classList.contains("extension-annotation")) {
                                element.style.display = "flex";
                            }
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

                [...controlsContainer.children].forEach((child) => {
                    if (!child.getAttribute("data-toggle-ui")) {
                        controlsContainer.removeChild(child);
                    }
                });

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

function createPriceChartForm() {
    const existingForm = document.querySelector('[data-price-form="true"]');
    if (existingForm) {
        existingForm.remove();
    }

    const priceModal = document.querySelector('[role="dialog"]') || document.querySelector(".modal") || document.querySelector('[data-testid*="modal"]');
    if (!priceModal) {
        console.log("No modal found, cannot create form");
        return;
    }

    setTimeout(() => {
        const productNameElement = document.querySelector('[data-testid="price-chart-modal-product-name"]');
        const productName = productNameElement ? productNameElement.textContent.trim() : "Unknown Product";

        const currentPriceElement = document.querySelector(".priceHistoryStatistics-amount");
        const currentPrice = currentPriceElement ? currentPriceElement.textContent.trim() : "Unknown Price";

        const currentUrl = window.location.href.split("#")[0] + "#pricechart";

        const priceStats = document.querySelector('.priceHistoryStatistics[data-testid="price-history-statistics"]');
        let priceReduction = "No data available";
        let priceReductionPercent = "";

        if (priceStats) {
            let targetRow = Array.from(priceStats.querySelectorAll(".priceHistoryStatistics-row")).find((row) => {
                const title = row.querySelector(".priceHistoryStatistics-title");
                return title && title.textContent.includes("Jahr");
            });

            if (!targetRow) {
                targetRow = Array.from(priceStats.querySelectorAll(".priceHistoryStatistics-row")).find((row) => {
                    const changeElement = row.querySelector(".priceHistoryStatistics-change.decreased");
                    return changeElement;
                });
            }

            if (targetRow) {
                const changeElement = targetRow.querySelector(".priceHistoryStatistics-change.decreased");
                const percentageElement = targetRow.querySelector(".price-percentage-change");

                if (changeElement) {
                    priceReduction = changeElement.textContent.trim();
                    priceReductionPercent = percentageElement ? ` (${percentageElement.textContent.trim()})` : "";
                }
            } else {
                priceReduction = "No price reduction";
            }
        }

        const formContainer = document.createElement("div");
        formContainer.setAttribute("data-price-form", "true");

        const modal = document.querySelector('[role="dialog"]') || document.querySelector(".modal") || document.querySelector('[data-testid*="modal"]');

        formContainer.style = `
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    width: 25vw;
    min-width: 300px;
    max-width: 400px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10001;
    font-family: Arial, sans-serif;
    font-size: 14px;
    display: flex;
    flex-direction: column;
  `;

        if (priceModal) {
            const modalRect = priceModal.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const formWidth = Math.min(400, Math.max(300, viewportWidth * 0.25));
            const gap = 15;

            const leftPosition = modalRect.left - formWidth - gap;

            if (leftPosition >= 0) {
                formContainer.style.left = `${leftPosition}px`;
            } else {
                const rightPosition = modalRect.right + gap;
                if (rightPosition + formWidth <= viewportWidth) {
                    formContainer.style.left = `${rightPosition}px`;
                } else {
                    formContainer.style.left = "20px";
                }
            }
        } else {
            formContainer.style.left = "20px";
        }

        function updateFormPosition() {
            if (priceModal) {
                const modalRect = priceModal.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const formWidth = Math.min(400, Math.max(300, viewportWidth * 0.25));
                const gap = 15;

                formContainer.style.width = `${Math.max(300, Math.min(400, viewportWidth * 0.25))}px`;

                const leftPosition = modalRect.left - formWidth - gap;

                if (leftPosition >= 0) {
                    formContainer.style.left = `${leftPosition}px`;
                } else {
                    const rightPosition = modalRect.right + gap;
                    if (rightPosition + formWidth <= viewportWidth) {
                        formContainer.style.left = `${rightPosition}px`;
                    } else {
                        formContainer.style.left = "20px";
                    }
                }
            }
        }

        window.addEventListener("resize", updateFormPosition);

        const title = document.createElement("h3");
        title.textContent = "Product Information";
        title.style = `
    margin: 0 0 15px 0;
    color: #333;
    font-size: 16px;
  `;
        formContainer.appendChild(title);

        const shopLabel = document.createElement("label");
        shopLabel.textContent = "Shop Name:";
        shopLabel.style = `
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #333;
  `;
        formContainer.appendChild(shopLabel);

        const shopInput = document.createElement("input");
        shopInput.type = "text";
        shopInput.value = "Amazon";
        shopInput.placeholder = "Enter shop name";
        shopInput.style = `
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 15px;
    box-sizing: border-box;
  `;
        formContainer.appendChild(shopInput);

        const slackLabel = document.createElement("label");
        slackLabel.textContent = "Slack Webhook URL (optional):";
        slackLabel.style = `
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #333;
  `;
        formContainer.appendChild(slackLabel);

        const slackInput = document.createElement("input");
        slackInput.type = "text";
        slackInput.placeholder = "https://hooks.slack.com/services/...";
        slackInput.style = `
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 15px;
    box-sizing: border-box;
  `;

        chrome.storage.local.get(["slackWebhookUrl"], (result) => {
            if (result.slackWebhookUrl) {
                slackInput.value = "*****";
                slackInput.dataset.actualUrl = result.slackWebhookUrl;
                slackInput.style.color = "#666";
            }
        });

        slackInput.addEventListener("focus", () => {
            if (slackInput.value === "*****" && slackInput.dataset.actualUrl) {
                slackInput.value = slackInput.dataset.actualUrl;
                slackInput.style.color = "#333";
            }
        });

        slackInput.addEventListener("blur", () => {
            if (slackInput.dataset.actualUrl && slackInput.value === slackInput.dataset.actualUrl) {
                slackInput.value = "*****";
                slackInput.style.color = "#666";
            }
        });

        formContainer.appendChild(slackInput);

        const messageLabel = document.createElement("label");
        messageLabel.textContent = "Message Body:";
        messageLabel.style = `
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #333;
  `;
        formContainer.appendChild(messageLabel);

        const emojiContainer = document.createElement("div");
        emojiContainer.style = `
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 10px;
  `;

        const emojis = ["🔥", "☕️", "☀️", "🥷", "❄️", "🎄", "🛍️", "🍫", "✨", "💸"];
        const selectedEmojis = new Set();

        emojis.forEach((emoji) => {
            const emojiBtn = document.createElement("button");
            emojiBtn.textContent = emoji;
            emojiBtn.type = "button";
            emojiBtn.style = `
      padding: 8px;
      border: 2px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s ease;
    `;

            emojiBtn.addEventListener("click", (e) => {
                e.preventDefault();
                if (selectedEmojis.has(emoji)) {
                    selectedEmojis.delete(emoji);
                    emojiBtn.style.border = "2px solid #ddd";
                    emojiBtn.style.background = "white";
                } else {
                    selectedEmojis.add(emoji);
                    emojiBtn.style.border = "2px solid #007bff";
                    emojiBtn.style.background = "#e7f3ff";
                }
            });

            emojiContainer.appendChild(emojiBtn);
        });

        formContainer.appendChild(emojiContainer);

        const messageBody = `${productName} zum Rekordpreis von ${currentPrice} ${currentUrl}\n${priceReduction}${priceReductionPercent} unter dem Durchschnittspreis.`;

        const messageTextarea = document.createElement("textarea");
        messageTextarea.value = messageBody;
        messageTextarea.style = `
    width: 100%;
    height: 120px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 15px;
    box-sizing: border-box;
    resize: vertical;
    font-family: Arial, sans-serif;
    font-size: 12px;
  `;
        formContainer.appendChild(messageTextarea);

        const slackButton = document.createElement("button");
        slackButton.textContent = "Send to Slack";
        slackButton.style = `
    width: 100%;
    padding: 10px;
    background-color: #4a154b;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    margin-bottom: 10px;
  `;

        slackButton.addEventListener("click", async () => {
            const webhookUrl = slackInput.value === "*****" ? slackInput.dataset.actualUrl : slackInput.value.trim();
            if (!webhookUrl) {
                alert("Please enter a Slack webhook URL");
                return;
            }

            const shopName = shopInput.value || "Amazon";
            const originalMessage = messageTextarea.value;
            const emojiPrefix = Array.from(selectedEmojis).join("") + (selectedEmojis.size > 0 ? " " : "");

            const slackFormattedMessage = `${emojiPrefix}${shopName}: ${originalMessage}`;

            const payload = JSON.stringify({
                text: slackFormattedMessage,
                unfurl_links: false,
                unfurl_media: false
            });

            try {
                const response = await fetch(webhookUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: `payload=${encodeURIComponent(payload)}`
                });

                if (response.ok) {
                    chrome.storage.local.set({ slackWebhookUrl: webhookUrl });

                    slackButton.textContent = "Sent!";
                    slackButton.style.backgroundColor = "#28a745";

                    setTimeout(() => {
                        slackButton.textContent = "Send to Slack";
                        slackButton.style.backgroundColor = "#4a154b";
                    }, 2000);
                } else {
                    throw new Error("Failed to send message");
                }
            } catch (err) {
                slackButton.textContent = "Error!";
                slackButton.style.backgroundColor = "#dc3545";
                console.error("Slack error:", err);

                setTimeout(() => {
                    slackButton.textContent = "Send to Slack";
                    slackButton.style.backgroundColor = "#4a154b";
                }, 2000);
            }
        });

        formContainer.appendChild(slackButton);

        const copyButton = document.createElement("button");
        copyButton.textContent = "Copy to Clipboard";
        copyButton.style = `
    width: 100%;
    padding: 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    margin-bottom: 10px;
  `;

        copyButton.addEventListener("click", async () => {
            const shopName = shopInput.value || "Amazon";
            const originalMessage = messageTextarea.value;
            const emojiPrefix = Array.from(selectedEmojis).join("") + (selectedEmojis.size > 0 ? " " : "");

            const finalMessage = `${emojiPrefix}${shopName}: ${originalMessage}`;

            try {
                await navigator.clipboard.writeText(finalMessage);
                copyButton.textContent = "Copied!";
                copyButton.style.backgroundColor = "#28a745";

                setTimeout(() => {
                    copyButton.textContent = "Copy to Clipboard";
                    copyButton.style.backgroundColor = "#007bff";
                }, 2000);
            } catch (err) {
                const textArea = document.createElement("textarea");
                textArea.value = finalMessage;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);

                copyButton.textContent = "Copied!";
                copyButton.style.backgroundColor = "#28a745";

                setTimeout(() => {
                    copyButton.textContent = "Copy to Clipboard";
                    copyButton.style.backgroundColor = "#007bff";
                }, 2000);
            }
        });

        formContainer.appendChild(copyButton);

        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.style = `
    width: 100%;
    padding: 8px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;

        closeButton.addEventListener("click", () => {
            window.removeEventListener("resize", updateFormPosition);
            formContainer.remove();
        });

        formContainer.appendChild(closeButton);

        document.body.appendChild(formContainer);

        function closeFormOnOutsideClick(e) {
            const modal = document.querySelector('[role="dialog"]') || document.querySelector(".modal") || document.querySelector('[data-testid*="modal"]');
            const formButton = document.querySelector('[data-form-button="true"]');

            if (!formContainer.contains(e.target) && !formButton?.contains(e.target) && modal?.contains(e.target)) {
                cleanup();
            }
        }

        function cleanup() {
            window.removeEventListener("resize", updateFormPosition);
            modalObserver.disconnect();
            formContainer.remove();
            document.removeEventListener("click", closeFormOnOutsideClick);
        }

        document.addEventListener("click", closeFormOnOutsideClick);

        const modalObserver = new MutationObserver((mutations) => {
            const modal = document.querySelector('[role="dialog"]') || document.querySelector(".modal") || document.querySelector('[data-testid*="modal"]');
            if (!modal) {
                cleanup();
            }
        });

        modalObserver.observe(document.body, { childList: true, subtree: true });
    }, 500);
}

function setupPriceChartDetection() {
    const priceChartContainer = document.querySelector(".oopStage-price-chart");
    if (priceChartContainer) {
        priceChartContainer.addEventListener("click", () => {
            setTimeout(() => addPriceHistoryPercentages(), 500);
            setTimeout(() => addPriceHistoryPercentages(), 1500);
            setTimeout(() => addPriceHistoryPercentages(), 3000);

            setTimeout(() => addTimeButtonListeners(), 1000);

            setTimeout(() => addFormButtonToModal(), 1500);
        });
    }

    if (document.querySelector('.priceHistoryStatistics[data-testid="price-history-statistics"]')) {
        addPriceHistoryPercentages();
        addTimeButtonListeners();
        addFormButtonToModal();
    }
}

function addFormButtonToModal() {
    const modal = document.querySelector('[role="dialog"]') || document.querySelector(".modal") || document.querySelector('[data-testid*="modal"]');
    if (!modal || document.querySelector('[data-form-button="true"]')) return;

    const modalHeader = modal.querySelector("header") || modal.querySelector(".modal-header") || modal.querySelector('[data-testid*="header"]');
    if (!modalHeader) return;

    const formButton = document.createElement("button");
    formButton.setAttribute("data-form-button", "true");
    formButton.textContent = "📊 Price Info Form";
    formButton.style = `
        position: absolute;
        top: 10px;
        left: 10px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        font-size: 12px;
        cursor: pointer;
        z-index: 10002;
    `;

    formButton.addEventListener("click", (e) => {
        e.stopPropagation();
        const existingForm = document.querySelector('[data-price-form="true"]');
        if (existingForm) {
            chrome.storage.local.set({ priceFormOpen: false });
            existingForm.remove();
        } else {
            chrome.storage.local.set({ priceFormOpen: true });
            createPriceChartForm();
        }
    });

    modalHeader.style.position = "relative";
    modalHeader.appendChild(formButton);

    chrome.storage.local.get(["priceFormOpen"], (result) => {
        if (result.priceFormOpen) {
            setTimeout(() => createPriceChartForm(), 100);
        }
    });
}

function addTimeButtonListeners() {
    const timeButtons = document.querySelectorAll('ul[data-testid="header-links-modal-list"] button, ul[data-testid="header-buttons-embedded-list"] button');

    timeButtons.forEach((button) => {
        if (!button.hasAttribute("data-percentage-listener")) {
            button.setAttribute("data-percentage-listener", "true");
            button.addEventListener("click", () => {
                const wasFormOpen = document.querySelector('[data-price-form="true"]') !== null;
                if (wasFormOpen) {
                    chrome.storage.local.set({ priceFormOpen: true });
                }

                document.querySelectorAll(".price-percentage-change").forEach((el) => el.remove());
                setTimeout(() => addPriceHistoryPercentages(), 1000);
                setTimeout(() => addPriceHistoryPercentages(), 2000);

                if (wasFormOpen) {
                    setTimeout(() => {
                        chrome.storage.local.get(["priceFormOpen"], (result) => {
                            if (result.priceFormOpen) {
                                createPriceChartForm();
                            }
                        });
                    }, 1500);
                }
            });
        }
    });
}

function addPriceHistoryPercentages() {
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

        const historicalPrice = currentValue;
        const isIncrease = changeElement.classList.contains("increased");
        const isDecrease = changeElement.classList.contains("decreased");
        const isNeutral = changeElement.classList.contains("neutral");

        if (isNeutral || changeAmount === 0) {
            return;
        }

        if (isIncrease) {
        } else if (isDecrease) {
            // Today's price = historical - change
        } else {
            return;
        }

        const percentageChange = (changeAmount / historicalPrice) * 100;

        const existingPercentage = row.querySelector(".price-percentage-change");
        if (existingPercentage) {
            existingPercentage.remove();
        }

        if (!isFinite(percentageChange) || historicalPrice <= 0) {
            return;
        }

        const percentageDiv = document.createElement("div");
        percentageDiv.className = "price-percentage-change";
        percentageDiv.style = `
      font-size: 12px;
      font-weight: bold;
      color: ${isIncrease ? "#dc3545" : "#28a745"};
      margin-bottom: 4px;
    `;

        const formattedPercentage = Math.abs(percentageChange).toFixed(1);
        percentageDiv.textContent = `${isIncrease ? "+" : "-"}${formattedPercentage}%`;

        row.style.position = "relative";

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

function extractAmazonIdentifier() {
    const match = window.location.href.match(/\/dp\/([A-Z0-9]+)/);
    return match ? match[1] : null;
}

function addIdealoButton(titleElement) {
    const productTitle = titleElement.innerText.trim();
    const artikelnummer = extractArtikelnummer();
    const amazonIdentifier = extractAmazonIdentifier();

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
