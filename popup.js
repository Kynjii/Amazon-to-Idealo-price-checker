document.addEventListener("DOMContentLoaded", () => {
    const versionEl = document.querySelector(".popup-version");
    const themeBtns = document.querySelectorAll(".theme-btn");
    const slackInput = document.getElementById("slackUrl");
    const saveSlackBtn = document.getElementById("saveSlackBtn");
    const slackStatus = document.getElementById("slackStatus");
    const changelogBtn = document.getElementById("showChangelogBtn");

    const manifest = chrome.runtime.getManifest();
    versionEl.textContent = `v${manifest.version}`;

    chrome.storage.local.get(["selectedTheme", "slackWebhookUrl"], (result) => {
        const currentTheme = result.selectedTheme || "light";

        // Apply theme to popup
        if (currentTheme === "dark") {
            document.body.classList.add("dark");
        }

        themeBtns.forEach((btn) => {
            if (btn.dataset.theme === currentTheme) {
                btn.classList.add("active");
            }
        });

        if (result.slackWebhookUrl) {
            slackInput.value = result.slackWebhookUrl;
        }
    });

    themeBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const theme = btn.dataset.theme;

            // Update popup theme
            document.body.classList.remove("dark");
            if (theme === "dark") {
                document.body.classList.add("dark");
            }

            themeBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            chrome.storage.local.set({ selectedTheme: theme });

            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    chrome.tabs.sendMessage(tab.id, { action: "applyTheme", theme: theme }).catch(() => {});
                });
            });
        });
    });

    saveSlackBtn.addEventListener("click", () => {
        const url = slackInput.value.trim();

        if (!url) {
            chrome.storage.local.remove("slackWebhookUrl");
            slackStatus.textContent = "URL entfernt";
            slackStatus.className = "popup-hint success";
            setTimeout(() => {
                slackStatus.textContent = "";
            }, 2000);
            return;
        }

        if (!url.startsWith("https://hooks.slack.com/")) {
            slackStatus.textContent = "Ungültige Slack Webhook URL";
            slackStatus.className = "popup-hint error";
            return;
        }

        chrome.storage.local.set({ slackWebhookUrl: url }, () => {
            slackStatus.textContent = "Gespeichert";
            slackStatus.className = "popup-hint success";
            setTimeout(() => {
                slackStatus.textContent = "";
            }, 2000);
        });
    });

    changelogBtn.addEventListener("click", async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab) {
            chrome.tabs.sendMessage(tab.id, { action: "showChangelog" }).catch(() => {
                slackStatus.textContent = "Öffne eine unterstützte Seite";
                slackStatus.className = "popup-hint";
                setTimeout(() => {
                    slackStatus.textContent = "";
                }, 2000);
            });
            window.close();
        }
    });
});
