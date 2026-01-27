function createFilterIcon(dataAttribute, openTitle = "Offen", closeTitle = "Schließen", backgroundColor = THEME.colors.primary, borderColor = THEME.colors.white) {
    const iconBtn = document.createElement("button");
    iconBtn.setAttribute(dataAttribute, "true");
    iconBtn.title = openTitle;
    iconBtn.style.cssText = createStyleString({
        ...THEME.filterIcon,
        background: backgroundColor,
        border: `1px solid ${borderColor}`
    });
    iconBtn.innerHTML = `<img src="${chrome.runtime.getURL("logo.png")}" width="25" height="25" style="border-radius: 50%;">`;
    document.body.appendChild(iconBtn);

    iconBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    return iconBtn;
}

function addIdealoButton(titleElement, searchTerms, fontSize = "1rem") {
    const searchQuery = searchTerms.map(encodeURIComponent).join(" ");

    const idealoButton = document.createElement("a");
    idealoButton.innerText = "🔍 Suche auf Idealo";
    idealoButton.href = `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=${searchQuery}`;
    idealoButton.target = "_blank";
    idealoButton.style.cssText = createStyleString({
        ...THEME.idealoButton.base,
        fontSize: fontSize
    });

    idealoButton.addEventListener("mouseover", () => {
        idealoButton.style.cssText = createStyleString({
            ...THEME.idealoButton.base,
            ...THEME.idealoButton.hover,
            fontSize: fontSize
        });
    });
    idealoButton.addEventListener("mouseout", () => {
        idealoButton.style.cssText = createStyleString({
            ...THEME.idealoButton.base,
            fontSize: fontSize
        });
    });

    titleElement.insertAdjacentElement("afterend", idealoButton);
}

