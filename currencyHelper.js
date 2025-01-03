let currentExchangeRates = {};

// Format price based on selected currency
function formatPrice(price, currency) {
    if (price === null || price === undefined) {
        return 'Price not available';
    }
    
    // Add check for valid number
    if (typeof price !== 'number' || isNaN(price)) {
        return 'Invalid price';
    }
    let supportedCurrency = DEFAULT_CONFIG.supportedCurrencies;
    let pattern = DEFAULT_CONFIG.defaultPattern;
    switch (currency) {
        case 'CZK':
            return supportedCurrency.CZK.pattern.replace('${amount}', `${price.toFixed(2)}`);
        default:
            return pattern.replace('${amount}', `${price.toFixed(2)}`);
    }
}

function convertPriceBaseCurrency(price, currency) {
    if (!price) return 0;
    let baseCurrency = chrome.storage.sync.get(DEFAULT_CONFIG.storageKeys.baseCurrency);
    if (currency === baseCurrency) return price;
    
    return price / currentExchangeRates[currency];
}

function getBaseCurrencyRates() {
    return chrome.storage.sync.get(DEFAULT_CONFIG.storageKeys.baseCurrency)
        .then(result => {
            const baseCurrency = result.baseCurrency || DEFAULT_CONFIG.baseCurrency;
            return chrome.storage.local.get([DEFAULT_CONFIG.storageKeys.exchangeRates, DEFAULT_CONFIG.storageKeys.ratesLastUpdated])
                .then(({ exchangeRates, ratesLastUpdated }) => {
                    const now = new Date();
                    if (exchangeRates && ratesLastUpdated && 
                        (now - new Date(ratesLastUpdated)) < 24 * 60 * 60 * 1000) {
                        currentExchangeRates = exchangeRates;
                        return exchangeRates;
                    }

                    // another option: https://latest.currency-api.pages.dev/v1/currencies/czk.json
                    return fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`)
                        .then(response => {
                            if (!response.ok) throw new Error('Network response was not ok');
                            return response.json();
                        })
                        .then(data => {
                            currentExchangeRates = data.rates;
                            chrome.storage.local.set({
                                exchangeRates: data.rates,
                                ratesLastUpdated: new Date().toISOString()
                            });
                            return data.rates;
                        })
                        .catch(error => {
                            console.error('Error fetching exchange rates:', error);
                            currentExchangeRates = DEFAULT_CONFIG.exchangeRates;
                            return fallbackRates;
                        });
                });
        });
}

function getMinPrice(product) {
    if (!product.sources || product.sources.length === 0) {
        return null;
    }

    // Get the first source as initial minimum
    const minSource = product.sources.reduce((min, source) => {
        // Skip invalid prices
        if (!source.price) return min;
        if (!min.price) return source;

        // Direct comparison based on currency
        if (source.currency === min.currency) {
            return source.price < min.price ? source : min;
        }

        // If different currencies, compare in USD
        const sourceInBase = convertPriceBaseCurrency(source.price, source.currency);
        const minInBase = convertPriceBaseCurrency(min.price, min.currency);
        
        return sourceInBase < minInBase ? source : min;
    }, product.sources[0]);

    return formatPrice(minSource.price, minSource.currency);
}