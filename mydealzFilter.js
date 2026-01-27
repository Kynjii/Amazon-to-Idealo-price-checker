function refreshMyDealzMerchantFilter() {
    const config = {
        containerAttribute: "data-mydealz-merchant-filter",
        iconAttribute: "data-mydealz-merchant-filter-icon",
        openStorageKey: "mydealzFilterOpen",
        selectionsStorageKey: "mydealzSelectedMerchants",
        labelText: "Shop Filter",
        getProductCards: () => Array.from(document.querySelectorAll('article[data-t="thread"]')),
        extractItemName: (card) => {
            const merchantLink = card.querySelector('a[data-t="merchantLink"]');
            return merchantLink ? merchantLink.textContent.trim() : null;
        },
        matchesCard: (card, name) => {
            const merchantLink = card.querySelector('a[data-t="merchantLink"]');
            return merchantLink && merchantLink.textContent.trim() === name;
        }
    };

    createGenericFilter(config);
}
