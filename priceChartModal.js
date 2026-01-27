function extractProductData() {
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

    return {
        productName,
        currentPrice,
        currentUrl,
        priceReduction,
        priceReductionPercent,
        priceType,
        priceStats
    };
}

function createFormContainer() {
    const priceModal = document.querySelector('[role="dialog"]') || document.querySelector(".modal") || document.querySelector('[data-testid*="modal"]');

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

    return formContainer;
}

function setupFormPositioning(formContainer) {
    const priceModal = document.querySelector('[role="dialog"]') || document.querySelector(".modal") || document.querySelector('[data-testid*="modal"]');

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
    return updateFormPosition;
}

function createShopSelection(formContainer) {
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

    function getSelectedShopName() {
        if (shopSelect.value === "custom") {
            return customShopInput.value.trim() || "Custom Shop";
        }
        return shopSelect.value;
    }

    shopContainer.appendChild(shopSelect);
    shopContainer.appendChild(customShopInput);
    formContainer.appendChild(shopContainer);

    return { shopSelect, customShopInput, getSelectedShopName };
}

function createSlackInput(formContainer) {
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
    return slackInput;
}

function createToggleControls(formContainer, messageTextarea) {
    const togglesContainer = document.createElement("div");
    togglesContainer.style = `display: flex; gap: 15px; margin-bottom: 15px; align-items: center;`;

    const emojiToggleContainer = document.createElement("div");
    emojiToggleContainer.style = `display: flex; align-items: center; padding: 8px; background-color: #f8f9fa; border-radius: 4px; flex: 1;`;

    const emojiToggleCheckbox = document.createElement("input");
    emojiToggleCheckbox.type = "checkbox";
    emojiToggleCheckbox.id = "emoji-toggle";

    const emojiToggleLabel = document.createElement("label");
    emojiToggleLabel.textContent = "Prozent-Emoji";
    emojiToggleLabel.setAttribute("for", "emoji-toggle");
    emojiToggleLabel.style = `margin-left: 8px; color: #333; cursor: pointer; font-size: 12px;`;

    emojiToggleContainer.appendChild(emojiToggleCheckbox);
    emojiToggleContainer.appendChild(emojiToggleLabel);

    const rekordpreisButton = document.createElement("button");
    rekordpreisButton.textContent = "🔥 Rekordpreis";
    rekordpreisButton.type = "button";
    rekordpreisButton.style = `padding: 8px 12px; background-color: #ffc107; color: #212529; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px; transition: all 0.2s ease; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.1);`;

    rekordpreisButton.addEventListener("click", (e) => {
        e.preventDefault();
        const currentMessage = messageTextarea.value;
        const updatedMessage = currentMessage.replace(/zum (Tiefstpreis|guten Preis|Bestpreis|Rekordpreis) von/, "zum Rekordpreis von");
        messageTextarea.value = updatedMessage;

        rekordpreisButton.style.backgroundColor = "#28a745";
        rekordpreisButton.textContent = "🔥 Gesetzt!";

        setTimeout(() => {
            rekordpreisButton.style.backgroundColor = "#ffc107";
            rekordpreisButton.textContent = "🔥 Rekordpreis";
        }, 2000);
    });

    togglesContainer.appendChild(emojiToggleContainer);
    togglesContainer.appendChild(rekordpreisButton);
    formContainer.appendChild(togglesContainer);

    return { emojiToggleCheckbox, rekordpreisButton };
}

