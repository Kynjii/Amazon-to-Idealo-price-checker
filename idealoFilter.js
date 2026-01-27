function refreshBestDealFilter() {
    const config = {
        containerAttribute: "data-best-deal-filter",
        iconAttribute: "data-best-deal-filter-icon",
        openStorageKey: "idealoBestDealFilterOpen", 
        selectionsStorageKey: "idealoSelectedProviders",
        labelText: "Shop Filter",
        getProductCards: () => Array.from(document.querySelectorAll(".sr-resultList__item_m6xdA")),
        extractItemName: (card) => {
            const bestDealElement = card.querySelector('[aria-label="Best-Deal"]');
            if (bestDealElement) {
                const img = bestDealElement.querySelector('img[alt^="Best-Deal von "]');
                if (img) {
                    const altText = img.getAttribute("alt");
                    const match = altText.match(/Best-Deal von (.+)/);
                    if (match) {
                        return match[1];
                    }
                }
            }
            return null;
        },
        matchesCard: (card, name) => {
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
        }
    };

    createGenericFilter(config);
}