function createFilterIcon(dataAttribute, openTitle = "Offen", closeTitle = "Schließen", backgroundColor = THEME.colors.primary, borderColor = THEME.colors.white) {
    const iconBtn = document.createElement("button");
    iconBtn.setAttribute(dataAttribute, "true");
    iconBtn.title = openTitle;
    iconBtn.style = createStyleString({
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
        ...THEME.buttonStyles.base,
        fontSize: fontSize
    });

    idealoButton.addEventListener("mouseover", () => {
        idealoButton.style.cssText = createStyleString({
            ...THEME.buttonStyles.base,
            ...THEME.buttonStyles.hover,
            fontSize: fontSize
        });
    });
    idealoButton.addEventListener("mouseout", () => {
        idealoButton.style.cssText = createStyleString({
            ...THEME.buttonStyles.base,
            fontSize: fontSize
        });
    });

    titleElement.insertAdjacentElement("afterend", idealoButton);
}
