function refreshMyDealzMerchantFilter() {
    try {
        const productCards = Array.from(document.querySelectorAll('article[data-t="thread"]'));
        const merchantNames = new Set();
        const cardMerchantMap = new Map();

        productCards.forEach((card) => {
            const merchantLink = card.querySelector('a[data-t="merchantLink"]');
            if (merchantLink) {
                const merchantName = merchantLink.textContent.trim();
                merchantNames.add(merchantName);
                cardMerchantMap.set(card, merchantName);
            }
        });

        const oldContainer = document.querySelector('[data-mydealz-merchant-filter="true"]');
        if (oldContainer) oldContainer.remove();
        const oldIcon = document.querySelector('[data-mydealz-merchant-filter-icon="true"]');
        if (oldIcon) oldIcon.remove();

        chrome.storage.local.get(["mydealzFilterOpen", "mydealzSelectedMerchants"], (result) => {
            const savedOpen = result.mydealzFilterOpen || false;
            const savedSelections = result.mydealzSelectedMerchants || [];

            const allMerchantNames = new Set([...merchantNames, ...savedSelections]);

            const iconBtn = createFilterIcon("data-mydealz-merchant-filter-icon", "Offen", "Schließen");

            if (allMerchantNames.size > 0) {
                let filterContainer = document.createElement("div");
                filterContainer.setAttribute("data-mydealz-merchant-filter", "true");
                filterContainer.setAttribute("data-mydealz-merchant-filter-panel", "true");
                filterContainer.style = `
                    position: fixed;
                    top: 60px;
                    right: 16px;
                    z-index: 1000;
                    background: #fff;
                    border: 1px solid #fff;
                    border-radius: 8px;
                    padding: 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    font-size: 14px;
                    color: #333;
                    width: 280px;
                    max-height: 400px;
                    display: none;
                    flex-direction: column;
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: opacity 0.3s ease, transform 0.3s ease;
                `;

                const label = document.createElement("label");
                label.textContent = "Shop Filter";
                label.style = `
                    font-weight: bold;
                    margin-bottom: 12px;
                    color: #333;
                    font-size: 16px;
                `;
                filterContainer.appendChild(label);

                const closeBtn = document.createElement("button");
                closeBtn.textContent = "×";
                closeBtn.title = "Schließen";
                closeBtn.style = `
                    position: absolute;
                    top: 8px;
                    right: 12px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    color: #666;
                    cursor: pointer;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
                filterContainer.appendChild(closeBtn);

                const checkboxList = document.createElement("div");
                checkboxList.style = `
                    overflow-y: auto;
                    max-height: 300px;
                    width: 100%;
                `;

                const sortedMerchantNames = Array.from(allMerchantNames).sort((a, b) => {
                    const aSelected = savedSelections.includes(a);
                    const bSelected = savedSelections.includes(b);

                    if (aSelected && !bSelected) return -1;
                    if (!aSelected && bSelected) return 1;
                    return a.localeCompare(b);
                });

                sortedMerchantNames.forEach((name) => {
                    const resultCount = Array.from(productCards).filter((card) => {
                        const merchantLink = card.querySelector('a[data-t="merchantLink"]');
                        return merchantLink && merchantLink.textContent.trim() === name;
                    }).length;

                    const wrapper = document.createElement("div");
                    wrapper.style = `
                        display: flex;
                        align-items: center;
                        margin-bottom: 8px;
                        padding: 4px 0;
                    `;

                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.value = name;
                    checkbox.id = `mydealz-merchant-filter-${name.replace(/\s+/g, "-")}`;
                    checkbox.checked = savedSelections.includes(name);

                    const checkboxLabel = document.createElement("label");
                    checkboxLabel.textContent = `${name} (${resultCount})`;
                    checkboxLabel.setAttribute("for", checkbox.id);
                    checkboxLabel.style = `
                        margin-left: 8px;
                        color: #333;
                        cursor: pointer;
                        flex: 1;
                    `;

                    if (savedSelections.includes(name)) {
                        wrapper.style.fontWeight = "bold";
                        wrapper.style.backgroundColor = "#f0f8ff";
                        wrapper.style.borderRadius = "4px";
                        wrapper.style.padding = "6px 4px";
                    }

                    wrapper.appendChild(checkbox);
                    wrapper.appendChild(checkboxLabel);
                    checkboxList.appendChild(wrapper);
                });
                filterContainer.appendChild(checkboxList);
                document.body.appendChild(filterContainer);

                function updateFilter() {
                    const checked = Array.from(checkboxList.querySelectorAll('input[type="checkbox"]:checked')).map((cb) => cb.value);
                    chrome.storage.local.set({ mydealzSelectedMerchants: checked });

                    productCards.forEach((card) => {
                        if (checked.length === 0 || checked.includes(cardMerchantMap.get(card))) {
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
                    if (isVisible) {
                        filterContainer.style.opacity = "0";
                        filterContainer.style.transform = "translateY(-10px)";
                        setTimeout(() => {
                            filterContainer.style.display = "none";
                        }, 300);
                        iconBtn.title = "Offen";
                        chrome.storage.local.set({ mydealzFilterOpen: false });
                    } else {
                        filterContainer.style.display = "flex";
                        setTimeout(() => {
                            filterContainer.style.opacity = "1";
                            filterContainer.style.transform = "translateY(0)";
                        }, 10);
                        iconBtn.title = "Schließen";
                        chrome.storage.local.set({ mydealzFilterOpen: true });
                    }
                });

                closeBtn.addEventListener("click", () => {
                    filterContainer.style.opacity = "0";
                    filterContainer.style.transform = "translateY(-10px)";
                    setTimeout(() => {
                        filterContainer.style.display = "none";
                    }, 300);
                    iconBtn.title = "Offen";
                    chrome.storage.local.set({ mydealzFilterOpen: false });
                });

                document.addEventListener("mousedown", (e) => {
                    if (filterContainer.style.display === "flex" && !filterContainer.contains(e.target) && !iconBtn.contains(e.target)) {
                        const isPaginationClick = e.target.closest("a[href]") || e.target.closest('[class*="pagination"]') || e.target.closest('[class*="nav"]') || e.target.closest("button");

                        if (!isPaginationClick) {
                            filterContainer.style.opacity = "0";
                            filterContainer.style.transform = "translateY(-10px)";
                            setTimeout(() => {
                                filterContainer.style.display = "none";
                            }, 300);
                            iconBtn.title = "Offen";
                            chrome.storage.local.set({ mydealzFilterOpen: false });
                        } else {
                            console.log("Mydealz: Ignoring pagination/navigation click");
                        }
                    }
                });
            }
        });
    } catch (error) {
        console.error("Mydealz filter error:", error);
    }
}