function createEmojiSelection(formContainer) {
    const messageLabel = document.createElement("label");
    messageLabel.textContent = "Nachrichtentext:";
    messageLabel.style = `display: block; margin-bottom: 5px; font-weight: bold; color: #333;`;
    formContainer.appendChild(messageLabel);

    const emojiSectionContainer = document.createElement("div");
    emojiSectionContainer.style = `margin-bottom: 10px;`;

    const emojiToggleHeader = document.createElement("button");
    emojiToggleHeader.textContent = "🎯 Emoji auswählen";
    emojiToggleHeader.type = "button";
    emojiToggleHeader.style = `width: 100%; padding: 8px 12px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; cursor: pointer; font-size: 12px; text-align: left; display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; transition: background-color 0.2s ease;`;

    const toggleIcon = document.createElement("span");
    toggleIcon.textContent = "▼";
    toggleIcon.style = `font-size: 10px; transition: transform 0.2s ease;`;
    emojiToggleHeader.appendChild(toggleIcon);

    const emojiContainer = document.createElement("div");
    emojiContainer.style = `display: none; flex-wrap: wrap; gap: 5px; padding: 8px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 4px 4px;`;

    let isEmojiSectionOpen = false;

    emojiToggleHeader.addEventListener("click", (e) => {
        e.preventDefault();
        isEmojiSectionOpen = !isEmojiSectionOpen;

        if (isEmojiSectionOpen) {
            emojiContainer.style.display = "flex";
            toggleIcon.style.transform = "rotate(180deg)";
            emojiToggleHeader.style.backgroundColor = "#e9ecef";
        } else {
            emojiContainer.style.display = "none";
            toggleIcon.style.transform = "rotate(0deg)";
            emojiToggleHeader.style.backgroundColor = "#f8f9fa";
        }
    });

    emojiSectionContainer.appendChild(emojiToggleHeader);

    const emojis = ["🔥", "☕️", "☀️", "🥷", "❄️", "🎄", "🛍️", "🍫", "✨", "💸", "🚨"];
    const selectedEmojis = new Set();

    emojis.forEach((emoji) => {
        const emojiBtn = document.createElement("button");
        emojiBtn.textContent = emoji;
        emojiBtn.type = "button";
        emojiBtn.style = `padding: 8px; border: 2px solid #ddd; border-radius: 4px; background: white; cursor: pointer; font-size: 16px; transition: all 0.2s ease;`;

        emojiBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (selectedEmojis.has(emoji)) {
                selectedEmojis.delete(emoji);
                emojiBtn.style.border = "2px solid #ddd";
                emojiBtn.style.background = "white";
            } else {
                selectedEmojis.add(emoji);
                emojiBtn.style.border = "2px solid #007bff";
                emojiBtn.style.background = "#e7f3ff";
            }
        });

        emojiContainer.appendChild(emojiBtn);
    });

    emojiSectionContainer.appendChild(emojiContainer);
    formContainer.appendChild(emojiSectionContainer);

    return selectedEmojis;
}

function createMessageTextarea(formContainer, productData, emojiToggleCheckbox) {
    const { productName, priceType, currentPrice, currentUrl, priceReduction, priceReductionPercent, priceStats } = productData;
    const messageBody = `${productName} zum ${priceType} von ${currentPrice} ${currentUrl}\n${priceReduction}${priceReductionPercent} unter dem Durchschnittspreis.`;

    const messageTextarea = document.createElement("textarea");
    messageTextarea.value = messageBody;
    messageTextarea.style = `width: 100%; height: 120px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px; box-sizing: border-box; resize: vertical; font-family: Arial, sans-serif; font-size: 12px;`;

    function updateMessageWithEmojis() {
        const useEmojis = emojiToggleCheckbox.checked;
        let updatedMessage = messageBody;

        if (useEmojis && priceStats && priceReductionPercent) {
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
                const changeElement = targetRow.querySelector(".priceHistoryStatistics-change.decreased, .priceHistoryStatistics-change.increased");

                if (changeElement) {
                    const isDecrease = changeElement.classList.contains("decreased");
                    let emoji = "🔴";

                    if (isDecrease) {
                        const percentMatch = priceReductionPercent.match(/(\d+(?:\.\d+)?)%/);
                        if (percentMatch) {
                            const percentNum = parseFloat(percentMatch[1]);
                            if (percentNum > 20) {
                                emoji = "🟢";
                            } else if (percentNum >= 10) {
                                emoji = "🟡";
                            } else {
                                emoji = "🔵";
                            }
                        } else {
                            emoji = "🟢";
                        }
                    }

                    const plainPercent = priceReductionPercent.trim();
                    if (plainPercent.startsWith("(") && plainPercent.endsWith(")")) {
                        const percentContent = plainPercent.slice(1, -1);
                        updatedMessage = updatedMessage.replace(priceReductionPercent, ` (${emoji}${percentContent})`);
                    }
                }
            }
        }

        messageTextarea.value = updatedMessage;
    }

    chrome.storage.local.get(["emojiToggleEnabled"], (result) => {
        if (chrome.runtime.lastError) {
            console.log("Extension context invalidated, page reload required");
            return;
        }
        emojiToggleCheckbox.checked = result.emojiToggleEnabled !== undefined ? result.emojiToggleEnabled : true;
        updateMessageWithEmojis();
    });

    emojiToggleCheckbox.addEventListener("change", () => {
        if (chrome.runtime.lastError) {
            console.log("Extension context invalidated, page reload required");
            return;
        }
        chrome.storage.local.set({ emojiToggleEnabled: emojiToggleCheckbox.checked });
        updateMessageWithEmojis();
    });

    formContainer.appendChild(messageTextarea);
    return messageTextarea;
}

