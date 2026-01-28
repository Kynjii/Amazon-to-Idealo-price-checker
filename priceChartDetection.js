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
    formButton.className = "spca-price-info-btn";
    formButton.textContent = "✒️";
    formButton.title = "Deal-Nachricht erstellen";

    formButton.addEventListener("click", (e) => {
        e.stopPropagation();
        const existingForm = document.querySelector('[data-price-form="true"]');
        if (existingForm) {
            try {
                chrome.storage.local.set({ priceFormOpen: false });
            } catch (err) {
                // Extension context invalidated, ignore
            }
            existingForm.remove();
        } else {
            try {
                chrome.storage.local.set({ priceFormOpen: true });
            } catch (err) {
                // Extension context invalidated, ignore
            }
            if (typeof createPriceChartForm === "function") {
                createPriceChartForm();
            }
        }
    });

    modalHeader.style.position = "relative";
    modalHeader.appendChild(formButton);

    try {
        chrome.storage.local.get(["priceFormOpen"], (result) => {
            if (chrome.runtime.lastError) return;
            if (result.priceFormOpen) {
                setTimeout(() => createPriceChartForm(), 100);
            }
        });
    } catch (err) {
        // Extension context invalidated, ignore
    }
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

                document.querySelectorAll(".spca-price-percentage").forEach((el) => el.remove());
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
    document.querySelectorAll(".spca-price-percentage").forEach((el) => el.remove());

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

        if (!isIncrease && !isDecrease) {
            return;
        }

        const percentageChange = (changeAmount / historicalPrice) * 100;

        const existingPercentage = row.querySelector(".spca-price-percentage");
        if (existingPercentage) {
            existingPercentage.remove();
        }

        if (!isFinite(percentageChange) || historicalPrice <= 0) {
            return;
        }

        const percentageDiv = document.createElement("div");
        percentageDiv.className = "spca-price-percentage";

        const formattedPercentage = Math.abs(percentageChange).toFixed(1);
        percentageDiv.textContent = `${isIncrease ? "+" : "-"}${formattedPercentage}%`;

        if (isIncrease) {
            percentageDiv.classList.add("spca-price-percentage-increase");
        } else if (isDecrease) {
            const absPercentage = Math.abs(percentageChange);
            if (absPercentage > 0 && absPercentage <= 10) {
                percentageDiv.classList.add("spca-price-percentage-decrease-low");
            } else if (absPercentage > 10 && absPercentage <= 20) {
                percentageDiv.classList.add("spca-price-percentage-decrease-medium");
            } else if (absPercentage > 20) {
                percentageDiv.classList.add("spca-price-percentage-decrease-high");
            }
        }

        row.style.position = "relative";
        row.appendChild(percentageDiv);
    });
}
