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
                iconBtn.innerHTML = `<img src="${chrome.runtime.getURL("icon.png")}" width="25" height="25" style="border-radius: 50%;">`;
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
                    label.textContent = "Shop Filter";
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
                            iconBtn.title = "Shop Filter schließen";
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
            iconBtn.innerHTML = `<img src="${chrome.runtime.getURL("icon.png")}" width="25" height="25" style="border-radius: 50%;">`;
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
                label.textContent = "Shop Filter";
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

    if (currentUrl.includes("mydealz.de")) {
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

    const hostname = window.location.hostname;

    if (hostname.includes("amazon.")) {
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
    } else if (hostname.includes("idealo.")) {
        setTimeout(() => setupPriceChartDetection(), 1000);

        chrome.storage.local.get(["amazonPrice"], (result) => {
            const amazonPrice = result.amazonPrice;

            const searchQuery = new URL(window.location.href).searchParams.get("q");
            if (!searchQuery) return;

            const resultItems = document.querySelectorAll('.sr-resultList__item_m6xdA, [data-testid="resultItem"]:has(.sr-productSummary__title_f5flP)');

            let highestMatch = { element: null, value: 0 };
            let lowestPriceDiff = { element: null, value: Number.POSITIVE_INFINITY };

            resultItems.forEach((resultItem) => {
                const titleElement = resultItem.querySelector(".sr-productSummary__title_f5flP");
                const priceElement = resultItem.querySelector('.sr-detailedPriceInfo__price_sYVmx, [data-testid="detailedPriceInfo__price"]');

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
                const navButtons = document.querySelector('[data-nav-buttons="true"]');

                if (extensionElements.length > 0) {
                    let isVisible = false;
                    for (let element of extensionElements) {
                        if (!element.hasAttribute("data-product-container") && element.style.display !== "none" && getComputedStyle(element).display !== "none") {
                            isVisible = true;
                            break;
                        }
                    }
                    extensionElements.forEach((element) => {
                        if (isVisible) {
                            if (element.classList && element.classList.contains("highlighted-element")) {
                                element.dataset.originalBorder = element.style.border;
                                element.dataset.originalBackground = element.style.backgroundColor;
                                element.style.border = "0";
                                element.style.backgroundColor = "transparent";
                            }
                            if (!element.hasAttribute("data-product-container")) {
                                element.style.display = "none";
                            }
                        } else {
                            if (element.classList && element.classList.contains("highlighted-element")) {
                                element.style.border = element.dataset.originalBorder || "";
                                element.style.backgroundColor = element.dataset.originalBackground || "";
                            }
                            if (!element.hasAttribute("data-product-container")) {
                                element.style.display = "flex";
                            }
                        }
                    });
                } else if (navButtons) {
                    console.log("Extension UI elements not found, but navigation is present");
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
            width: 100%;
            padding: 10px;
            background-color: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          `;
                    closestMatchButton.addEventListener("mouseover", () => {
                        closestMatchButton.style.backgroundColor = "#218838";
                        closestMatchButton.style.transform = "translateY(-1px)";
                        closestMatchButton.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                        if (highestMatch.element) {
                            highestMatch.element.style.backgroundColor = "rgba(165,214,167, 0.4)";
                            highestMatch.element.style.border = "3px solid #28a745";
                        }
                    });
                    closestMatchButton.addEventListener("mouseout", () => {
                        closestMatchButton.style.backgroundColor = "#28a745";
                        closestMatchButton.style.transform = "translateY(0)";
                        closestMatchButton.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
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
            width: 100%;
            padding: 10px;
            background-color: #ffc107;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          `;

                    bestDealButton.addEventListener("mouseover", () => {
                        bestDealButton.style.backgroundColor = "#e0a800";
                        bestDealButton.style.transform = "translateY(-1px)";
                        bestDealButton.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                        if (lowestPriceDiff.element) {
                            lowestPriceDiff.element.style.backgroundColor = "rgba(255,209,128, 0.4)";
                            lowestPriceDiff.element.style.border = "3px solid #ffc107";
                        }
                    });
                    bestDealButton.addEventListener("mouseout", () => {
                        bestDealButton.style.backgroundColor = "#ffc107";
                        bestDealButton.style.transform = "translateY(0)";
                        bestDealButton.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
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
            width: 100%;
            padding: 10px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          `;

                    toggleButton.setAttribute("data-toggle-ui", "true");
                    toggleButton.addEventListener("mouseover", () => {
                        toggleButton.style.backgroundColor = "#0056b3";
                        toggleButton.style.transform = "translateY(-1px)";
                        toggleButton.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                    });
                    toggleButton.addEventListener("mouseout", () => {
                        toggleButton.style.backgroundColor = "#007bff";
                        toggleButton.style.transform = "translateY(0)";
                        toggleButton.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
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
            if (highestMatch.element && lowestPriceDiff.element && highestMatch.element === lowestPriceDiff.element) {
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
        return;
    }
    setTimeout(() => {
        const productNameElement = document.querySelector('[data-testid="price-chart-modal-product-name"]');
        const productName = productNameElement ? productNameElement.textContent.trim() : "Unbekanntes Produkt";

        const currentPriceElements = document.querySelectorAll(".productOffers-listItemOfferPrice");

        let currentPrice = "Unbekannter Preis";

        if (currentPriceElements[0]) {
            currentPrice = currentPriceElements[0].textContent.trim();
        } else {
            const priceStats = document.querySelector('.priceHistoryStatistics[data-testid="price-history-statistics"]');
            if (priceStats) {
                const lowestPriceRow = Array.from(priceStats.querySelectorAll(".priceHistoryStatistics-row")).find((row) => {
                    const title = row.querySelector(".priceHistoryStatistics-title");
                    return title && title.textContent.includes("Tiefster Preis");
                });
                if (lowestPriceRow) {
                    const lowestPriceElement = lowestPriceRow.querySelector(".priceHistoryStatistics-amount");
                    if (lowestPriceElement) {
                        currentPrice = lowestPriceElement.textContent.trim();
                    }
                }
            }
        }
        const currentUrl = window.location.href.split("#")[0] + "#pricechart";

        const priceStats = document.querySelector('.priceHistoryStatistics[data-testid="price-history-statistics"]');
        let priceReduction = "Keine Daten verfügbar";
        let priceReductionPercent = "";
        let priceType = "guten Preis";

        if (priceStats) {
            const lowestPriceRow = Array.from(priceStats.querySelectorAll(".priceHistoryStatistics-row")).find((row) => {
                const title = row.querySelector(".priceHistoryStatistics-title");
                return title && title.textContent.includes("Tiefster Preis");
            });

            const averagePriceRow = Array.from(priceStats.querySelectorAll(".priceHistoryStatistics-row")).find((row) => {
                const title = row.querySelector(".priceHistoryStatistics-title");
                return title && title.textContent.includes("Durchschnitt");
            });

            const currentPriceValue = parseFloat(currentPrice.replace(/[^\d,]/g, "").replace(",", "."));

            if (lowestPriceRow) {
                const lowestPriceElement = lowestPriceRow.querySelector(".priceHistoryStatistics-amount");
                if (lowestPriceElement) {
                    const lowestPriceValue = parseFloat(lowestPriceElement.textContent.replace(/[^\d,]/g, "").replace(",", "."));

                    if (currentPriceValue === lowestPriceValue) {
                        priceType = "Tiefstpreis";
                    } else {
                        priceType = "guten Preis";
                    }
                }
            }
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
                    const percentText = percentageElement ? percentageElement.textContent.trim() : "";
                    if (percentText) {
                        priceReductionPercent = ` (${percentText})`;
                    } else {
                        priceReductionPercent = "";
                    }
                }
            } else {
                priceReduction = "Keine Preisreduzierung";
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

        const shopLabel = document.createElement("label");
        shopLabel.textContent = "Shop-Name:";
        shopLabel.style = `
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #333;
  `;
        formContainer.appendChild(shopLabel);

        const shopContainer = document.createElement("div");
        shopContainer.style = `
    position: relative;
    margin-bottom: 15px;
  `;

        const shopSelect = document.createElement("select");
        shopSelect.style = `
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
    background-color: white;
    cursor: pointer;
    font-size: 14px;
    appearance: none;
    background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%23999" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>');
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 12px;
    padding-right: 5px;
  `;

        const shopOptions = [
            { value: "Amazon", text: "Amazon" },
            { value: "Mediamarkt", text: "Mediamarkt" },
            { value: "Lidl", text: "Lidl" },
            { value: "Kaufland", text: "Kaufland" },
            { value: "Ninja", text: "Ninja" },
            { value: "Juskys", text: "Juskys" },
            { value: "Otto", text: "Otto" },
            { value: "custom", text: "Eigener Name..." }
        ];

        shopOptions.forEach((option) => {
            const optionElement = document.createElement("option");
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            if (option.value === "Amazon") {
                optionElement.selected = true;
            }
            shopSelect.appendChild(optionElement);
        });

        const customShopInput = document.createElement("input");
        customShopInput.type = "text";
        customShopInput.placeholder = "Shop-Namen eingeben";
        customShopInput.style = `
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
    display: none;
    margin-top: 5px;
  `;

        shopSelect.addEventListener("change", () => {
            if (shopSelect.value === "custom") {
                customShopInput.style.display = "block";
                customShopInput.focus();
            } else {
                customShopInput.style.display = "none";
            }
        });

        function getSelectedShopName() {
            if (shopSelect.value === "custom") {
                return customShopInput.value.trim() || "Custom Shop";
            }
            return shopSelect.value;
        }

        shopContainer.appendChild(shopSelect);
        shopContainer.appendChild(customShopInput);
        formContainer.appendChild(shopContainer);

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

        const togglesContainer = document.createElement("div");
        togglesContainer.style = `
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
    align-items: center;
  `;

        const emojiToggleContainer = document.createElement("div");
        emojiToggleContainer.style = `
    display: flex;
    align-items: center;
    padding: 8px;
    background-color: #f8f9fa;
    border-radius: 4px;
    flex: 1;
  `;

        const emojiToggleCheckbox = document.createElement("input");
        emojiToggleCheckbox.type = "checkbox";
        emojiToggleCheckbox.id = "emoji-toggle";

        chrome.storage.local.get(["emojiToggleEnabled"], (result) => {
            if (chrome.runtime.lastError) {
                console.log("Extension context invalidated, page reload required");
                return;
            }
            emojiToggleCheckbox.checked = result.emojiToggleEnabled !== undefined ? result.emojiToggleEnabled : true;
            updateMessageWithEmojis();
        });

        const emojiToggleLabel = document.createElement("label");
        emojiToggleLabel.textContent = "Prozent-Emoji";
        emojiToggleLabel.setAttribute("for", "emoji-toggle");
        emojiToggleLabel.style = `
    margin-left: 8px;
    color: #333;
    cursor: pointer;
    font-size: 12px;
  `;

        emojiToggleContainer.appendChild(emojiToggleCheckbox);
        emojiToggleContainer.appendChild(emojiToggleLabel);

        const rekordpreisButton = document.createElement("button");
        rekordpreisButton.textContent = "🔥 Rekordpreis";
        rekordpreisButton.type = "button";
        rekordpreisButton.style = `
    padding: 8px 12px;
    background-color: #ffc107;
    color: #212529;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    font-size: 12px;
    transition: all 0.2s ease;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;

        rekordpreisButton.addEventListener("click", (e) => {
            e.preventDefault();
            const currentMessage = messageTextarea.value;
            const updatedMessage = currentMessage.replace(/zum (Tiefstpreis|guten Preis|Bestpreis|Rekordpreis) von/, "zum Rekordpreis von");
            messageTextarea.value = updatedMessage;

            rekordpreisButton.style.backgroundColor = "#28a745";
            rekordpreisButton.textContent = "🔥 Gesetzt!";

            setTimeout(() => {
                rekordpreisButton.style.backgroundColor = "#ffc107";
                rekordpreisButton.textContent = "🔥 Rekordpreis";
            }, 2000);
        });

        togglesContainer.appendChild(emojiToggleContainer);
        togglesContainer.appendChild(rekordpreisButton);
        formContainer.appendChild(togglesContainer);
        const messageLabel = document.createElement("label");
        messageLabel.textContent = "Nachrichtentext:";
        messageLabel.style = `
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #333;
  `;
        formContainer.appendChild(messageLabel);

        const emojiSectionContainer = document.createElement("div");
        emojiSectionContainer.style = `
    margin-bottom: 10px;
  `;

        const emojiToggleHeader = document.createElement("button");
        emojiToggleHeader.textContent = "🎯 Emoji auswählen";
        emojiToggleHeader.type = "button";
        emojiToggleHeader.style = `
    width: 100%;
    padding: 8px 12px;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
    transition: background-color 0.2s ease;
  `;

        const toggleIcon = document.createElement("span");
        toggleIcon.textContent = "▼";
        toggleIcon.style = `
    font-size: 10px;
    transition: transform 0.2s ease;
  `;
        emojiToggleHeader.appendChild(toggleIcon);

        const emojiContainer = document.createElement("div");
        emojiContainer.style = `
    display: none;
    flex-wrap: wrap;
    gap: 5px;
    padding: 8px;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-top: none;
    border-radius: 0 0 4px 4px;
  `;

        let isEmojiSectionOpen = false;

        emojiToggleHeader.addEventListener("click", (e) => {
            e.preventDefault();
            isEmojiSectionOpen = !isEmojiSectionOpen;

            if (isEmojiSectionOpen) {
                emojiContainer.style.display = "flex";
                toggleIcon.style.transform = "rotate(180deg)";
                emojiToggleHeader.style.backgroundColor = "#e9ecef";
            } else {
                emojiContainer.style.display = "none";
                toggleIcon.style.transform = "rotate(0deg)";
                emojiToggleHeader.style.backgroundColor = "#f8f9fa";
            }
        });

        emojiSectionContainer.appendChild(emojiToggleHeader);

        const emojis = ["🔥", "☕️", "☀️", "🥷", "❄️", "🎄", "🛍️", "🍫", "✨", "💸", "🚨"];
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

        emojiSectionContainer.appendChild(emojiContainer);
        formContainer.appendChild(emojiSectionContainer);

        const messageBody = `${productName} zum ${priceType} von ${currentPrice} ${currentUrl}\n${priceReduction}${priceReductionPercent} unter dem Durchschnittspreis.`;

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

        function updateMessageWithEmojis() {
            const useEmojis = emojiToggleCheckbox.checked;
            let updatedMessage = messageBody;

            if (useEmojis && priceStats && priceReductionPercent) {
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
                    const changeElement = targetRow.querySelector(".priceHistoryStatistics-change.decreased, .priceHistoryStatistics-change.increased");

                    if (changeElement) {
                        const isDecrease = changeElement.classList.contains("decreased");
                        let emoji = "🔴"; // Default for increases

                        if (isDecrease) {
                            // Extract percentage number for color logic
                            const percentMatch = priceReductionPercent.match(/(\d+(?:\.\d+)?)%/);
                            if (percentMatch) {
                                const percentNum = parseFloat(percentMatch[1]);
                                if (percentNum > 20) {
                                    emoji = "🟢"; // Green for > 20%
                                } else if (percentNum >= 10) {
                                    emoji = "🟡"; // Yellow for 10-20%
                                } else {
                                    emoji = "🔵"; // Blue for 0-10%
                                }
                            } else {
                                emoji = "🟢"; // Default green for decreases without clear percentage
                            }
                        }

                        const plainPercent = priceReductionPercent.trim();
                        if (plainPercent.startsWith("(") && plainPercent.endsWith(")")) {
                            const percentContent = plainPercent.slice(1, -1);
                            updatedMessage = updatedMessage.replace(priceReductionPercent, ` (${emoji}${percentContent})`);
                        }
                    }
                }
            }

            messageTextarea.value = updatedMessage;
        }

        emojiToggleCheckbox.addEventListener("change", () => {
            if (chrome.runtime.lastError) {
                console.log("Extension context invalidated, page reload required");
                return;
            }
            chrome.storage.local.set({ emojiToggleEnabled: emojiToggleCheckbox.checked });
            updateMessageWithEmojis();
        });

        formContainer.appendChild(messageTextarea);

        const slackButton = document.createElement("button");
        slackButton.textContent = "An Slack senden";
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
                alert("Bitte geben Sie eine Slack Webhook URL ein");
                return;
            }

            const shopName = getSelectedShopName();
            const originalMessage = messageTextarea.value;
            const emojiPrefix = Array.from(selectedEmojis).join("") + (selectedEmojis.size > 0 ? " " : "");

            const slackMessage = originalMessage.replace(currentPrice, `*${currentPrice}*`).replace(/Rekordpreis/g, "*Rekordpreis*");
            const slackFormattedMessage = `${emojiPrefix}${shopName}: ${slackMessage}`;

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

                    slackButton.textContent = "Gesendet!";
                    slackButton.style.backgroundColor = "#28a745";

                    setTimeout(() => {
                        slackButton.textContent = "An Slack senden";
                        slackButton.style.backgroundColor = "#4a154b";
                    }, 2000);
                } else {
                    throw new Error("Failed to send message");
                }
            } catch (err) {
                slackButton.textContent = "Fehler!";
                slackButton.style.backgroundColor = "#dc3545";
                console.error("Slack error:", err);

                setTimeout(() => {
                    slackButton.textContent = "An Slack senden";
                    slackButton.style.backgroundColor = "#4a154b";
                }, 2000);
            }
        });

        formContainer.appendChild(slackButton);

        const copyButton = document.createElement("button");
        copyButton.textContent = "In Zwischenablage kopieren";
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
            const shopName = getSelectedShopName();
            const originalMessage = messageTextarea.value;
            const emojiPrefix = Array.from(selectedEmojis).join("") + (selectedEmojis.size > 0 ? " " : "");

            const finalMessage = `${emojiPrefix}${shopName}: ${originalMessage}`;

            try {
                await navigator.clipboard.writeText(finalMessage);
                copyButton.textContent = "Kopiert!";
                copyButton.style.backgroundColor = "#28a745";

                setTimeout(() => {
                    copyButton.textContent = "In Zwischenablage kopieren";
                    copyButton.style.backgroundColor = "#007bff";
                }, 2000);
            } catch (err) {
                const textArea = document.createElement("textarea");
                textArea.value = finalMessage;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);

                copyButton.textContent = "Kopiert!";
                copyButton.style.backgroundColor = "#28a745";

                setTimeout(() => {
                    copyButton.textContent = "In Zwischenablage kopieren";
                    copyButton.style.backgroundColor = "#007bff";
                }, 2000);
            }
        });

        formContainer.appendChild(copyButton);

        const closeButton = document.createElement("button");
        closeButton.textContent = "Schließen";
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
        const clickableElements = [priceChartContainer, ...priceChartContainer.querySelectorAll(".tv-lightweight-charts"), ...priceChartContainer.querySelectorAll("canvas"), ...priceChartContainer.querySelectorAll(".embedded-chart-container"), ...priceChartContainer.querySelectorAll(".styled-price-chart-embedded")];

        clickableElements.forEach((element) => {
            element.addEventListener("click", () => {
                setTimeout(() => addPriceHistoryPercentages(), 100);
                setTimeout(() => addFormButtonToModal(), 200);

                setTimeout(() => addPriceHistoryPercentages(), 500);
                setTimeout(() => addFormButtonToModal(), 600);

                setTimeout(() => addPriceHistoryPercentages(), 1500);
                setTimeout(() => addFormButtonToModal(), 1600);

                setTimeout(() => addPriceHistoryPercentages(), 3000);
                setTimeout(() => addFormButtonToModal(), 3100);

                setTimeout(() => addTimeButtonListeners(), 1000);
            });
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

    let modalHeader = modal.querySelector("header") || modal.querySelector(".modal-header") || modal.querySelector('[data-testid*="header"]') || modal.querySelector(".styled-price-chart-modal-header") || modal.querySelector(".styled-price-chart-modal header");

    if (!modalHeader) {
        modalHeader = modal.querySelector(".styled-price-chart-modal");
    }

    if (!modalHeader) {
        modalHeader = modal;
    }
    const formButton = document.createElement("button");
    formButton.setAttribute("data-form-button", "true");
    formButton.textContent = "📊 Preis Info Formular";
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

        // Determine color based on percentage ranges for decreases
        let color = "#dc3545"; // Default red for increases
        let borderColor = "#dc3545";

        if (isDecrease) {
            const absPercentage = Math.abs(percentageChange);
            if (absPercentage > 0 && absPercentage <= 10) {
                color = "#007bff"; // Blue 🔵
                borderColor = "#007bff";
            } else if (absPercentage > 10 && absPercentage <= 20) {
                color = "#ffc107"; // Yellow 🟡
                borderColor = "#ffc107";
            } else if (absPercentage > 20) {
                color = "#28a745"; // Green 🟢
                borderColor = "#28a745";
            }
        }

        row.style.position = "relative";

        percentageDiv.style = `
      position: absolute;
      top: 50%;
      left: 35%;
      transform: translate(-50%, -50%);
      font-size: 14px;
      font-weight: bold;
      color: ${color};
      background: rgba(255, 255, 255, 0.95);
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid ${borderColor};
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 10;
      pointer-events: none;
    `;

        row.appendChild(percentageDiv);
    });
}

function cleanSearchQuery(text) {
    if (!text) return "";

    return text
        .replace(/[^\w\säöüÄÖÜß\-\.]/g, " ")
        .replace(/\b(amazon|bestseller|choice|renewed|pack|set|bundle|kit|piece|pcs|pc|cm|mm|inch|inches|"|kg|g|ml|l)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .slice(0, 8)
        .join(" ");
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

    const cleanTitle = cleanSearchQuery(productTitle);

    const searchQueryParts = [];
    if (artikelnummer) searchQueryParts.push(artikelnummer);
    if (amazonIdentifier) searchQueryParts.push(amazonIdentifier);
    if (cleanTitle) searchQueryParts.push(cleanTitle);

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
