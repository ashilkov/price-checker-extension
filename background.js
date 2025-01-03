importScripts('helper.js');
importScripts('currencyHelper.js');
importScripts('config.js');

let newPriceUpdatesCount = 0; // Initialize a counter for new price updates

// Initialize price checking with the current interval
function initializePriceCheck() {
    chrome.storage.sync.get(DEFAULT_CONFIG.storageKeys.interval, (data) => {
        const interval = data.interval || DEFAULT_CONFIG.interval; // Default to 5 minutes
        console.log("Starting price check with interval: " + interval);
        startPriceCheck(interval);
    });
}

function startPriceCheck(interval) {
    chrome.alarms.clear("checkPrices"); // Clear any existing alarms
    console.log("Starting price check with interval: " + interval);
    chrome.alarms.create("checkPrices", { periodInMinutes: interval}); // Set the alarm to check prices based on user input
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateInterval') {
        console.log(`Received new interval: ${request.interval} minutes`);
        startPriceCheck(request.interval); // Update the price check interval
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkPrices") {
        checkPrices();
    }
});

// Call this function initially to start the price checking
initializePriceCheck();
initializeBadge();

async function checkPrices() {
    chrome.storage.sync.get(DEFAULT_CONFIG.storageKeys.products, async (data) => {
        newPriceUpdatesCount = 0; // Reset the counter before checking
        const products = data.products || [];

        for (const product of products) {
            for (const source of product.sources) {
                try {
                    console.log(`Checking price for: ${product.name}`);

                    const response = await fetch(source.link);
                    console.log(response);

                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    console.log(response);
                    const html = await response.text(); // Get the HTML as text
                    const priceValue = extractPriceFromHtml(html, source.selector); // Extract price using regex
                    console.log(priceValue);
                    if (priceValue !== null) {
                        console.log(`Fetched Price: ${priceValue}`);
                        source.last_update = getCurrentDate();

                        if (priceValue !== source.price) {
                            newPriceUpdatesCount++; // Increment the counter for new price updates
                            source.price = priceValue; // Update product price
                            console.log(product)
                            chrome.storage.sync.set({ products: products }, () => {
                                notifyUser(product, source); // Notify user of price change
                            });
                        } else {
                            chrome.storage.sync.set({ products: products });
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching price for ${product.name}:`, error);
                }
            }
        }

        updateBadge(products.length); // Update the badge after checking all products
    });
}

// Function to extract price from HTML using regex
function extractPriceFromHtml(html, selector) {
    // Escape special characters for regex
    const escapedSelector = selector.replace(/([*+?^${}()|\[\]\\])/g, '\\$1'); // Escape special regex characters

    console.log('Escaped selector: ' + escapedSelector);
    let regexPattern;

    if (selector.startsWith('.')) {
        // Class selector
        regexPattern = new RegExp(`<([a-zA-Z][a-zA-Z0-9]*)[^>]*class="[^"]*${escapedSelector.slice(1)}[^"]*"[^>]*>(.*?)<\\/\\1>`, 'i');
        // regexPattern = new RegExp(`class="${escapedSelector.slice(1)}"[^>]*>([^<]*)`, 'i');
    } else if (selector.startsWith('#')) {
        // ID selector
        regexPattern = new RegExp(`<([a-zA-Z][a-zA-Z0-9]*)[^>]*id="[^"]*${escapedSelector.slice(1)}[^"]*"[^>]*>(.*?)<\\/\\1>`, 'i');
    } else {
        // Tag name or other selector; this is a simplification
        return null;
    }

    console.log(regexPattern);

    // Execute the regex match
    const match = html.match(regexPattern);
    if (match && match[2]) {
        const priceText = match[2].trim(); // Extract the price text
        const priceValue = parseFloat(priceText.replace(/[^0-9.-]+/g, "")); // Extract number from string
        return priceValue; // Return the parsed price value
    }
    console.error("No valid price element found for selector:", selector);
    return null; // Return null if no valid price element is found
}

function notifyUser(product, source) {
    const options = {
        type: "basic",
        iconUrl: "icon-128.png",
        title: "We found a better price!",
        message: `The price for "${product.name}" has changed to ${formatPrice(source.price, source.currency)}.`,
        priority: 2
    };
    chrome.notifications.create("", options);
}

function updateBadge(totalProducts) {
    // Set the badge text based on new price updates or total products
    const badgeText = newPriceUpdatesCount > 0 ? newPriceUpdatesCount.toString() : totalProducts > 0 ? totalProducts.toString() : "";
    chrome.action.setBadgeText({ text: badgeText });
    
    if (newPriceUpdatesCount > 0) {
        // Set the badge color to white
        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' }); // Set badge color to red
    } else {
        chrome.action.setBadgeBackgroundColor({ color: '#808080' }); // Set badge color to grey
    }
    
    // Ensure badge text color is white
    chrome.action.setBadgeTextColor({ color: '#FFFFFF' }); // Change text color to white
}

// Show count on extension load
function initializeBadge() {
    chrome.storage.sync.get(DEFAULT_CONFIG.storageKeys.products, (data) => {
        const totalProducts = data.products ? data.products.length : 0;
        console.log(totalProducts);
        updateBadge(totalProducts); // Update badge on startup with the total product count
    });
}

// Initialize exchange rates when the app starts
getBaseCurrencyRates()
    .then(() => console.log('Exchange rates initialized'))
    .catch(error => console.error('Failed to initialize exchange rates:', error));

// Optionally, update rates periodically
setInterval(() => {
    getBaseCurrencyRates()
        .then(() => console.log('Exchange rates updated'))
        .catch(error => console.error('Failed to update exchange rates:', error));
}, 12 * 60 * 60 * 1000); // Update every 12 hours
