function isExternalLink(resultItem) {
    const externalForm = resultItem.querySelector('form[action*="/ipc/prg"]');
    return !!externalForm;
}

function createExternalLinkBadge() {
    const badge = document.createElement("span");
    badge.textContent = "❗";
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

                const priceSourceAnnotation = document.createElement("span");
                priceSourceAnnotation.textContent = `vs ${priceSiteName}`;
                priceSourceAnnotation.classList.add("extension-annotation");
                priceSourceAnnotation.style = `
                    display: flex;
                    padding: 3px 5px;
                    background-color: #6c757d;
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                    align-items: center;
                    justify-content: center;
                    border-radius: 3px;
                `;
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

            resultItem.style.position = "relative";
            resultItem.appendChild(annotationContainer);

            if (matchPercentage > highestMatch.value) {
                highestMatch = { element: resultItem, value: matchPercentage };
            }
        }
    });

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
        closestMatchButton.addEventListener("click", () => navigateToElement(highestMatch.element, "Bester Match"));
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

        bestDealButton.addEventListener("click", () => navigateToElement(lowestPriceDiff.element, "Bestes Deal"));
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
