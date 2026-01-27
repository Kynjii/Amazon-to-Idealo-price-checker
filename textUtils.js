function cleanSearchQuery(text) {
    if (!text) return "";

    return text
        .replace(/[^\w\säöüÄÖÜß\-\.]/g, " ")
        .replace(/\b(amazon|bestseller|choice|renewed|pack|set|bundle|kit|piece|pcs|pc|cm|mm|inch|inches|"|kg|g|ml|l)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .slice(0, 8)
        .join(" ");
}

function extractArtikelnummer() {
    const tableRows = document.querySelectorAll("#productDetails_techSpec_section_1 tr");

    for (const row of tableRows) {
        const th = row.querySelector("th");
        const td = row.querySelector("td");

        if (th && td && th.textContent.trim() === "Artikelnummer") {
            return td.textContent.trim();
        }
    }
    return null;
}

function extractAmazonIdentifier() {
    const match = window.location.href.match(/\/dp\/([A-Z0-9]+)/);
    return match ? match[1] : null;
}
