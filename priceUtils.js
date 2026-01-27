function extractPrice(priceText) {
    const priceMatch = priceText.match(/\d+[.,]?\d*/);
    return priceMatch ? parseFloat(priceMatch[0].replace(",", ".")) : null;
}
