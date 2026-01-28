function isExternalLink(resultItem) {
    const externalForm = resultItem.querySelector('form[action*="/ipc/prg"]');
    return !!externalForm;
}

function getMatchLevel(percentage) {
    if (percentage >= 90) return "high";
    if (percentage >= 80) return "medium";
    return "low";
}

function formatPriceDifference(priceDifference) {
    const numDiff = parseFloat(priceDifference);
    return numDiff < 0 ? `${priceDifference}€` : `+${priceDifference}€`;
}

function isSavings(priceDifference) {
    return parseFloat(priceDifference) < 0;
}

function isSamePrice(priceDifference) {
    return parseFloat(priceDifference) === 0;
}

function getPriceClass(priceDifference) {
    if (isSamePrice(priceDifference)) return "same";
    return isSavings(priceDifference) ? "savings" : "more";
}

function createSimilarityBadge(matchPercentage) {
    const badge = document.createElement("span");
    badge.classList.add("spca-card-badge", "spca-card-badge--similarity");
    badge.classList.add(`spca-card-badge--${getMatchLevel(matchPercentage)}`);
    badge.title = `${matchPercentage}% Namensähnlichkeit`;
    return badge;
}

function createPriceBadge(priceDifference, priceSiteName) {
    if (priceDifference === null) return null;

    const badge = document.createElement("span");
    badge.classList.add("spca-card-badge", "spca-card-badge--price");
    badge.classList.add(`spca-card-badge--${getPriceClass(priceDifference)}`);
    const titleText = isSamePrice(priceDifference) ? `Gleicher Preis wie ${priceSiteName}` : `${formatPriceDifference(priceDifference)} vs. ${priceSiteName}`;
    badge.title = titleText;
    return badge;
}

function createWarningBadge() {
    const badge = document.createElement("span");
    badge.classList.add("spca-card-badge", "spca-card-badge--warning");
    badge.title = "Externer Shop – Idealo hat keine detaillierten Infos";
    badge.innerHTML = `<img src="${chrome.runtime.getURL("assets/warning.png")}" alt="">`;
    return badge;
}

function createToggleButton() {
    const button = document.createElement("button");
    button.classList.add("spca-card-toggle");
    button.innerHTML = `<span class="spca-card-toggle-icon">▶</span>`;
    button.setAttribute("aria-expanded", "false");
    return button;
}

function createDetailRow(circleClass, label, value, valueClass = "") {
    const row = document.createElement("div");
    row.classList.add("spca-card-row");

    const leftSide = document.createElement("div");
    leftSide.classList.add("spca-card-row-left");

    const circle = document.createElement("span");
    circle.classList.add("spca-card-badge", circleClass);
    leftSide.appendChild(circle);

    const labelSpan = document.createElement("span");
    labelSpan.classList.add("spca-card-label");
    labelSpan.textContent = label;
    leftSide.appendChild(labelSpan);

    const valueSpan = document.createElement("span");
    valueSpan.classList.add("spca-card-value");
    if (valueClass) valueSpan.classList.add(valueClass);
    valueSpan.textContent = value;

    row.appendChild(leftSide);
    row.appendChild(valueSpan);
    return row;
}

function createWarningRow() {
    const row = document.createElement("div");
    row.classList.add("spca-card-row", "spca-card-row--warning");

    const icon = document.createElement("img");
    icon.src = chrome.runtime.getURL("assets/warning.png");
    icon.width = 14;
    icon.height = 14;
    icon.alt = "Warnung";

    const text = document.createElement("span");
    text.classList.add("spca-card-warning-text");
    text.textContent = "Externer Shop – Idealo hat keine detaillierten Infos";

    row.appendChild(icon);
    row.appendChild(text);
    return row;
}

function createCollapsedView(matchPercentage, priceDifference, priceSiteName, isExternal) {
    const view = document.createElement("div");
    view.classList.add("spca-card-collapsed");

    view.appendChild(createSimilarityBadge(matchPercentage));

    const priceBadge = createPriceBadge(priceDifference, priceSiteName);
    if (priceBadge) {
        view.appendChild(priceBadge);
    }

    if (isExternal) {
        view.appendChild(createWarningBadge());
    }

    view.appendChild(createToggleButton());

    return view;
}

