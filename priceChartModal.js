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

            if (changeElement) {
                priceReduction = changeElement.textContent.trim();
                const percentageElement = targetRow.querySelector(".spca-price-percentage");
                if (percentageElement) {
                    priceReductionPercent = ` (${percentageElement.textContent.trim()})`;
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
    const formContainer = document.createElement("div");
    formContainer.setAttribute("data-price-form", "true");
    formContainer.className = "spca-form-container spca-form-positioned";

    const formHeader = document.createElement("div");
    formHeader.className = "spca-form-header";

    const formTitle = document.createElement("h3");
    formTitle.className = "spca-form-title";
    formTitle.textContent = "Deal-Nachricht erstellen";

    const headerButtons = document.createElement("div");
    headerButtons.className = "spca-header-buttons";

    const themeBtn = createThemeButton();

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "spca-btn-icon";
    closeBtn.innerHTML = "✕";
    closeBtn.title = "Schließen";
    closeBtn.addEventListener("click", () => {
        try {
            chrome.storage.local.set({ priceFormOpen: false });
        } catch (e) {
            console.log("Extension context invalidated");
        }
        formContainer.remove();
    });

    headerButtons.appendChild(themeBtn);
    headerButtons.appendChild(closeBtn);

    chrome.storage.local.get(["selectedTheme"], (result) => {
        const theme = result.selectedTheme || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        formContainer.classList.remove("spca-theme-light", "spca-theme-dark");
        formContainer.classList.add(`spca-theme-${theme}`);
    });

    formHeader.appendChild(formTitle);
    formHeader.appendChild(headerButtons);
    formContainer.appendChild(formHeader);

    return formContainer;
}

function setupFormPosition(formContainer, priceModal) {
    const updatePosition = () => {
        const modalRect = priceModal.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const formWidth = 400;
        const gap = 15;

        const leftPosition = modalRect.left - formWidth - gap;
        const rightPosition = modalRect.right + gap;

        if (leftPosition >= 0) {
            formContainer.style.left = `${leftPosition}px`;
        } else if (rightPosition + formWidth <= viewportWidth) {
            formContainer.style.left = `${rightPosition}px`;
        } else {
            formContainer.style.left = "20px";
        }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);

    const observer = new MutationObserver(() => {
        if (!document.body.contains(formContainer)) {
            window.removeEventListener("resize", updatePosition);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function createShopSelection(formContainer) {
    const shopLabel = document.createElement("label");
    shopLabel.textContent = "Shop-Name:";
    shopLabel.className = "spca-form-label";
    formContainer.appendChild(shopLabel);

    const shopContainer = document.createElement("div");
    shopContainer.style = `position: relative; margin-bottom: 18px;`;

    const shopSelect = document.createElement("select");
    shopSelect.className = "spca-form-select";

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
    customShopInput.className = "spca-form-input";
    customShopInput.style.display = "none";
    customShopInput.style.marginTop = "8px";

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
    slackLabel.className = "spca-form-label";
    formContainer.appendChild(slackLabel);

    const slackInput = document.createElement("input");
    slackInput.type = "text";
    slackInput.placeholder = "https://hooks.slack.com/services/...";
    slackInput.className = "spca-form-input";

    chrome.storage.local.get(["slackWebhookUrl"], (result) => {
        if (result.slackWebhookUrl) {
            slackInput.value = "*****";
            slackInput.dataset.actualUrl = result.slackWebhookUrl;
            slackInput.classList.add("spca-masked-input");
        }
    });

    slackInput.addEventListener("focus", () => {
        if (slackInput.value === "*****" && slackInput.dataset.actualUrl) {
            slackInput.value = slackInput.dataset.actualUrl;
            slackInput.classList.remove("spca-masked-input");
        }
    });

    slackInput.addEventListener("blur", () => {
        if (slackInput.dataset.actualUrl && slackInput.value === slackInput.dataset.actualUrl) {
            slackInput.value = "*****";
            slackInput.classList.add("spca-masked-input");
        }
    });

    formContainer.appendChild(slackInput);
    return slackInput;
}

function createToggleControls(formContainer) {
    const togglesContainer = document.createElement("div");
    togglesContainer.className = "spca-toggle-container";

    const emojiToggleContainer = document.createElement("div");
    emojiToggleContainer.className = "spca-toggle-item";

    const emojiToggleCheckbox = document.createElement("input");
    emojiToggleCheckbox.type = "checkbox";
    emojiToggleCheckbox.id = "spca-price-form-emoji-toggle";
    emojiToggleCheckbox.className = "spca-form-checkbox";

    const emojiToggleLabel = document.createElement("label");
    emojiToggleLabel.textContent = "Prozent-Emoji";
    emojiToggleLabel.setAttribute("for", "spca-price-form-emoji-toggle");
    emojiToggleLabel.className = "spca-form-label spca-toggle-label";

    emojiToggleContainer.appendChild(emojiToggleCheckbox);
    emojiToggleContainer.appendChild(emojiToggleLabel);

    const rekordpreisButton = document.createElement("button");
    rekordpreisButton.textContent = "🔥 Rekordpreis";
    rekordpreisButton.type = "button";
    rekordpreisButton.id = "spca-price-form-rekordpreis-button";
    rekordpreisButton.className = "spca-btn spca-btn-secondary spca-btn-rekordpreis";

    rekordpreisButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const messageTextarea = document.getElementById("spca-price-form-message-textarea");
        if (messageTextarea && messageTextarea.setPriceType) {
            messageTextarea.setPriceType("Rekordpreis");

            rekordpreisButton.classList.add("spca-btn-success");
            rekordpreisButton.textContent = "🔥 Gesetzt!";

            setTimeout(() => {
                rekordpreisButton.classList.remove("spca-btn-success");
                rekordpreisButton.textContent = "🔥 Rekordpreis";
            }, 2000);
        }
    });

    togglesContainer.appendChild(emojiToggleContainer);
    togglesContainer.appendChild(rekordpreisButton);
    formContainer.appendChild(togglesContainer);

    return { emojiToggleCheckbox, rekordpreisButton };
}

function createEmojiSelection(formContainer) {
    const emojiSectionContainer = document.createElement("div");
    emojiSectionContainer.className = "spca-emoji-container";

    const emojiToggleHeader = document.createElement("button");
    emojiToggleHeader.textContent = "🎯 Emoji auswählen";
    emojiToggleHeader.type = "button";
    emojiToggleHeader.className = "spca-emoji-toggle";

    const toggleIcon = document.createElement("span");
    toggleIcon.textContent = "▼";
    toggleIcon.style = `font-size: 10px; transition: transform 0.2s ease;`;
    emojiToggleHeader.appendChild(toggleIcon);

    const emojiContainer = document.createElement("div");
    emojiContainer.className = "spca-emoji-selection";

    let isEmojiSectionOpen = false;

    const emojis = ["🔥", "☕️", "☀️", "🥷", "❄️", "🎄", "🛍️", "🍫", "✨", "💸", "🚨"];
    const selectedEmojis = new Set();

    function toggleEmojiSection() {
        isEmojiSectionOpen = !isEmojiSectionOpen;

        if (isEmojiSectionOpen) {
            emojiContainer.classList.add("spca-expanded");
            toggleIcon.style.transform = "rotate(180deg)";
        } else {
            emojiContainer.classList.remove("spca-expanded");
            toggleIcon.style.transform = "rotate(0deg)";
        }
    }

    function saveSelectedEmojis() {
        chrome.storage.local.set({ selectedEmojis: Array.from(selectedEmojis) });
    }

    emojiToggleHeader.addEventListener("click", (e) => {
        e.preventDefault();
        toggleEmojiSection();
    });

    emojiSectionContainer.appendChild(emojiToggleHeader);

    emojis.forEach((emoji) => {
        const emojiBtn = document.createElement("button");
        emojiBtn.textContent = emoji;
        emojiBtn.type = "button";
        emojiBtn.setAttribute("data-emoji", emoji);
        emojiBtn.className = "spca-emoji-option";

        emojiBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (selectedEmojis.has(emoji)) {
                selectedEmojis.delete(emoji);
                emojiBtn.classList.remove("spca-selected");
            } else {
                selectedEmojis.add(emoji);
                emojiBtn.classList.add("spca-selected");
            }
            saveSelectedEmojis();
        });

        emojiContainer.appendChild(emojiBtn);
    });

    chrome.storage.local.get(["selectedEmojis"], (result) => {
        const savedEmojis = result.selectedEmojis || [];

        savedEmojis.forEach((emoji) => {
            if (emojis.includes(emoji)) {
                selectedEmojis.add(emoji);
                const emojiBtn = emojiContainer.querySelector(`button[data-emoji="${emoji}"]`);
                if (emojiBtn) {
                    emojiBtn.classList.add("spca-selected");
                }
            }
        });

        if (savedEmojis.length > 0) {
            isEmojiSectionOpen = true;
            emojiContainer.classList.add("spca-expanded");
            toggleIcon.style.transform = "rotate(180deg)";
        }
    });

    emojiSectionContainer.appendChild(emojiContainer);
    formContainer.appendChild(emojiSectionContainer);

    return selectedEmojis;
}

function createMessageTextarea(formContainer, productData, emojiToggleCheckbox) {
    const { productName, priceType, currentPrice, currentUrl, priceReduction, priceReductionPercent, priceStats } = productData;

    let currentPriceType = priceType;

    function getMessageBody() {
        return `${productName} zum ${currentPriceType} von ${currentPrice} ${currentUrl}
${priceReduction}${priceReductionPercent} unter dem Durchschnittspreis.`;
    }

    const messageTextarea = document.createElement("textarea");
    messageTextarea.id = "spca-price-form-message-textarea";
    messageTextarea.value = getMessageBody();
    messageTextarea.className = "spca-form-textarea";

    messageTextarea.setPriceType = (newType) => {
        currentPriceType = newType;
        updateMessageWithEmojis();
    };

    function updateMessageWithEmojis() {
        const useEmojis = emojiToggleCheckbox && emojiToggleCheckbox.checked;
        let updatedMessage = getMessageBody();

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

        const textarea = document.getElementById("spca-price-form-message-textarea");
        if (textarea) {
            textarea.value = updatedMessage;
        }
    }

    messageTextarea.addEventListener("focus", (e) => {
        e.target.classList.add("spca-input-focused");
    });

    messageTextarea.addEventListener("blur", (e) => {
        e.target.classList.remove("spca-input-focused");
    });

    chrome.storage.local.get(["emojiToggleEnabled"], (result) => {
        if (chrome.runtime.lastError) {
            console.log("Extension context invalidated, page reload required");
            return;
        }
        if (emojiToggleCheckbox) {
            emojiToggleCheckbox.checked = result.emojiToggleEnabled !== undefined ? result.emojiToggleEnabled : true;
            updateMessageWithEmojis();
        }
    });

    if (emojiToggleCheckbox) {
        emojiToggleCheckbox.addEventListener("change", () => {
            updateMessageWithEmojis();
            try {
                chrome.storage.local.set({ emojiToggleEnabled: emojiToggleCheckbox.checked });
            } catch (e) {
                console.log("Extension context invalidated, page reload required");
            }
        });
    }

    formContainer.appendChild(messageTextarea);
    return messageTextarea;
}

function createActionButtons(formContainer, { slackInput, messageTextarea, getSelectedShopName, selectedEmojis, currentPrice }) {
    const slackButton = document.createElement("button");
    slackButton.textContent = "An Slack senden";
    slackButton.className = "spca-btn spca-btn-slack";

    const copyButton = document.createElement("button");
    copyButton.textContent = "In Zwischenablage kopieren";
    copyButton.className = "spca-btn spca-btn-primary";

    slackButton.addEventListener("click", async () => {
        const webhookUrl = slackInput.value === "*****" ? slackInput.dataset.actualUrl : slackInput.value.trim();
        if (!webhookUrl) {
            slackButton.textContent = "Slack URL eingeben!";
            slackButton.className = "spca-btn spca-btn-danger spca-error-state";

            setTimeout(() => {
                slackButton.textContent = "An Slack senden";
                slackButton.className = "spca-btn spca-btn-slack";
            }, 3000);
            return;
        }

        const shopName = getSelectedShopName();
        const originalMessage = messageTextarea.value;
        const emojiPrefix = Array.from(selectedEmojis).join("") + (selectedEmojis.size > 0 ? " " : "");

        const slackMessage = originalMessage.replace(currentPrice, `*${currentPrice}*`).replace(/Rekordpreis/g, "*Rekordpreis*");
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
                slackButton.className = "spca-btn spca-btn-success";

                setTimeout(() => {
                    slackButton.textContent = "An Slack senden";
                    slackButton.className = "spca-btn spca-btn-slack";
                }, 2000);
            } else {
                throw new Error("Failed to send message");
            }
        } catch (err) {
            slackButton.textContent = "Fehler!";
            slackButton.className = "spca-btn spca-btn-danger spca-error-state";
            console.error("Slack error:", err);

            setTimeout(() => {
                slackButton.textContent = "An Slack senden";
                slackButton.className = "spca-btn spca-btn-slack";
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
            copyButton.className = "spca-btn spca-btn-success";

            setTimeout(() => {
                copyButton.textContent = "In Zwischenablage kopieren";
                copyButton.className = "spca-btn spca-btn-primary";
            }, 2000);
        } catch (err) {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = finalMessage;
                textArea.style.position = "fixed";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                const successful = document.execCommand("copy");
                document.body.removeChild(textArea);

                if (successful) {
                    copyButton.textContent = "Kopiert!";
                    copyButton.className = "spca-btn spca-btn-success";

                    setTimeout(() => {
                        copyButton.textContent = "In Zwischenablage kopieren";
                        copyButton.className = "spca-btn spca-btn-primary";
                    }, 2000);
                } else {
                    throw new Error("Copy command failed");
                }
            } catch (fallbackErr) {
                copyButton.textContent = "Kopieren fehlgeschlagen";
                copyButton.className = "spca-btn spca-btn-danger";

                setTimeout(() => {
                    copyButton.textContent = "In Zwischenablage kopieren";
                    copyButton.className = "spca-btn spca-btn-primary";
                }, 3000);
            }
        }
    });

    formContainer.appendChild(slackButton);
    formContainer.appendChild(copyButton);
}

