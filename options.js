// import { DEFAULT_CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('save'); // Reference to the save button
    const intervalInput = document.getElementById('interval'); // Reference to the interval input
    const baseCurrencySelect = document.getElementById('baseCurrency');
    const allowedCurrenciesSelect = document.getElementById('allowedCurrencies'); // Add this line
    const darkModeToggle = document.getElementById('darkMode');

    // First get supported currencies from storage, then populate both selects
    chrome.storage.sync.get(DEFAULT_CONFIG.storageKeys.supportedCurrencies, (data) => {
        const supportedCurrencies = data.supportedCurrencies || DEFAULT_CONFIG.supportedCurrencies;
        
        // Populate allowed currencies select
        Object.entries(supportedCurrencies).forEach(([code, data]) => {
            const option = new Option(`${code} - ${data.symbol}`, code);
            allowedCurrenciesSelect.appendChild(option);
        });
        
        // Move the allowed currencies loading here and populate base currency select afterward
        chrome.storage.sync.get(DEFAULT_CONFIG.storageKeys.allowedCurrencies, (data) => {
            const savedCurrencies = data.allowedCurrencies || DEFAULT_CONFIG.defaultAllowedCurrencies;
            
            // Update allowed currencies selection
            Array.from(allowedCurrenciesSelect.options).forEach(option => {
                option.selected = savedCurrencies.includes(option.value);
            });

            // Populate base currency select with only allowed currencies
            baseCurrencySelect.innerHTML = ''; // Clear existing options
            savedCurrencies.forEach(currencyCode => {
                const currencyData = supportedCurrencies[currencyCode];
                const option = new Option(`${currencyData.symbol} ${currencyCode}`, currencyCode);
                baseCurrencySelect.appendChild(option);
            });

            // Load saved base currency
            chrome.storage.sync.get(DEFAULT_CONFIG.storageKeys.baseCurrency, (data) => {
                const savedCurrency = data.baseCurrency || DEFAULT_CONFIG.baseCurrency;
                if (savedCurrencies.includes(savedCurrency)) {
                    baseCurrencySelect.value = savedCurrency;
                } else {
                    baseCurrencySelect.value = savedCurrencies[0]; // Default to first allowed currency
                }
            });
        });
    });

    // Load saved interval from storage when the options page is opened
    chrome.storage.sync.get(DEFAULT_CONFIG.storageKeys.interval, (data) => {
        const savedInterval = data.interval || DEFAULT_CONFIG.interval; // Default to 5 minutes if not set
        intervalInput.value = savedInterval; // Set the input field to the saved interval
    });

    // Load dark mode setting
    chrome.storage.sync.get(DEFAULT_CONFIG.storageKeys.darkMode, (data) => {
        const isDarkMode = data.darkMode || false;
        darkModeToggle.checked = isDarkMode;
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }
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

        // Get the selected allowed currencies
        const selectedCurrencies = Array.from(allowedCurrenciesSelect.selectedOptions).map(option => option.value);

        // Add dark mode to the storage update
        const isDarkMode = darkModeToggle.checked;
        chrome.storage.sync.set({ 
            baseCurrency: selectedCurrency, 
            exchangeRates: {},
            interval: newInterval,
            allowedCurrencies: selectedCurrencies,
            darkMode: isDarkMode
        }, () => {
            console.log(`Settings updated: interval=${newInterval}, currencies=${selectedCurrencies.join(',')}`);
            
            // Show notification
            const notification = document.getElementById('saveNotification');
            notification.textContent = 'Settings saved successfully!';
            notification.classList.add('show');
            
            // Hide notification after 3 seconds
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
                    
            // Notify the background script about the updates
            chrome.runtime.sendMessage({ 
                action: 'updateSettings', 
                interval: newInterval,
                allowedCurrencies: selectedCurrencies,
                darkMode: isDarkMode
            });
        });
    });

    // Add dark mode toggle listener for immediate preview
    darkModeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    });
});