function createExpandedView(matchPercentage, priceDifference, priceSiteName, isExternal) {
    const view = document.createElement("div");
    view.classList.add("spca-card-expanded");

    // Title
    const title = document.createElement("div");
    title.classList.add("spca-card-title");
    title.textContent = "Produktvergleich";
    view.appendChild(title);

    // Similarity row with circle
    const matchLevel = getMatchLevel(matchPercentage);
    const matchDescription = matchLevel === "high" ? "Sehr guter Match" : matchLevel === "medium" ? "Guter Match" : "Niedriger Match";
    view.appendChild(createDetailRow(`spca-card-badge--${matchLevel}`, "Namensähnlichkeit", `${matchPercentage}% - ${matchDescription}`, `spca-card-value--${matchLevel}`));

    // Price comparison row with circle
    if (priceDifference !== null) {
        const priceType = getPriceClass(priceDifference);
        const priceClass = `spca-card-badge--${priceType}`;
        const priceValueClass = `spca-card-value--${priceType}`;
        let priceText;
        if (isSamePrice(priceDifference)) {
            priceText = `Gleicher Preis wie ${priceSiteName}`;
        } else if (isSavings(priceDifference)) {
            priceText = `${formatPriceDifference(priceDifference)} günstiger als ${priceSiteName}`;
        } else {
            priceText = `${formatPriceDifference(priceDifference)} teurer als ${priceSiteName}`;
        }
        view.appendChild(createDetailRow(priceClass, "Preisdifferenz", priceText, priceValueClass));
    }

    // Warning row
    if (isExternal) {
        view.appendChild(createWarningRow());
    }

    return view;
}

function createComparisonCard(matchPercentage, priceDifference, priceSiteName, isExternal) {
    const card = document.createElement("div");
    card.setAttribute("data-extension-ui", "true");
    card.classList.add("spca-card");

    const collapsedView = createCollapsedView(matchPercentage, priceDifference, priceSiteName, isExternal);
    const expandedView = createExpandedView(matchPercentage, priceDifference, priceSiteName, isExternal);

    card.appendChild(collapsedView);
    card.appendChild(expandedView);

    const toggleBtn = collapsedView.querySelector(".spca-card-toggle");
    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isExpanded = card.classList.toggle("spca-card--expanded");
        toggleBtn.setAttribute("aria-expanded", isExpanded.toString());
    });

    return card;
}

function createKeepaButton(asin, isHeader = false) {
    if (!asin) return null;

    const button = document.createElement("a");
    button.href = `https://keepa.com/#!product/3-${asin}`;
    button.target = "_blank";
    button.addEventListener("click", (e) => e.stopPropagation());

    if (isHeader) {
        button.classList.add("spca-keepa-header-button");
        button.innerHTML = `<img src="${chrome.runtime.getURL("assets/plus.png")}" width="16" height="16" alt=""> Auf Keepa ansehen`;
    } else {
        button.textContent = "Keepa";
        button.classList.add("extension-annotation", "spca-keepa-button");
    }

    return button;
}

function createKeepaHeader(asin) {
    const container = document.createElement("div");
    container.setAttribute("data-keepa-header", "true");
    container.setAttribute("data-extension-ui", "true");
    container.classList.add("spca-keepa-header");

    const button = createKeepaButton(asin, true);
    if (button) {
        container.appendChild(button);
    }

    return container;
}

function addKeepaButtonToGrid(asin) {
    if (!asin) return;
    if (document.querySelector('[data-keepa-header="true"]')) return;

    const resultList = document.querySelector(".sr-resultList__item_m6xdA")?.parentElement;
    if (!resultList) return;

    const keepaHeader = createKeepaHeader(asin);
    resultList.parentElement.insertBefore(keepaHeader, resultList);
}

