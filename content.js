// content.js
console.log("Content script loaded!");

function extractPrice(html, selector) {
    const doc = new DOMParser().parseFromString(html, 'text/html'); // Parse HTML string into a document
    const priceElement = doc.querySelector(selector); // Use the selector to find the price element
    if (priceElement) {
        // Check if the element is an input field
        if (priceElement.tagName.toLowerCase() === 'input') {
            return parseFloat(priceElement.value.replace(/[^0-9.]/g, "")) || null;
        } else {
            return parseFloat(priceElement.innerText.replace(/[^0-9.]/g, "")) || null;
        }
    }
    console.error("No valid price element found for selector:", selector);
    return null; // Return null if no valid price element is found
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractPrice') {
        const price = extractPrice(request.html, request.selector);
        sendResponse({ price: price });
    } else if (request.action === 'getPrice') {
        const price = getPrice(request.selector);
        sendResponse({ price: price });
    } else {
        sendResponse({ price: null });
    }
});

function getPrice(selector) {
    const priceElement = document.querySelector(selector);
    if (priceElement) {
        console.log("Found price element:", priceElement);
        if (priceElement.tagName.toLowerCase() === 'input') {
            const priceValue = priceElement.value;
            return parseFloat(priceValue.replace(/[^0-9.]/g, "")) || null;
        } else {
            const priceText = priceElement.innerText;
            console.log("Price Text:" + priceText)
            console.log("Parsed price:" + priceText.replace(/[^0-9.]/g, ""))
            return parseFloat(priceText.replace(/[^0-9.]/g, "")) || null;
        }
    }
    console.error("No valid price element found for selector:", selector);
    return null;
}