function setupModalCloseTracking(priceModal) {
    const modalObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node === priceModal || (node.querySelector && (node.querySelector('[role="dialog"]') === priceModal || node.querySelector(".modal") === priceModal || node.querySelector('[data-testid*="modal"]') === priceModal))) {
                            const currentForm = document.querySelector('[data-price-form="true"]');
                            if (currentForm) {
                                currentForm.remove();
                            }
                            modalObserver.disconnect();
                        }
                    }
                });
            }
        });
    });

    modalObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    const modalCheckInterval = setInterval(() => {
        const currentPriceModal = document.querySelector('[role="dialog"]') || document.querySelector(".modal") || document.querySelector('[data-testid*="modal"]');

        if (!currentPriceModal) {
            const currentForm = document.querySelector('[data-price-form="true"]');
            if (currentForm) {
                currentForm.remove();
            }
            modalObserver.disconnect();
            clearInterval(modalCheckInterval);
        }
    }, 1000);
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
        try {
            const productData = extractProductData();

            const formContainer = createFormContainer();

            const shopSelection = createShopSelection(formContainer);
            const slackInput = createSlackInput(formContainer);

            const { emojiToggleCheckbox } = createToggleControls(formContainer);
            const finalMessageTextarea = createMessageTextarea(formContainer, productData, emojiToggleCheckbox);

            const selectedEmojis = createEmojiSelection(formContainer);

            createActionButtons(formContainer, {
                slackInput,
                messageTextarea: finalMessageTextarea,
                getSelectedShopName: shopSelection.getSelectedShopName,
                selectedEmojis,
                currentPrice: productData.currentPrice
            });

            setupFormPosition(formContainer, priceModal);
            document.body.appendChild(formContainer);

            setupModalCloseTracking(priceModal);
        } catch (error) {
            console.error("Error creating price form:", error);
        }
    }, 100);
}
