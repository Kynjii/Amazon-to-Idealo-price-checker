function isExternalLink(resultItem) {
    const externalForm = resultItem.querySelector('form[action*="/ipc/prg"]');
    return !!externalForm;
}

function createExternalLinkBadge() {
    const badge = document.createElement("span");
    badge.innerHTML = `<img src="${chrome.runtime.getURL("assets/warning.png")}" width="14" height="14" alt="Warnung">`;
    badge.title = "Idealo stellt keine detaillierten Informationen bereit, ein Klick führt zu einem externen Shop.";
    badge.classList.add("extension-annotation", "spca-external-badge");
    return badge;
}

function createKeepaButton(asin) {
    if (!asin) return null;

    const keepaButton = document.createElement("a");
    keepaButton.href = `https://keepa.com/#!product/3-${asin}`;
    keepaButton.target = "_blank";
    keepaButton.textContent = "Keepa";
    keepaButton.classList.add("extension-annotation", "spca-keepa-button");
    keepaButton.addEventListener("click", (e) => e.stopPropagation());
    return keepaButton;
}

function processIdealoResults(referencePrice, priceSiteName, productTitle, productAsin) {
    const resultItems = document.querySelectorAll('.sr-resultList__item_m6xdA, [data-testid="resultItem"]:has(.sr-productSummary__title_f5flP)');

    let highestMatch = { element: null, value: 0 };
    let lowestPriceDiff = { element: null, value: Number.POSITIVE_INFINITY };

    resultItems.forEach((resultItem) => {
        const titleElement = resultItem.querySelector(".sr-productSummary__title_f5flP");
        const priceElement = resultItem.querySelector('.sr-detailedPriceInfo__price_sYVmx, [data-testid="detailedPriceInfo__price"]');

        if (titleElement && priceElement) {
            const resultTitle = titleElement.textContent.trim();
            const similarity = cosine.similarity(productTitle, resultTitle);
            const matchPercentage = Math.round(similarity * 100);

            const idealoPrice = extractPrice(priceElement.textContent.replace("ab", "").trim());
            const priceDifference = !isNaN(referencePrice) && !isNaN(idealoPrice) ? (idealoPrice - referencePrice).toFixed(2) : null;

            const annotationContainer = document.createElement("div");
            annotationContainer.setAttribute("data-extension-ui", "true");
            annotationContainer.classList.add("spca-annotation-container");

            const matchAnnotation = document.createElement("span");
            matchAnnotation.textContent = `${matchPercentage}%`;
            matchAnnotation.classList.add("extension-annotation", "spca-annotation");
            if (matchPercentage >= 90) {
                matchAnnotation.classList.add("spca-annotation--match-high");
            } else if (matchPercentage >= 80) {
                matchAnnotation.classList.add("spca-annotation--match-medium");
            } else if (matchPercentage >= 0) {
                matchAnnotation.classList.add("spca-annotation--match-low");
            } else {
                matchAnnotation.classList.add("spca-annotation--match-none");
            }
            annotationContainer.appendChild(matchAnnotation);

            if (priceDifference !== null) {
                const priceDiffAnnotation = document.createElement("span");
                priceDiffAnnotation.textContent = `€${priceDifference}`;
                priceDiffAnnotation.classList.add("extension-annotation", "spca-annotation", "lowest-price-highlight");
                priceDiffAnnotation.classList.add(priceDifference < 0 ? "spca-annotation--price-lower" : "spca-annotation--price-higher");
                annotationContainer.appendChild(priceDiffAnnotation);

                const priceSourceAnnotation = document.createElement("span");
                priceSourceAnnotation.textContent = `vs ${priceSiteName}`;
                priceSourceAnnotation.classList.add("extension-annotation", "spca-annotation", "spca-annotation--source");
                annotationContainer.appendChild(priceSourceAnnotation);

                if (isExternalLink(resultItem)) {
                    const externalBadge = createExternalLinkBadge();
                    annotationContainer.appendChild(externalBadge);
                }

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

            resultItem.classList.add("spca-result-item");
            resultItem.appendChild(annotationContainer);

            if (matchPercentage > highestMatch.value) {
                highestMatch = { element: resultItem, value: matchPercentage };
            }
        }
    });

    if (highestMatch.element) {
        highestMatch.element.classList.add("highlighted-element", "spca-highlighted--match");
        highestMatch.element.setAttribute("data-product-container", "true");
    }
    if (lowestPriceDiff.element) {
        lowestPriceDiff.element.classList.add("highlighted-element", "spca-highlighted--deal");
        lowestPriceDiff.element.setAttribute("data-product-container", "true");
    }
    if (highestMatch.element && lowestPriceDiff.element && highestMatch.element === lowestPriceDiff.element) {
        highestMatch.element.classList.remove("spca-highlighted--match", "spca-highlighted--deal");
        highestMatch.element.classList.add("highlighted-element", "spca-highlighted--both");
        highestMatch.element.setAttribute("data-product-container", "true");
    }

    createNavButtons(highestMatch, lowestPriceDiff);
}

function navigateToElement(element, label) {
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
}

function createNavButtons(highestMatch, lowestPriceDiff) {
    let controlsContainer = document.querySelector('[data-nav-buttons="true"]');

    if (!controlsContainer) {
        controlsContainer = document.createElement("div");
        controlsContainer.classList.add("spca-nav-container");
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
        closestMatchButton.classList.add("spca-nav-button", "spca-nav-button--match");
        closestMatchButton.addEventListener("mouseover", () => {
            if (highestMatch.element) {
                highestMatch.element.style.backgroundColor = "rgba(165,214,167, 0.4)";
                highestMatch.element.style.border = "3px solid #28a745";
            }
        });
        closestMatchButton.addEventListener("mouseout", () => {
            if (highestMatch.element) {
                highestMatch.element.style.backgroundColor = "";
                highestMatch.element.style.border = "";
            }
        });
        closestMatchButton.addEventListener("click", () => navigateToElement(highestMatch.element, "Bester Match"));
        controlsContainer.appendChild(closestMatchButton);
    }

    if (lowestPriceDiff.element) {
        const bestDealButton = document.createElement("button");
        bestDealButton.textContent = "Bestes Deal";
        bestDealButton.classList.add("spca-nav-button", "spca-nav-button--deal");

        bestDealButton.addEventListener("mouseover", () => {
            if (lowestPriceDiff.element) {
                lowestPriceDiff.element.style.backgroundColor = "rgba(255,209,128, 0.4)";
                lowestPriceDiff.element.style.border = "3px solid #ffc107";
            }
        });
        bestDealButton.addEventListener("mouseout", () => {
            if (lowestPriceDiff.element) {
                lowestPriceDiff.element.style.backgroundColor = "";
                lowestPriceDiff.element.style.border = "";
            }
        });

        bestDealButton.addEventListener("click", () => navigateToElement(lowestPriceDiff.element, "Bestes Deal"));
        controlsContainer.appendChild(bestDealButton);
    }

    if (!document.querySelector('[data-toggle-ui="true"]')) {
        const toggleButton = document.createElement("button");
        toggleButton.textContent = "An/Aus";
        toggleButton.classList.add("spca-nav-button", "spca-nav-button--toggle");
        toggleButton.setAttribute("data-toggle-ui", "true");
        toggleButton.addEventListener("click", toggleExtensionUI);
        controlsContainer.appendChild(toggleButton);
    }
}

function toggleExtensionUI() {
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
}
