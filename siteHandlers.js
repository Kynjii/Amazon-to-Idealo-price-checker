const siteConfigs = {
    amazon: {
        name: "Amazon",
        hostPattern: "amazon.",
        storageKey: "amazonPrice",
        selectors: {
            title: "#productTitle",
            priceWhole: ".a-price-whole",
            priceFraction: ".a-price-fraction"
        },
        extractPrice: (titleEl, wholeEl, fracEl) => {
            if (!titleEl || !wholeEl || !fracEl) return null;
            const wholePart = wholeEl.textContent.trim().replace(",", ".");
            const fractionPart = fracEl.textContent.trim();
            return parseFloat(`${wholePart}${fractionPart}`);
        },
        extractSearchTerms: (titleEl) => {
            const productTitle = titleEl.innerText.trim();
            const artikelnummer = extractArtikelnummer();
            const amazonIdentifier = extractAmazonIdentifier();
            const cleanTitle = cleanSearchQuery(productTitle);

            const searchQueryParts = [];
            if (artikelnummer) searchQueryParts.push(artikelnummer);
            if (amazonIdentifier) searchQueryParts.push(amazonIdentifier);
            if (cleanTitle) searchQueryParts.push(cleanTitle);

            return searchQueryParts;
        }
    },
    breuninger: {
        name: "Breuninger",
        hostPattern: "breuninger.",
        storageKey: "breuningerPrice",
        selectors: {
            container: ".ents-pds-summary",
            brand: ".bewerten-zusammenfassung__heading__link span",
            productName: ".bewerten-zusammenfassung__name",
            price: ".ents-price-area .bdk-badge-price",
            color: ".ents-colors-thumbnails fieldset span.ents-copy-small-bold",
            title: "h1.bewerten-zusammenfassung__heading"
        },
        extractPrice: (container) => {
            const priceElement = container.querySelector(".ents-price-area .bdk-badge-price");
            const priceText = priceElement ? priceElement.textContent.trim() : "";
            return extractPrice(priceText);
        },
        extractSearchTerms: (container) => {
            const brandElement = container.querySelector(".bewerten-zusammenfassung__heading__link span");
            const brandName = brandElement ? brandElement.textContent.trim() : "";
            const productNameElement = container.querySelector(".bewerten-zusammenfassung__name");
            const productName = productNameElement ? productNameElement.textContent.trim() : "";
            const colorElement = container.querySelector(".ents-colors-thumbnails fieldset span.ents-copy-small-bold");
            const colorName = colorElement ? colorElement.textContent.trim() : "";

            const searchQueryParts = [];
            if (brandName) searchQueryParts.push(cleanSearchQuery(brandName));
            if (productName) searchQueryParts.push(cleanSearchQuery(productName));
            if (colorName) {
                const cleanColor = colorName.replace(/^Farbe:\s*/i, "").trim();
                if (cleanColor) searchQueryParts.push(cleanSearchQuery(cleanColor));
            }

            return searchQueryParts;
        }
    }
};

function handleSite(siteConfig) {
    if (siteConfig.name === "Amazon") {
        const titleElement = document.querySelector(siteConfig.selectors.title);
        const priceElement = document.querySelector(siteConfig.selectors.priceWhole);
        const fractionElement = document.querySelector(siteConfig.selectors.priceFraction);

        if (titleElement && priceElement && fractionElement) {
            const price = siteConfig.extractPrice(titleElement, priceElement, fractionElement);
            if (price) {
                const productTitle = titleElement.innerText.trim();
                const asin = extractAmazonIdentifier();
                const storageUpdate = {
                    productTitle: productTitle,
                    productAsin: asin,
                    idealoButtonClicked: false
                };
                Object.values(siteConfigs).forEach((site) => {
                    storageUpdate[site.storageKey] = site.storageKey === siteConfig.storageKey ? price : null;
                });
                chrome.storage.local.set(storageUpdate, () => {});

                const searchTerms = siteConfig.extractSearchTerms(titleElement);
                addIdealoButton(titleElement, searchTerms, "1rem");
            }
        }
    } else if (siteConfig.name === "Breuninger") {
        if (window.location.pathname.includes("/p/")) {
            const container = document.querySelector(siteConfig.selectors.container);
            if (container) {
                const titleElement = container.querySelector(siteConfig.selectors.title);
                const brandElement = container.querySelector(siteConfig.selectors.brand);
                const productNameElement = container.querySelector(siteConfig.selectors.productName);

                if (titleElement && (brandElement || productNameElement)) {
                    const price = siteConfig.extractPrice(container);
                    if (price) {
                        const brandElement = container.querySelector(".bewerten-zusammenfassung__heading__link span");
                        const productNameElement = container.querySelector(".bewerten-zusammenfassung__name");
                        const brandName = brandElement ? brandElement.textContent.trim() : "";
                        const productName = productNameElement ? productNameElement.textContent.trim() : "";
                        const productTitle = [brandName, productName].filter(Boolean).join(" ");
                        const storageUpdate = {
                            productTitle: productTitle,
                            productAsin: null,
                            idealoButtonClicked: false
                        };
                        Object.values(siteConfigs).forEach((site) => {
                            storageUpdate[site.storageKey] = site.storageKey === siteConfig.storageKey ? price : null;
                        });
                        chrome.storage.local.set(storageUpdate, () => {});

                        const searchTerms = siteConfig.extractSearchTerms(container);
                        addIdealoButton(titleElement, searchTerms, "2rem");
                    }
                }
            }
        }
    }
}
