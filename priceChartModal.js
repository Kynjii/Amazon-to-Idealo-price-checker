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

        formContainer.style = `
            position: fixed;
            top: 50%;
            transform: translateY(-50%);
            width: 25vw;
            min-width: 300px;
            max-width: 400px;
            background: white;
            border: 1px solid #fff;
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
        shopLabel.style = `display: block; margin-bottom: 5px; font-weight: bold; color: #333;`;
        formContainer.appendChild(shopLabel);

        const shopContainer = document.createElement("div");
        shopContainer.style = `position: relative; margin-bottom: 15px;`;

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

        shopContainer.appendChild(shopSelect);
        shopContainer.appendChild(customShopInput);
        formContainer.appendChild(shopContainer);

        const slackLabel = document.createElement("label");
        slackLabel.textContent = "Slack Webhook URL (optional):";
        slackLabel.style = `display: block; margin-bottom: 5px; font-weight: bold; color: #333;`;
        formContainer.appendChild(slackLabel);

        const slackInput = document.createElement("input");
        slackInput.type = "text";
        slackInput.placeholder = "https://hooks.slack.com/services/...";
        slackInput.style = `width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px; box-sizing: border-box;`;

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

        const messageBody = `${productName} zum ${priceType} von ${currentPrice} ${currentUrl}\n${priceReduction}${priceReductionPercent} unter dem Durchschnittspreis.`;

        const messageTextarea = document.createElement("textarea");
        messageTextarea.value = messageBody;
        messageTextarea.style = `width: 100%; height: 120px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px; box-sizing: border-box; resize: vertical; font-family: Arial, sans-serif; font-size: 12px;`;

        const slackButton = document.createElement("button");
        slackButton.textContent = "An Slack senden";
        slackButton.style = `width: 100%; padding: 10px; background-color: #4a154b; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 10px;`;

        const copyButton = document.createElement("button");
        copyButton.textContent = "In Zwischenablage kopieren";
        copyButton.style = `width: 100%; padding: 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 10px;`;

        const closeButton = document.createElement("button");
        closeButton.textContent = "Schließen";
        closeButton.style = `width: 100%; padding: 8px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;`;

        closeButton.addEventListener("click", () => {
            window.removeEventListener("resize", updateFormPosition);
            formContainer.remove();
        });

        formContainer.appendChild(messageTextarea);
        formContainer.appendChild(slackButton);
        formContainer.appendChild(copyButton);
        formContainer.appendChild(closeButton);

        document.body.appendChild(formContainer);
    }, 100);
}
