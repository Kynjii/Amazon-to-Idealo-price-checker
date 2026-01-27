# Smart Price Comparison Assistant

## Product Overview

The **Smart Price Comparison Assistant** is a comprehensive browser extension designed to streamline deal discovery and price comparison workflows. Built for affiliate managers and deal hunters, it automates the process of comparing prices across Amazon, Idealo, Breuninger, and MyDealz platforms, while providing advanced filtering, price analysis, and direct Slack integration for sending pre-written messages.

## Problem Statement

This extension addresses real-world challenges faced by affiliate managers and deal hunters who need to:

-   **Quickly compare prices** across Amazon and Idealo without manual copy-pasting
-   **Filter through large volumes of deals** efficiently on mydealz and Idealo
-   **Analyze price history** and identify record-low prices on Idealo
-   **Share deal information** with teams via Slack without manual formatting
-   **Maintain workflow continuity** across different platforms and page refreshes

The manual process previously involved:

-   Multiple browser tabs and repetitive searches
-   Time-consuming filtering through hundreds of deals
-   Manual formatting of deal information for team sharing
-   Lost context when switching between different time periods or filters
-   Inaccurate search results due to missing product identifiers

## Key Features

### 1. Smart Product Comparison

-   **Automated search** from Amazon to Idealo with ASIN, product number, and title
-   **Cosine similarity matching** to identify the most relevant products
-   **Visual price comparison** with color-coded annotations
-   **Best match and best deal highlighting** for quick decision making

### 2. Advanced Filtering System

-   **mydealz merchant filtering** with collapsible icon-based interface
-   **Idealo Best-Deal provider filtering** for targeted deal discovery
-   **Persistent filter states** that remember selections across page refreshes
-   **Real-time result counting** and visual indicators for active filters

### 3. Price History Analysis

-   **Interactive price chart integration** with percentage change calculations
-   **Historical price tracking** across different time periods (1 month to 1 year)
-   **Price reduction detection** with automatic percentage calculations
-   **Record price identification** for optimal deal timing

### 4. Automated Deal Posting

-   **Direct Slack integration** with webhook support for automated deal notifications
-   **Formatted deal messages** with product details, prices, and links
-   **Clipboard functionality** for quick copy-paste workflows
-   **Local webhook storage** with masked URL display for privacy

### 5. Responsive User Interface

-   **Modal-integrated controls** that appear contextually within Idealo price charts
-   **Intelligent form positioning** that adapts to different screen sizes
-   **State persistence** across time period changes and page interactions
-   **Toggle functionality** for streamlined user interactions

## Technology Stack

-   **Frontend**: JavaScript (ES6+), HTML5, CSS3 with responsive design principles
-   **Browser APIs**:
    -   Chrome Extension Manifest v3
    -   Chrome Storage API for persistent data
    -   DOM Manipulation and MutationObserver for dynamic content
    -   Clipboard API with fallback support
-   **Algorithms**:
    -   Cosine similarity for product title matching
    -   Price parsing and comparison algorithms
    -   Percentage calculation for price history analysis
-   **Integration**:
    -   Slack Webhooks with CORS-compliant form-encoded requests
    -   Real-time DOM monitoring with throttled observers
-   **Architecture**: Content script with modular function design and event-driven interactions

## How It Works

### Amazon Integration

1. **Product Detail Extraction**: Automatically captures product title, price, ASIN, and Artikelnummer
2. **Smart Search Button**: Adds "🔍 Suche auf Idealo" button with optimized search query including all identifiers
3. **Price Storage**: Saves Amazon pricing data for cross-platform comparison

### mydealz Enhancement

1. **Merchant Filtering**: Collapsible icon-based filter for merchant-specific deal discovery
2. **Persistent State**: Filter selections persist across page navigation and refreshes
3. **Real-time Updates**: Dynamic filtering with live result counting
4. **Pagination Handling**: Maintains filter state across page changes

### Idealo Advanced Features

1. **Best-Deal Filtering**: Provider-specific filtering for Idealo's Best-Deal merchants
2. **Price Chart Integration**:
    - Interactive price history analysis with percentage calculations
    - Form integration directly within price chart modals
    - Time period switching with state persistence
3. **Smart Product Analysis**:
    - Automatic price comparison with color-coded annotations
    - Best match highlighting based on title similarity
    - Best deal identification with price difference calculations
4. **Automated Deal Posting**:
    - In-modal price information form with pre-filled product data
    - Slack webhook integration for automated deal notifications
    - Clipboard functionality for manual sharing workflows

### Cross-Platform State Management

-   **Filter Persistence**: All filter states saved across browser sessions
-   **Form State Memory**: Price information form remembers open/closed state during time period changes
-   **Webhook Security**: Secure storage and masked display of Slack webhook URLs

## Installation and Usage

### Installation

1. Clone or download the repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The extension will be automatically active on Amazon, Idealo, and mydealz pages

### Usage Workflow

#### For Amazon → Idealo Comparison:

1. Visit any Amazon product page
2. Click the "🔍 Suche auf Idealo" button (automatically includes ASIN and product details)
3. Review highlighted matches and best deals on Idealo
4. Use the price chart integration for historical analysis

#### For Deal Filtering:

1. **mydealz**: Click the filter icon (top-right) to filter by specific merchants
2. **Idealo**: Click the filter icon to filter by Best-Deal providers
3. Filters persist across page navigation and browser sessions

#### For Automated Deal Posting:

1. Open any Idealo price chart
2. Click "📊 Price Info Form" in the modal header
3. Configure Slack webhook URL (saved securely for future use)
4. Send formatted deal information directly to Slack or copy to clipboard

### Configuration

-   **Slack Integration**: Enter webhook URL once - it's stored locally and masked for privacy
-   **Filter Preferences**: All filter selections are automatically saved and restored
-   **Form State**: Price information form remembers its state across time period changes
