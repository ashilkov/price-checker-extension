document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('save'); // Reference to the save button
    const intervalInput = document.getElementById('interval'); // Reference to the interval input
    const baseCurrencySelect = document.getElementById('baseCurrency');
    // Load saved base currency from storage when the options page is opened
    chrome.storage.sync.get('baseCurrency', (data) => {
        const savedCurrency = data.baseCurrency || 'USD'; // Default to USD if not set
        baseCurrencySelect.value = savedCurrency; // Set the select field to the saved currency
    });

    // Load saved interval from storage when the options page is opened
    chrome.storage.sync.get('interval', (data) => {
        const savedInterval = data.interval || 5; // Default to 5 minutes if not set
        intervalInput.value = savedInterval; // Set the input field to the saved interval
    });

    // Save interval when the save button is clicked
    saveButton.addEventListener('click', () => {

        // Get the selected base currency
        const selectedCurrency = baseCurrencySelect.value;

        // Save the base currency in storage
        chrome.storage.sync.set({ baseCurrency: selectedCurrency, exchangeRates: {} }, () => {
            console.log(`Base currency updated to ${selectedCurrency}`);
        });

        const newInterval = parseInt(intervalInput.value, 10);
        if (isNaN(newInterval) || newInterval <= 0) {
            alert('Please enter a valid interval greater than 0.');
            return;
        }

        // Save the new interval in storage
        chrome.storage.sync.set({ interval: newInterval }, () => {
            console.log(`Interval updated to ${newInterval} minutes.`);
            alert(`Price check interval updated to ${newInterval} minutes.`); // Confirmation message
            
            // Notify the background script about the new interval
            chrome.runtime.sendMessage({ action: 'updateInterval', interval: newInterval });
        });
    });
});
