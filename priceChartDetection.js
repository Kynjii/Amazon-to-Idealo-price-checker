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

        if (!isIncrease && !isDecrease) {
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

        let color = "#dc3545";
        let borderColor = "#dc3545";

        if (isDecrease) {
            const absPercentage = Math.abs(percentageChange);
            if (absPercentage > 0 && absPercentage <= 10) {
                color = "#007bff";
                borderColor = "#007bff";
            } else if (absPercentage > 10 && absPercentage <= 20) {
                color = "#ffc107";
                borderColor = "#ffc107";
            } else if (absPercentage > 20) {
                color = "#28a745";
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
