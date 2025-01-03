// Default configuration settings for the extension
const DEFAULT_CONFIG = {
    // Price checking settings
    interval: 5, // Default check interval in minutes
    baseCurrency: 'USD',

    defaultAllowedCurrencies: ['USD', 'EUR', 'GBP', 'CZK'],
    
    // Currency settings
    supportedCurrencies: {
        USD: { symbol: '$', name: 'USD' },
        EUR: { symbol: '€', name: 'EUR' },
        GBP: { symbol: '£', name: 'GBP' },
        JPY: { symbol: '¥', name: 'JPY' },
        CNY: { symbol: '¥', name: 'CNY' },
        AUD: { symbol: '$', name: 'AUD' },
        CAD: { symbol: '$', name: 'CAD' },
        CHF: { symbol: 'Fr', name: 'CHF' },
        HKD: { symbol: '$', name: 'HKD' },
        NZD: { symbol: '$', name: 'NZD' },
        SEK: { symbol: 'kr', name: 'SEK' },
        KRW: { symbol: '₩', name: 'KRW' },
        SGD: { symbol: '$', name: 'SGD' },
        NOK: { symbol: 'kr', name: 'NOK' },
        MXN: { symbol: '$', name: 'MXN' },
        INR: { symbol: '₹', name: 'INR' },
        RUB: { symbol: '₽', name: 'RUB' },
        ZAR: { symbol: 'R', name: 'ZAR' },
        TRY: { symbol: '₺', name: 'TRY' },
        BRL: { symbol: 'R$', name: 'BRL' },
        CZK: { symbol: 'Kč', name: 'CZK', pattern: '${amount} Kč' }
    },

    defaultPattern: '${amount}',
    
    // Exchange rate settings
    exchangeRateUpdateInterval: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
    fallbackExchangeRates: {
        'USD': 1,
        'EUR': 0.92,
        'GBP': 0.79,
        'CZK': 22.87
    },
    
    // UI settings
    badgeBackgroundColors: {
        default: '#808080',
        update: '#FF0000'
    },
    badgeTextColor: '#FFFFFF',
    
    // Storage keys
    storageKeys: {
        products: 'products',
        baseCurrency: 'baseCurrency',
        interval: 'interval',
        exchangeRates: 'exchangeRates',
        ratesLastUpdated: 'ratesLastUpdated',
        allowedCurrencies: 'allowedCurrencies',
        darkMode: 'darkMode'
    }
};

// Prevent modifications to the config object
Object.freeze(DEFAULT_CONFIG);