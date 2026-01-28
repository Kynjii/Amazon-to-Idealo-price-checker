const EXTENSION_VERSION = "1.16.0";
window.EXTENSION_VERSION = EXTENSION_VERSION;

function showChangelog() {
    const changelogData = {
        currentVersion: EXTENSION_VERSION,
        entries: [
            {
                version: "1.16.0",
                date: "2026-01-28",
                changes: [
                    { type: "new", text: "Keepa-Button für Amazon Preisverlauf auf Idealo-Suchergebnissen" },
                    { type: "new", text: "Externe Shop-Links auf Idealo werden jetzt markiert" },
                    { type: "new", text: "Neue kompakte Produktvergleichs-Karte mit aufklappbaren Details" },
                    { type: "improve", text: "Gleiche Preise werden jetzt korrekt angezeigt statt als 'teurer'" },
                    { type: "improve", text: "Einheitliches Brand-Styling für alle UI-Komponenten" },
                    { type: "improve", text: "Genauere Produktvergleiche" }
                ]
            },
            {
                version: "1.15.0",
                date: "2026-01-27",
                changes: [
                    { type: "new", text: "Erweiterung umbenannt zu 'Smart Price Comparison Assistant'" },
                    { type: "new", text: "Design-Wechsel - Helles oder Dunkles Design (erkennt automatisch deine Systemeinstellung beim ersten Start)" },
                    { type: "new", text: "Changelog-Anzeige - sieh was bei jedem Update neu ist" },
                    { type: "improve", text: "Komplett überarbeitete Oberfläche mit modernem, poliertem Design" },
                    { type: "improve", text: "Schnelleres Laden durch optimierte modulare Architektur" },
                    { type: "fix", text: "Erweiterungs-Styling beeinflusst nicht mehr das Aussehen der Webseite" }
                ]
            },
            {
                version: "1.14.1",
                date: "2025-12-15",
                changes: [
                    { type: "new", text: "Deine Emoji-Auswahl wird jetzt zwischen Sitzungen gespeichert" },
                    { type: "improve", text: "Einheitliche Filter-Komponente für schnelleres, zuverlässigeres Filtern" },
                    { type: "improve", text: "Modal-Design-Verbesserungen mit einheitlichen Schriftarten" }
                ]
            },
            {
                version: "1.14.0",
                date: "2025-11-20",
                changes: [
                    { type: "new", text: "Verbesserte Shop-Auswahl im Preis-Formular" },
                    { type: "improve", text: "Aktueller Preis wird jetzt in Slack-Nachrichten hervorgehoben" },
                    { type: "improve", text: "Kleinere Erweiterungsgröße - externe Abhängigkeiten entfernt" }
                ]
            },
            {
                version: "1.4.0",
                date: "2025-10-08",
                changes: [
                    { type: "new", text: "Funktioniert jetzt auf Breuninger-Produktseiten" },
                    { type: "new", text: "MyDealz-Filter funktioniert jetzt auf allen Seiten, nicht nur bei Deals" },
                    { type: "improve", text: "Flüssigere Button-Hover-Effekte" },
                    { type: "improve", text: "Genauere Idealo-Suchergebnisse" }
                ]
            },
            {
                version: "1.3.0",
                date: "2025-09-12",
                changes: [
                    { type: "new", text: "Wähle deinen bevorzugten Shop im Preis-Chart-Formular" },
                    { type: "new", text: "Füge Emojis zu deinen Slack-Nachrichten hinzu" },
                    { type: "new", text: "Sende Preis-Charts direkt an Slack" },
                    { type: "improve", text: "Oberfläche jetzt vollständig auf Deutsch" },
                    { type: "fix", text: "Sauberere Slack-Nachrichten-Formatierung" }
                ]
            },
            {
                version: "1.2.0",
                date: "2025-08-15",
                changes: [
                    { type: "new", text: "Filter für beste Deals auf Idealo" },
                    { type: "new", text: "Filter für Händler auf MyDealz" },
                    { type: "new", text: "Preisverlauf-Prozente auf Idealo anzeigen" },
                    { type: "improve", text: "Bessere Navigation durch Deal-Seiten" }
                ]
            },
            {
                version: "1.1.0",
                date: "2025-07-20",
                changes: [
                    { type: "new", text: "Genauere Produktzuordnung durch Artikelnummern" },
                    { type: "improve", text: "Bessere Preisvergleichs-Genauigkeit" },
                    { type: "fix", text: "Verbessertes Button-Aussehen und -Verhalten" }
                ]
            }
        ]
    };

    const existingChangelog = document.querySelector(".spca-changelog-container");
    if (existingChangelog) {
        return;
    }

    const changelogContainer = document.createElement("div");
    changelogContainer.className = "spca-changelog-container";

    chrome.storage.local.get(["selectedTheme"], (result) => {
        const theme = result.selectedTheme || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        changelogContainer.classList.add(`spca-theme-${theme}`);
    });

    const header = document.createElement("div");
    header.className = "spca-changelog-header";

    const headerTop = document.createElement("div");
    headerTop.className = "spca-changelog-header-top";

    const extensionName = document.createElement("div");
    extensionName.textContent = "Smart Price Comparison Assistant";
    extensionName.className = "spca-changelog-extension-name";

    const titleRow = document.createElement("div");
    titleRow.className = "spca-changelog-title-row";

    const title = document.createElement("h2");
    title.className = "spca-changelog-title spca-title-primary";
    title.textContent = "Was ist neu";

    const version = document.createElement("span");
    version.className = "spca-changelog-version";
    version.textContent = `v${changelogData.currentVersion}`;

    const closeBtn = document.createElement("button");
    closeBtn.className = "spca-btn spca-btn-secondary spca-changelog-close-btn";
    closeBtn.textContent = "×";

    headerTop.appendChild(extensionName);
    headerTop.appendChild(closeBtn);
    titleRow.appendChild(title);
    titleRow.appendChild(version);

    header.appendChild(headerTop);
    header.appendChild(titleRow);

    const content = document.createElement("div");
    content.className = "spca-changelog-content";

    changelogData.entries.forEach((entry) => {
        const entryDiv = document.createElement("div");
        entryDiv.className = "spca-changelog-entry";

        const entryVersion = document.createElement("h3");
        entryVersion.className = "spca-changelog-entry-version";
        entryVersion.textContent = `Version ${entry.version}`;

        const entryDate = document.createElement("div");
        entryDate.className = "spca-changelog-entry-date";
        entryDate.textContent = new Date(entry.date).toLocaleDateString("de-DE", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        const changesList = document.createElement("ul");
        changesList.className = "spca-changelog-entry-changes";

        entry.changes.forEach((change) => {
            const changeItem = document.createElement("li");
            changeItem.className = `spca-changelog-entry-change spca-changelog-${change.type}`;
            changeItem.textContent = change.text;
            changesList.appendChild(changeItem);
        });

        entryDiv.appendChild(entryVersion);
        entryDiv.appendChild(entryDate);
        entryDiv.appendChild(changesList);
        content.appendChild(entryDiv);
    });

    changelogContainer.appendChild(header);
    changelogContainer.appendChild(content);

    const footer = document.createElement("div");
    footer.className = "spca-changelog-footer";
    footer.textContent = "Entwickelt von Dean Burrows";
    changelogContainer.appendChild(footer);

    document.body.appendChild(changelogContainer);

    requestAnimationFrame(() => {
        changelogContainer.style.display = "flex";
    });

    closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        changelogContainer.remove();
    });

    changelogContainer.addEventListener("click", (e) => {
        e.stopPropagation();
        if (e.target === changelogContainer) {
            changelogContainer.remove();
        }
    });

    chrome.storage.local.set({
        lastChangelogViewed: changelogData.currentVersion,
        changelogViewedDate: new Date().toISOString()
    });
}

function checkAndShowChangelogIfNeeded() {
    const currentVersion = EXTENSION_VERSION;

    chrome.storage.local.get(["lastChangelogViewed"], (result) => {
        if (result.lastChangelogViewed !== currentVersion) {
            setTimeout(() => {
                showChangelog();
            }, 2000);
        }
    });
}

if (typeof window !== "undefined") {
    window.spca = window.spca || {};
    window.spca.showChangelog = showChangelog;
    window.spca.checkChangelog = checkAndShowChangelogIfNeeded;
}