function createActionButtons(formContainer, { slackInput, messageTextarea, getSelectedShopName, selectedEmojis }, updateFormPosition) {
    const slackButton = document.createElement("button");
    slackButton.textContent = "An Slack senden";
    slackButton.style = `width: 100%; padding: 10px; background-color: #4a154b; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 10px;`;

    const copyButton = document.createElement("button");
    copyButton.textContent = "In Zwischenablage kopieren";
    copyButton.style = `width: 100%; padding: 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 10px;`;

    const closeButton = document.createElement("button");
    closeButton.textContent = "Schließen";
    closeButton.style = `width: 100%; padding: 8px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;`;

    slackButton.addEventListener("click", async () => {
        const webhookUrl = slackInput.value === "*****" ? slackInput.dataset.actualUrl : slackInput.value.trim();
        if (!webhookUrl) {
            alert("Bitte geben Sie eine Slack Webhook URL ein");
            return;
        }

        const shopName = getSelectedShopName();
        const originalMessage = messageTextarea.value;
        const emojiPrefix = Array.from(selectedEmojis).join("") + (selectedEmojis.size > 0 ? " " : "");

        const slackMessage = originalMessage.replace(/€[\d,]+/g, (match) => `*${match}*`).replace(/Rekordpreis/g, "*Rekordpreis*");
        const slackFormattedMessage = `${emojiPrefix}${shopName}: ${slackMessage}`;

        const payload = JSON.stringify({
            text: slackFormattedMessage,
            unfurl_links: false,
            unfurl_media: false
        });

        try {
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: `payload=${encodeURIComponent(payload)}`
            });

            if (response.ok) {
                chrome.storage.local.set({ slackWebhookUrl: webhookUrl });

                slackButton.textContent = "Gesendet!";
                slackButton.style.backgroundColor = "#28a745";

                setTimeout(() => {
                    slackButton.textContent = "An Slack senden";
                    slackButton.style.backgroundColor = "#4a154b";
                }, 2000);
            } else {
                throw new Error("Failed to send message");
            }
        } catch (err) {
            slackButton.textContent = "Fehler!";
            slackButton.style.backgroundColor = "#dc3545";
            console.error("Slack error:", err);

            setTimeout(() => {
                slackButton.textContent = "An Slack senden";
                slackButton.style.backgroundColor = "#4a154b";
            }, 2000);
        }
    });

    copyButton.addEventListener("click", async () => {
        const shopName = getSelectedShopName();
        const originalMessage = messageTextarea.value;
        const emojiPrefix = Array.from(selectedEmojis).join("") + (selectedEmojis.size > 0 ? " " : "");

        const finalMessage = `${emojiPrefix}${shopName}: ${originalMessage}`;

        try {
            await navigator.clipboard.writeText(finalMessage);
            copyButton.textContent = "Kopiert!";
            copyButton.style.backgroundColor = "#28a745";

            setTimeout(() => {
                copyButton.textContent = "In Zwischenablage kopieren";
                copyButton.style.backgroundColor = "#007bff";
            }, 2000);
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = finalMessage;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);

            copyButton.textContent = "Kopiert!";
            copyButton.style.backgroundColor = "#28a745";

            setTimeout(() => {
                copyButton.textContent = "In Zwischenablage kopieren";
                copyButton.style.backgroundColor = "#007bff";
            }, 2000);
        }
    });

    closeButton.addEventListener("click", () => {
        window.removeEventListener("resize", updateFormPosition);
        formContainer.remove();
    });

    formContainer.appendChild(slackButton);
    formContainer.appendChild(copyButton);
    formContainer.appendChild(closeButton);
}

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
        const productData = extractProductData();

        const formContainer = createFormContainer();
        const updateFormPosition = setupFormPositioning(formContainer);

        const shopSelection = createShopSelection(formContainer);
        const slackInput = createSlackInput(formContainer);

        const messageTextarea = createMessageTextarea(formContainer, productData, null);

        const { emojiToggleCheckbox } = createToggleControls(formContainer, messageTextarea);

        messageTextarea.remove();
        const finalMessageTextarea = createMessageTextarea(formContainer, productData, emojiToggleCheckbox);

        const selectedEmojis = createEmojiSelection(formContainer);

        createActionButtons(
            formContainer,
            {
                slackInput,
                messageTextarea: finalMessageTextarea,
                getSelectedShopName: shopSelection.getSelectedShopName,
                selectedEmojis
            },
            updateFormPosition
        );

        document.body.appendChild(formContainer);
    }, 100);
}