function createNavButton(text, className, onClick) {
    const button = document.createElement("button");
    button.textContent = text;
    button.classList.add("spca-nav-button", className);
    button.addEventListener("click", onClick);
    return button;
}

function createNavButtonWithIcon(iconText, labelText, className) {
    const button = document.createElement("button");
    button.innerHTML = `<span class="spca-nav-button__icon">${iconText}</span> ${labelText}`;
    button.classList.add("spca-nav-button", className);
    return button;
}

function createMatchButton(element) {
    const button = createNavButton("Bester Match", "spca-nav-button--match", () => navigateToElement(element, "Bester Match"));

    button.addEventListener("mouseover", () => element?.classList.add("spca-result-item--highlight-match"));
    button.addEventListener("mouseout", () => element?.classList.remove("spca-result-item--highlight-match"));

    return button;
}

function createDealButton(element) {
    const button = createNavButton("Bestes Deal", "spca-nav-button--deal", () => navigateToElement(element, "Bestes Deal"));

    button.addEventListener("mouseover", () => element?.classList.add("spca-result-item--highlight-deal"));
    button.addEventListener("mouseout", () => element?.classList.remove("spca-result-item--highlight-deal"));

    return button;
}

function createExpandAllButton() {
    const button = createNavButtonWithIcon("▼", "Details", "spca-nav-button--expand");
    button.setAttribute("data-expand-all", "true");
    button.setAttribute("data-expanded", "false");

    button.addEventListener("click", () => toggleAllCards(button));

    return button;
}

function createToggleUIButton() {
    const button = createNavButton("An/Aus", "spca-nav-button--toggle", toggleExtensionUI);
    button.setAttribute("data-toggle-ui", "true");
    return button;
}

function toggleAllCards(expandButton) {
    const allCards = document.querySelectorAll(".spca-card");
    const isCurrentlyExpanded = expandButton.getAttribute("data-expanded") === "true";

    allCards.forEach((card) => {
        const toggle = card.querySelector(".spca-card__toggle");
        if (isCurrentlyExpanded) {
            card.classList.remove("spca-card--expanded");
            if (toggle) toggle.setAttribute("aria-expanded", "false");
        } else {
            card.classList.add("spca-card--expanded");
            if (toggle) toggle.setAttribute("aria-expanded", "true");
        }
    });

    expandButton.setAttribute("data-expanded", (!isCurrentlyExpanded).toString());
    expandButton.innerHTML = isCurrentlyExpanded ? `<span class="spca-nav-button__icon">▼</span> Details` : `<span class="spca-nav-button__icon">▲</span> Details`;
}

function getOrCreateNavContainer() {
    let container = document.querySelector('[data-nav-buttons="true"]');

    if (!container) {
        container = document.createElement("div");
        container.classList.add("spca-nav-container");
        container.setAttribute("data-nav-buttons", "true");
        document.body.appendChild(container);
    }

    return container;
}

function clearNavContainer(container) {
    [...container.children].forEach((child) => {
        if (!child.getAttribute("data-toggle-ui") && !child.getAttribute("data-expand-all")) {
            container.removeChild(child);
        }
    });
}

function createNavButtons(highestMatch, lowestPriceDiff) {
    const container = getOrCreateNavContainer();
    clearNavContainer(container);

    if (highestMatch.element) {
        container.appendChild(createMatchButton(highestMatch.element));
    }

    if (lowestPriceDiff.element) {
        container.appendChild(createDealButton(lowestPriceDiff.element));
    }

    if (!document.querySelector('[data-expand-all="true"]')) {
        container.appendChild(createExpandAllButton());
    }

    if (!document.querySelector('[data-toggle-ui="true"]')) {
        container.appendChild(createToggleUIButton());
    }
}

