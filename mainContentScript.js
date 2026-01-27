(function initializeExtension() {
    const currentUrl = window.location.href;
    const hostname = window.location.hostname;

    if (currentUrl.includes("mydealz.de")) {
        setTimeout(() => {
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
        }, 1000);
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

    const currentSite = Object.values(siteConfigs).find((site) => hostname.includes(site.hostPattern));
    if (currentSite) {
        handleSite(currentSite);
    } else if (hostname.includes("idealo.")) {
        setTimeout(() => setupPriceChartDetection(), 1000);

        const allStorageKeys = Object.values(siteConfigs).map((site) => site.storageKey);
        chrome.storage.local.get(allStorageKeys, (result) => {
            let referencePrice = null;
            let priceSiteName = null;

            for (const site of Object.values(siteConfigs)) {
                if (result[site.storageKey] && !isNaN(result[site.storageKey])) {
                    referencePrice = result[site.storageKey];
                    priceSiteName = site.name;
                    break;
                }
            }

            if (!referencePrice || isNaN(referencePrice)) {
                return;
            }

            const searchQuery = new URL(window.location.href).searchParams.get("q");
            if (!searchQuery) return;

            processIdealoResults(referencePrice, priceSiteName, searchQuery);
        });
    }
})();
