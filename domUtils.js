function createFilterIcon(dataAttribute, openTitle = "Offen", closeTitle = "Schließen") {
    const iconBtn = document.createElement("button");
    iconBtn.setAttribute(dataAttribute, "true");
    iconBtn.setAttribute("data-extension-ui", "true");
    iconBtn.title = openTitle;
    iconBtn.classList.add("spca-filter-icon");
    iconBtn.innerHTML = `<img src="${chrome.runtime.getURL("assets/logo.png")}" alt="">`;
    document.body.appendChild(iconBtn);

    iconBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    return iconBtn;
}

function addIdealoButton(titleElement, searchTerms, fontSize = "1rem") {
    const searchQuery = searchTerms.map(encodeURIComponent).join(" ");

    const container = document.createElement("div");
    container.classList.add("spca-idealo-search");
    container.setAttribute("data-extension-ui", "true");

    const idealoButton = document.createElement("a");
    idealoButton.classList.add("spca-idealo-search-button");
    idealoButton.innerHTML = `<img src="${chrome.runtime.getURL("assets/search.png")}" alt=""> Suche auf Idealo`;
    idealoButton.href = `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=${searchQuery}`;
    idealoButton.target = "_blank";

    container.appendChild(idealoButton);
    document.body.appendChild(container);
}

function createThemeSelector() {
    const themeSection = document.createElement("div");
    themeSection.className = "spca-theme-section";

    const themeControls = document.createElement("div");
    themeControls.className = "spca-filter-controls";

    const changelogBtn = document.createElement("button");
    changelogBtn.className = "spca-btn spca-btn-icon";
    changelogBtn.title = "Changelog";

    const updateChangelogIcon = (theme) => {
        const isDark = theme === "dark";
        const iconFile = isDark ? "assets/changelog_white.png" : "assets/changelog.png";
        changelogBtn.innerHTML = `<img src="${chrome.runtime.getURL(iconFile)}" width="16" height="16" alt="Changelog">`;
    };

    const themeBtn = createThemeButton(updateChangelogIcon);

    chrome.storage.local.get(["selectedTheme", "lastChangelogViewed"], (result) => {
        const theme = result.selectedTheme || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        updateChangelogIcon(theme);
        if (result.lastChangelogViewed !== window.EXTENSION_VERSION) {
            changelogBtn.classList.add("spca-changelog-new");
            changelogBtn.title = "Neue Version verfügbar!";
        }
    });

    changelogBtn.addEventListener("click", () => {
        if (typeof showChangelog === "function") {
            changelogBtn.classList.remove("spca-changelog-new");
            changelogBtn.title = "Changelog";
            showChangelog();
        }
    });

    themeControls.appendChild(themeBtn);
    themeControls.appendChild(changelogBtn);
    themeSection.appendChild(themeControls);

    return themeSection;
}

function createThemeButton(onThemeChange) {
    const themeBtn = document.createElement("button");
    themeBtn.className = "spca-btn spca-btn-icon";
    themeBtn.title = "Modus";

    const updateIcon = (theme) => {
        const isDark = theme === "dark";
        const iconFile = isDark ? "assets/darkmode_white.png" : "assets/lightmode.png";
        themeBtn.innerHTML = `<img src="${chrome.runtime.getURL(iconFile)}" width="16" height="16" alt="${isDark ? "Dark" : "Light"} mode">`;
    };

    chrome.storage.local.get(["selectedTheme"], (result) => {
        const theme = result.selectedTheme || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        updateIcon(theme);
    });

    themeBtn.addEventListener("click", () => {
        chrome.storage.local.get(["selectedTheme"], (result) => {
            const currentTheme = result.selectedTheme || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
            const themes = ["light", "dark"];
            const currentIndex = themes.indexOf(currentTheme);
            const nextTheme = themes[(currentIndex + 1) % themes.length];

            chrome.storage.local.set({ selectedTheme: nextTheme });
            updateIcon(nextTheme);

            if (typeof onThemeChange === "function") {
                onThemeChange(nextTheme);
            }

            const containers = document.querySelectorAll(".spca-form-container, .spca-filter-container, .spca-changelog-container");
            containers.forEach((container) => {
                container.classList.remove("spca-theme-light", "spca-theme-dark");
                container.classList.add(`spca-theme-${nextTheme}`);
            });

            if (typeof applyTheme === "function") {
                applyTheme(nextTheme);
            }
        });
    });

    return themeBtn;
}

function updateThemeButtonText(button, theme) {
    const isDark = theme === "dark";
    const iconFile = isDark ? "assets/darkmode_white.png" : "assets/lightmode.png";
    button.innerHTML = `<img src="${chrome.runtime.getURL(iconFile)}" width="16" height="16" alt="${isDark ? "Dark" : "Light"} mode">`;
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
                filterContainer.className = "spca-filter-container spca-filter-positioned";
                filterContainer.style.display = "none";

                chrome.storage.local.get(["selectedTheme"], (result) => {
                    const theme = result.selectedTheme || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
                    filterContainer.classList.remove("spca-theme-light", "spca-theme-dark");
                    filterContainer.classList.add(`spca-theme-${theme}`);
                });

                const header = document.createElement("div");
                header.className = "spca-filter-header";

                const titleContainer = document.createElement("div");
                titleContainer.className = "spca-filter-title-container";

                const label = document.createElement("h3");
                label.textContent = config.labelText;
                label.className = "spca-filter-title spca-title-primary";
                titleContainer.appendChild(label);

                const countDisplay = document.createElement("span");
                countDisplay.className = "spca-filter-count";
                countDisplay.textContent = allItemNames.size;
                titleContainer.appendChild(countDisplay);

                header.appendChild(titleContainer);

                const main = document.createElement("div");
                main.className = "spca-filter-main";

                const checkboxList = document.createElement("div");
                checkboxList.className = "spca-filter-list";

                main.appendChild(checkboxList);

                const footer = document.createElement("div");
                footer.className = "spca-filter-footer";

                const themeSection = createThemeSelector();
                themeSection.className = "spca-theme-section";
                footer.appendChild(themeSection);

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
                    wrapper.className = "spca-filter-item";

                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.value = name;
                    checkbox.id = `${config.containerAttribute}-${name.replace(/\s+/g, "-")}`;
                    checkbox.checked = savedSelections.includes(name);
                    checkbox.className = "spca-filter-checkbox";

                    const checkboxLabel = document.createElement("label");
                    checkboxLabel.textContent = `${name} (${resultCount})`;
                    checkboxLabel.setAttribute("for", checkbox.id);
                    checkboxLabel.className = "spca-filter-label";

                    wrapper.appendChild(checkbox);
                    wrapper.appendChild(checkboxLabel);

                    wrapper.addEventListener("click", (e) => {
                        e.preventDefault();
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
                    });

                    checkboxList.appendChild(wrapper);
                });

                const closeBtn = document.createElement("button");
                closeBtn.textContent = "×";
                closeBtn.title = "Schließen";
                closeBtn.className = "spca-btn spca-btn-secondary spca-filter-close-btn";

                filterContainer.appendChild(closeBtn);
                filterContainer.appendChild(header);
                filterContainer.appendChild(main);
                filterContainer.appendChild(footer);

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
                    const changelogContainer = document.querySelector(".spca-changelog-container");
                    const isInsideChangelog = changelogContainer && changelogContainer.contains(e.target);

                    if (!filterContainer.contains(e.target) && !iconBtn.contains(e.target) && !isInsideChangelog) {
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