function createGenericFilter(config) {
    try {
        const productCards = config.getProductCards();
        const itemNames = new Set();
        const cardItemMap = new Map();

        productCards.forEach((card) => {
            const itemName = config.extractItemName(card);
            if (itemName) {
                itemNames.add(itemName);
                cardItemMap.set(card, itemName);
            }
        });

        const oldContainer = document.querySelector(`[${config.containerAttribute}="true"]`);
        if (oldContainer) oldContainer.remove();
        const oldIcon = document.querySelector(`[${config.iconAttribute}="true"]`);
        if (oldIcon) oldIcon.remove();

        chrome.storage.local.get([config.openStorageKey, config.selectionsStorageKey], (result) => {
            const savedOpen = result[config.openStorageKey] || false;
            const savedSelections = result[config.selectionsStorageKey] || [];

            const allItemNames = new Set([...itemNames, ...savedSelections]);

            const iconBtn = createFilterIcon(config.iconAttribute, "Offen", "Schließen");

            if (allItemNames.size > 0) {
                let filterContainer = document.createElement("div");
                filterContainer.setAttribute(config.containerAttribute, "true");
                filterContainer.setAttribute(`${config.containerAttribute}-panel`, "true");
                filterContainer.style = `
                    position: fixed;
                    top: 70px;
                    right: 16px;
                    z-index: 1000;
                    background: #ffffff;
                    border: 2px solid #e1e8ed;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                    font-size: 14px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    color: #2c3e50;
                    width: 300px;
                    max-height: 450px;
                    display: none;
                    flex-direction: column;
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: all 0.3s ease;
                `;

                const label = document.createElement("label");
                label.textContent = config.labelText;
                label.style = `
                    font-weight: 600;
                    margin-bottom: 16px;
                    color: #2c3e50;
                    font-size: 16px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    letter-spacing: 0.5px;
                `;
                filterContainer.appendChild(label);

                const closeBtn = document.createElement("button");
                closeBtn.textContent = "×";
                closeBtn.title = "Schließen";
                closeBtn.style = `
                    position: absolute;
                    top: 12px;
                    right: 16px;
                    background: none;
                    border: none;
                    font-size: 22px;
                    color: #95a5a6;
                    cursor: pointer;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                `;
                filterContainer.appendChild(closeBtn);

                closeBtn.addEventListener("mouseenter", () => {
                    closeBtn.style.backgroundColor = "#fee2e2";
                    closeBtn.style.color = "#dc2626";
                    closeBtn.style.transform = "scale(1.1)";
                });
                closeBtn.addEventListener("mouseleave", () => {
                    closeBtn.style.backgroundColor = "transparent";
                    closeBtn.style.color = "#95a5a6";
                    closeBtn.style.transform = "scale(1)";
                });

                const checkboxList = document.createElement("div");
                checkboxList.style = `
                    overflow-y: auto;
                    max-height: 320px;
                    width: 100%;
                    padding-right: 8px;
                `;

                const sortedItemNames = Array.from(allItemNames).sort((a, b) => {
                    const aSelected = savedSelections.includes(a);
                    const bSelected = savedSelections.includes(b);
                    if (aSelected && !bSelected) return -1;
                    if (!aSelected && bSelected) return 1;
                    return a.localeCompare(b);
                });

                sortedItemNames.forEach((name) => {
                    const resultCount = productCards.filter((card) => config.matchesCard(card, name)).length;

                    const wrapper = document.createElement("div");
                    wrapper.style = `
                        display: flex;
                        align-items: center;
                        margin-bottom: 10px;
                        padding: 8px 12px;
                        border-radius: 8px;
                        transition: all 0.2s ease;
                        cursor: pointer;
                    `;

                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.value = name;
                    checkbox.id = `${config.containerAttribute}-${name.replace(/\s+/g, "-")}`;
                    checkbox.checked = savedSelections.includes(name);
                    checkbox.style = `
                        width: 18px;
                        height: 18px;
                        cursor: pointer;
                        accent-color: #3498db;
                    `;

                    const checkboxLabel = document.createElement("label");
                    checkboxLabel.textContent = `${name} (${resultCount})`;
                    checkboxLabel.setAttribute("for", checkbox.id);
                    checkboxLabel.style = `
                        margin-left: 12px;
                        color: #2c3e50;
                        cursor: pointer;
                        flex: 1;
                        font-size: 14px;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        font-weight: 500;
                    `;

                    if (savedSelections.includes(name)) {
                        wrapper.style.fontWeight = "600";
                        wrapper.style.backgroundColor = "#e3f2fd";
                        wrapper.style.borderRadius = "8px";
                        wrapper.style.padding = "10px 12px";
                        wrapper.style.border = "1px solid #3498db";
                    }

                    checkbox.addEventListener("change", () => {
                        if (checkbox.checked) {
                            wrapper.style.fontWeight = "600";
                            wrapper.style.backgroundColor = "#e3f2fd";
                            wrapper.style.borderRadius = "8px";
                            wrapper.style.padding = "10px 12px";
                            wrapper.style.border = "1px solid #3498db";
                        } else {
                            wrapper.style.fontWeight = "500";
                            wrapper.style.backgroundColor = "transparent";
                            wrapper.style.borderRadius = "8px";
                            wrapper.style.padding = "8px 12px";
                            wrapper.style.border = "none";
                        }
                    });

                    wrapper.appendChild(checkbox);
                    wrapper.appendChild(checkboxLabel);

                    wrapper.addEventListener("mouseenter", () => {
                        if (!checkbox.checked) {
                            wrapper.style.backgroundColor = "#f0f9ff";
                            wrapper.style.border = "1px solid #bfdbfe";
                            wrapper.style.transform = "translateX(2px)";
                            wrapper.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.15)";
                        }
                    });
                    wrapper.addEventListener("mouseleave", () => {
                        if (!checkbox.checked) {
                            wrapper.style.backgroundColor = "transparent";
                            wrapper.style.border = "none";
                            wrapper.style.transform = "translateX(0)";
                            wrapper.style.boxShadow = "none";
                        }
                    });

                    checkboxList.appendChild(wrapper);
                });
                filterContainer.appendChild(checkboxList);
                document.body.appendChild(filterContainer);

                function updateFilter() {
                    const checked = Array.from(checkboxList.querySelectorAll('input[type="checkbox"]:checked')).map((cb) => cb.value);
                    const storageUpdate = {};
                    storageUpdate[config.selectionsStorageKey] = checked;
                    chrome.storage.local.set(storageUpdate);

                    productCards.forEach((card) => {
                        if (checked.length === 0 || checked.includes(cardItemMap.get(card))) {
                            card.style.display = "";
                        } else {
                            card.style.display = "none";
                        }
                    });
                }
                checkboxList.addEventListener("change", updateFilter);
                updateFilter();

                if (savedOpen) {
                    filterContainer.style.display = "flex";
                    setTimeout(() => {
                        filterContainer.style.opacity = "1";
                        filterContainer.style.transform = "translateY(0)";
                    }, 10);
                    iconBtn.title = "Schließen";
                }

                iconBtn.addEventListener("click", () => {
                    const isVisible = filterContainer.style.display === "flex";
                    const storageUpdate = {};
                    if (isVisible) {
                        filterContainer.style.opacity = "0";
                        filterContainer.style.transform = "translateY(-10px)";
                        setTimeout(() => {
                            filterContainer.style.display = "none";
                        }, 300);
                        iconBtn.title = "Offen";
                        storageUpdate[config.openStorageKey] = false;
                    } else {
                        filterContainer.style.display = "flex";
                        setTimeout(() => {
                            filterContainer.style.opacity = "1";
                            filterContainer.style.transform = "translateY(0)";
                        }, 10);
                        iconBtn.title = "Schließen";
                        storageUpdate[config.openStorageKey] = true;
                    }
                    chrome.storage.local.set(storageUpdate);
                });

                closeBtn.addEventListener("click", () => {
                    filterContainer.style.opacity = "0";
                    filterContainer.style.transform = "translateY(-10px)";
                    setTimeout(() => {
                        filterContainer.style.display = "none";
                    }, 300);
                    iconBtn.title = "Offen";
                    const storageUpdate = {};
                    storageUpdate[config.openStorageKey] = false;
                    chrome.storage.local.set(storageUpdate);
                });

                document.addEventListener("mousedown", (e) => {
                    if (!filterContainer.contains(e.target) && !iconBtn.contains(e.target)) {
                        filterContainer.style.opacity = "0";
                        filterContainer.style.transform = "translateY(-10px)";
                        setTimeout(() => {
                            filterContainer.style.display = "none";
                        }, 300);
                        iconBtn.title = "Offen";
                        const storageUpdate = {};
                        storageUpdate[config.openStorageKey] = false;
                        chrome.storage.local.set(storageUpdate);
                    }
                });
            }
        });
    } catch (error) {
        console.error("Filter creation error:", error);
    }
}
