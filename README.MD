# Price Checker Chrome Extension

A Chrome extension that helps users track product prices across multiple websites. Get notified when prices change and compare prices across different vendors.

## Features

- 🔍 Track product prices from any website using CSS selectors
- 💰 Support for multiple currencies (20+ currencies including USD, EUR, GBP, CZK, etc.)
- 🔄 Automatic price updates at customizable intervals
- 📊 Compare prices across different vendors for the same product
- 🔔 Get notifications when prices change
- 📱 Clean, responsive interface with collapsible sections
- 🎨 Modern gradient-based UI design
- 🌍 Currency conversion and formatting
- 🔧 Customizable settings for allowed currencies and base currency

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

### Adding Products

1. Navigate to a product page you want to track
2. Click the Price Checker extension icon
3. Click "Add Product" to expand the form
4. The product name will be auto-filled with the page title
5. Select the currency from your allowed currencies list
6. Enter the CSS selector for the price element
7. Click "Add Product"

### Managing Products

- View all tracked products in the main popup
- Show/hide additional sources for each product
- Refresh prices manually using the refresh button
- Remove products or individual sources as needed
- Add multiple sources for the same product for price comparison

### Settings

Access the settings page to configure:
- Price check interval (in minutes)
- Base currency for price comparisons
- Allowed currencies for tracking
- Currency display preferences

## Technical Details

### Technologies Used

- Chrome Extension APIs
- JavaScript (ES6+)
- HTML5
- CSS3 with modern gradients and animations

### Key Components

- **Background Service Worker**: Handles periodic price checks and notifications
- **Popup Interface**: Main user interface for managing products
- **Options Page**: Configuration settings with currency management
- **Currency Helper**: Handles currency conversions and formatting
- **Config System**: Centralized configuration management
- **Helper Functions**: Common utility functions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Exchange rate data provided by [ExchangeRate-API](https://www.exchangerate-api.com/)
- Icons and UI elements designed for optimal user experience

## Support

For support, please open an issue in the GitHub repository.