function extractResultData(resultItem, productTitle, referencePrice) {
    const titleElement = resultItem.querySelector(".sr-productSummary__title_f5flP");
    const priceElement = resultItem.querySelector('.sr-detailedPriceInfo__price_sYVmx, [data-testid="detailedPriceInfo__price"]');

    if (!titleElement || !priceElement) return null;

    const resultTitle = titleElement.textContent.trim();
    const similarity = cosine.similarity(productTitle, resultTitle);
    const matchPercentage = Math.round(similarity * 100);

    const idealoPrice = extractPrice(priceElement.textContent.replace("ab", "").trim());
    const priceDifference = !isNaN(referencePrice) && !isNaN(idealoPrice) ? (idealoPrice - referencePrice).toFixed(2) : null;

    return {
        matchPercentage,
        priceDifference,
        isExternal: isExternalLink(resultItem)
    };
}

function applyHighlights(highestMatch, lowestPriceDiff) {
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
}

function processIdealoResults(referencePrice, priceSiteName, productTitle, productAsin) {
    const resultItems = document.querySelectorAll('.sr-resultList__item_m6xdA, [data-testid="resultItem"]:has(.sr-productSummary__title_f5flP)');

    let highestMatch = { element: null, value: 0 };
    let lowestPriceDiff = { element: null, value: Number.POSITIVE_INFINITY };

    resultItems.forEach((resultItem) => {
        const data = extractResultData(resultItem, productTitle, referencePrice);
        if (!data) return;

        const { matchPercentage, priceDifference, isExternal } = data;

        const card = createComparisonCard(matchPercentage, priceDifference, priceSiteName, isExternal);
        resultItem.classList.add("spca-result-item");
        resultItem.appendChild(card);

        if (priceDifference !== null && !isNaN(priceDifference)) {
            const numericPriceDiff = parseFloat(priceDifference);
            if (numericPriceDiff < lowestPriceDiff.value) {
                lowestPriceDiff = { element: resultItem, value: numericPriceDiff };
            }
        }

        if (matchPercentage > highestMatch.value) {
            highestMatch = { element: resultItem, value: matchPercentage };
        }
    });

    applyHighlights(highestMatch, lowestPriceDiff);
    createNavButtons(highestMatch, lowestPriceDiff);
}

function navigateToElement(element, label) {
    if (!element) {
        console.error(`No highlighted ${label} element.`);
        return;
    }

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
}

function toggleExtensionUI() {
    const extensionElements = document.querySelectorAll('[data-extension-ui="true"], [data-product-container="true"], .extension-annotation');

    if (extensionElements.length === 0) {
        console.log("Extension UI elements not found");
        return;
    }

    const isVisible = isExtensionUIVisible(extensionElements);

    extensionElements.forEach((element) => {
        if (isVisible) {
            hideElement(element);
        } else {
            showElement(element);
        }
    });
}

function isExtensionUIVisible(elements) {
    for (const element of elements) {
        if (!element.hasAttribute("data-product-container") && element.style.display !== "none" && getComputedStyle(element).display !== "none") {
            return true;
        }
    }
    return false;
}

function hideElement(element) {
    if (element.classList?.contains("highlighted-element")) {
        element.dataset.originalBorder = element.style.border;
        element.dataset.originalBackground = element.style.backgroundColor;
        element.style.border = "0";
        element.style.backgroundColor = "transparent";
    }

    if (!element.hasAttribute("data-product-container")) {
        element.style.display = "none";
    }
}

function showElement(element) {
    if (element.classList?.contains("highlighted-element")) {
        element.style.border = element.dataset.originalBorder || "";
        element.style.backgroundColor = element.dataset.originalBackground || "";
    }

    if (!element.hasAttribute("data-product-container")) {
        element.style.display = "flex";
    }
}

function createExternalLinkBadge() {
    const badge = document.createElement("span");
    badge.innerHTML = `<img src="${chrome.runtime.getURL("assets/warning.png")}" width="14" height="14" alt="Warnung">`;
    badge.title = "Idealo stellt keine detaillierten Informationen bereit, ein Klick führt zu einem externen Shop.";
    badge.classList.add("extension-annotation", "spca-external-badge");
    return badge;
}
