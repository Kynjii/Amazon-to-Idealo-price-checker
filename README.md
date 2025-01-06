# Amazon to Idealo Price Checker

## Product Overview
The **Amazon to Idealo Price Checker** is a browser extension designed to simplify the process of comparing Amazon product prices with Idealo, a leading German price comparison platform. This extension was created to make deal discovery and comparison faster and more accurate by automating repetitive and time-consuming tasks.

## Problem Statement
This extension addresses a real-world problem shared by my wife, who works as an affiliate manager at a large media company in Germany. Her workflow involves identifying deals on Amazon and then verifying whether Amazon offers the best price by manually searching for the same product on Idealo. This process:

- Involves multiple steps, such as copying the product title and pasting it into Idealo's search bar or relying on Google searches.
- Often leads to inaccurate search results due to missing identifiers or partial information.
- Takes up valuable time that could be better spent evaluating deals or optimizing affiliate strategies.

## Approach
The Amazon to Idealo Price Checker was built to:

- Speed up deal discovery by automating the search process.
- Minimize clicks by directly integrating Idealo searches into the Amazon product page.
- Improve search accuracy by including unique identifiers such as:
  - **ASIN** (Amazon Standard Identification Number).
  - **Artikelnummer** (Product number from Amazon).
  - The full product title.
- Highlight results on Idealo that:
  - Are the best match to the product title.
  - Offer the best price compared to the Amazon listing.

The extension achieves these goals through a clean UI and functionality to:
- Automatically extract product details from Amazon.
- Perform a structured search on Idealo.
- Provide visual highlights for the best matches and deals on Idealo.

## Technology Stack
- **Languages and Frameworks**: JavaScript, HTML, and CSS.
- **Browser APIs**: Chrome Extension APIs for DOM manipulation and local storage.
- **Algorithms**:
  - Cosine similarity for matching product titles.
  - Parsing and formatting price data for accurate comparison.
- **Assistance**: Development assistance from ChatGPT, helping refine technical implementation and resolve edge cases.

## Dependencies
The following dependencies and tools are required for this extension:

- **Chrome Extension Manifest v3**: To define permissions, content scripts, and background processes.
- **Browser Storage API**: To store and retrieve Amazon price details locally.
- **DOM Manipulation**: For dynamically injecting buttons and highlights into Amazon and Idealo pages.

## How It Works
1. **On Amazon Pages**:
   - The extension extracts product details such as the title, price, ASIN, and Artikelnummer.
   - A "Search on Idealo" button is added to the product page, automatically including relevant identifiers in the query.

2. **On Idealo Pages**:
   - The extension performs a structured search using Amazon product details.
   - Highlights the closest match based on cosine similarity of product titles.
   - Highlights the best deal by comparing prices and emphasizing the most favorable result.
   - Provides a navigation bar for quick actions, such as navigating to the best deal or toggling highlights.

## Installation and Usage
1. Clone or download the repository.
2. Load the extension in developer mode on your Chrome browser via the Extensions menu.
3. Use the extension on Amazon and Idealo pages to simplify price comparison workflows.

