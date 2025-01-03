# Price Checker Chrome Extension

A Chrome extension that helps users track product prices across multiple websites. Get notified when prices change and compare prices across different vendors.

## Features

- 🔍 Track product prices from any website using CSS selectors
- 💰 Support for multiple currencies (USD, EUR, GBP, CZK)
- 🔄 Automatic price updates at customizable intervals
- 📊 Compare prices across different vendors for the same product
- 🔔 Get notifications when prices change
- 📱 Clean, responsive interface with collapsible sections

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

### Adding Products

1. Navigate to a product page you want to track
2. Click the Price Checker extension icon
3. Click "Add Product"
4. The product name will be auto-filled with the page title
5. Select the currency
6. Enter the CSS selector for the price element
7. Click "Add Product"

### Managing Products

- View all tracked products in the main popup
- Show/hide additional sources for each product
- Refresh prices manually using the refresh button
- Remove products or individual sources as needed

### Settings

Access the settings page to configure:
- Price check interval (in minutes)
- Base currency for price comparisons

## Technical Details

### Technologies Used

- Chrome Extension APIs
- JavaScript (ES6+)
- HTML5
- CSS3

### Key Components

- **Background Service Worker**: Handles periodic price checks and notifications
- **Popup Interface**: Main user interface for managing products
- **Options Page**: Configuration settings
- **Currency Helper**: Handles currency conversions and formatting
- **Helper Functions**: Common utility functions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Exchange rate data provided by [ExchangeRate-API](https://www.exchangerate-api.com/)

## Support

For support, please open an issue in the GitHub repository.