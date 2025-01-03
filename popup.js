document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.getElementById('add');
    const nameInput = document.getElementById('name');
    const selectorInput = document.getElementById('selector');
    const productList = document.getElementById('product-list').querySelector('tbody');
    const currencySelect = document.getElementById('currency');
    const collapsibleButton = document.querySelector('.collapsible');
    const content = document.querySelector('.content');
    const productSelect = document.getElementById('productSelect');
    
    let products = []; // Declare products here to be accessible globally

    //product structure: {name: string, sources: [{name: stringlink: string, selector: string, currency: string, last_update: string}]}

    // Load saved products, selected currency, and interval from storage
    chrome.storage.sync.get(['products', 'baseCurrency', 'interval'], (data) => {
        products = data.products || [];
        const selectedCurrency = data.baseCurrency || 'USD';
        if (currencySelect) {
            currencySelect.value = selectedCurrency;
        }
        updateProductSelector();
        updateBadge(products.length);

        if (products) {
            products.forEach(product => {
                addProductToTable(product);
            });
        }
    });

    // Prefill the product name with the page title
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab) {
            nameInput.value = activeTab.title; // Prefill with the page title
        }
    });

    // Add console logs to debug
    console.log('Collapsible button:', collapsibleButton);
    console.log('Content:', content);

    if (collapsibleButton && content) {
        collapsibleButton.addEventListener('click', (e) => {
            console.log('Button clicked');
            // Toggle both classes
            content.classList.toggle('active');
            collapsibleButton.classList.toggle('active');
            
            // Update button text based on state
            const isExpanded = content.classList.contains('active');
            collapsibleButton.textContent = isExpanded ? 'Hide Product Form' : 'Add Product';
            console.log(content)
            // Log the current state
            console.log('Content active:', content.classList.contains('active'));
            console.log('Button active:', collapsibleButton.classList.contains('active'));
        });

        // Set initial state
        collapsibleButton.textContent = 'Add Product';
    } else {
        console.error('Could not find collapsible button or content element');
    }

    // Add a new product
    addButton.addEventListener('click', () => {
        const priceSelector = selectorInput.value;
        const productName = nameInput.value.trim();
        const selectedCurrency = currencySelect.value; // Get the selected currency
        
        // Validate inputs
        if (!productName || !priceSelector) {
            alert('Please enter both a product name and a price selector.');
            return;
        }

        // Disable the button to prevent multiple clicks
        addButton.disabled = true;

        // Get the current tab URL
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (activeTab) {
                const productLink = activeTab.url;
                const trimmedName = productName.length > 50 ? productName.substring(0, 50) + '...' : productName;

                // Check if product exists
                let existingProduct = products.find(product => product.name === trimmedName);
                
                if (existingProduct) {
                    // Check if this source already exists for the product
                    const existingSource = existingProduct.sources.find(source => 
                        source.link === productLink && source.selector === priceSelector);
                    
                    if (existingSource) {
                        addButton.disabled = false;
                        alert('This source is already in the product list.');
                        return;
                    }

                    // Add new source to existing product
                    const newSource = {
                        name: extractDomainName(productLink),
                        link: productLink,
                        selector: priceSelector,
                        price: null,
                        currency: selectedCurrency,
                        last_update: getCurrentDate()
                    };
                    existingProduct.sources.push(newSource);
                } else {
                    // Create new product with first source
                    existingProduct = {
                        name: trimmedName,
                        sources: [{
                            name: extractDomainName(productLink),
                            link: productLink,
                            selector: priceSelector,
                            price: null,
                            currency: selectedCurrency,
                            last_update: getCurrentDate()
                        }]
                    };
                    products.push(existingProduct);
                }

                // Update storage and UI
                chrome.storage.sync.set({ products: products }, () => {
                    const source = existingProduct.sources[existingProduct.sources.length - 1];
                    addProductToTable(existingProduct);

                    // Fetch the current price
                    fetchProductPrice(productLink, source, (fetchedPrice) => {
                        if (fetchedPrice !== null) {
                            source.price = fetchedPrice;
                            source.last_update = getCurrentDate();
                            
                            chrome.storage.sync.set({ products: products }, () => {
                                const lastRow = productList.lastChild;
                                if (lastRow && lastRow.cells && lastRow.cells.length > 1) {
                                    lastRow.cells[1].innerText = formatPrice(source.price, selectedCurrency);
                                }
                            });
                        } else {
                            const lastRow = productList.lastChild;
                            if (lastRow) {
                                lastRow.cells[1].innerText = 'Price not found';
                            }
                        }
                    });
                });
                
                updateBadge(products.length);
                updateProductSelector();
            } else {
                console.error("No active tab found.");
                // Re-enable the button if no active tab is found
                addButton.disabled = false;
            }
        });
    });

    /**
     * Adds or updates a product in the table UI
     * @param {Object} product - The product object to display
     */
    function addProductToTable(product) {
        const existingRow = findProductRow(product.name);
        if (existingRow) {
            updateExistingRow(existingRow, product);
            return;
        }
        createNewRow(product);
    }

    /**
     * Updates an existing row with new product data
     * @param {HTMLElement} row - The table row to update
     * @param {Object} product - The product data to display
     */
    function updateExistingRow(row, product) {
        // Update price cell
        let minPrice = getMinPrice(product);
        row.cells[1].innerText = minPrice !== null && minPrice !== undefined 
            ? minPrice 
            : 'Price not available';
        
        // Remove old sources container if it exists
        const oldSourcesContainer = row.nextElementSibling;
        if (oldSourcesContainer && oldSourcesContainer.classList.contains('sources-container')) {
            oldSourcesContainer.remove();
        }
        
        // Create new sources container
        const sourcesContainer = document.createElement('tbody');
        sourcesContainer.classList.add('sources-container');
        sourcesContainer.style.display = 'none';
        
        // Add header row
        const headerRow = document.createElement('tr');
        headerRow.classList.add('sources-header');
        headerRow.innerHTML = `
            <td>Source Name</td>
            <td>Price</td>
            <td>Last Update</td>
            <td>Actions</td>
        `;
        sourcesContainer.appendChild(headerRow);

        // Add source rows
        product.sources.forEach(source => {
            const sourceRow = document.createElement('tr');
            sourceRow.classList.add('source-row');
            sourceRow.innerHTML = `
                <td><a href="${source.link}" target="_blank">${source.name}</a></td>
                <td>${source.price !== null && source.price !== undefined 
                    ? formatPrice(source.price, source.currency) 
                    : 'Not available'}</td>
                <td>${source.last_update || 'Never'}</td>
                <td>
                    <button class="remove-source-btn" data-product="${product.name}" data-link="${source.link}">
                        <img src="assets/delete.png" alt="Remove">
                    </button>
                </td>
            `;
            sourcesContainer.appendChild(sourceRow);
        });

        // Instead of using insertAdjacentElement, use appendChild
        productList.appendChild(sourcesContainer);
        attachRowEventListeners(row, product, sourcesContainer);
    }

    /**
     * Creates a new table row for a product
     * @param {Object} product - The product to create a row for
     */
    function createNewRow(product) {
        const row = document.createElement('tr');
        let minPrice = getMinPrice(product);
        
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${minPrice !== null && minPrice !== undefined ? minPrice : 'Price not available'}</td>
            <td>
                <button class="sources-btn">Show Sources</button>
            </td>
            <td>
                <button class="refresh-btn"><img src="assets/refresh.png" alt="Refresh"></button>
                <button class="remove-btn"><img src="assets/delete.png" alt="Remove"></button>
            </td>
        `;

        // Add sources rows after the main product row
        const sourcesContainer = document.createElement('tbody');
        sourcesContainer.classList.add('sources-container');
        sourcesContainer.style.display = 'none';
        
        // Add header row for sources
        const headerRow = document.createElement('tr');
        headerRow.classList.add('sources-header');
        headerRow.innerHTML = `
            <td>Source Name</td>
            <td>Price</td>
            <td>Last Update</td>
            <td>Actions</td>
        `;
        sourcesContainer.appendChild(headerRow);

        // Add source rows
        product.sources.forEach(source => {
            const sourceRow = document.createElement('tr');
            sourceRow.classList.add('source-row');
            sourceRow.innerHTML = `
                <td><a href="${source.link}" target="_blank">${source.name}</a></td>
                <td>${source.price !== null && source.price !== undefined 
                    ? formatPrice(source.price, source.currency) 
                    : 'Not available'}</td>
                <td>${source.last_update || 'Never'}</td>
                <td>
                    <button class="remove-source-btn" data-product="${product.name}" data-link="${source.link}">
                        <img src="assets/delete.png" alt="Remove">
                    </button>
                </td>
            `;
            sourcesContainer.appendChild(sourceRow);
        });

        console.log(sourcesContainer);

        // Add the main product row first
        productList.appendChild(row);
        
        // Then add the sources container
        productList.appendChild(sourcesContainer);

        attachRowEventListeners(row, product, sourcesContainer);
    }

    /**
     * Attaches all necessary event listeners to a product row
     * @param {HTMLElement} row - The table row to attach listeners to
     * @param {Object} product - The product associated with the row
     */
    function attachRowEventListeners(row, product, sourcesContainer) {
        // Sources button listener - toggles visibility of sources container
        const sourcesBtn = row.querySelector('.sources-btn');
        sourcesBtn.addEventListener('click', () => {
            sourcesContainer.style.display = sourcesContainer.style.display === 'none' ? 'contents' : 'none';
            sourcesBtn.classList.toggle('active');
        });

        // Update source removal listeners
        sourcesContainer.querySelectorAll('.remove-source-btn').forEach(button => {
            button.addEventListener('click', () => {
                const productName = button.dataset.product;
                const sourceLink = button.dataset.link;
                
                // Check if this is the last source
                const productInList = products.find(p => p.name === productName);
                if (productInList && productInList.sources.length === 1) {
                    // If it's the last source, remove the entire product
                    removeProduct(productInList);
                } else {
                    // Otherwise, just remove the source
                    removeSource(productName, sourceLink);
                }
            });
        });

        // Refresh button - updates product prices
        row.querySelector('.refresh-btn').addEventListener('click', () => refreshProduct(row, product));

        // Remove button - removes entire product
        row.querySelector('.remove-btn').addEventListener('click', () => removeProduct(product));
    }

    /**
     * Refreshes product prices and updates the UI
     * @param {HTMLElement} row - The table row to refresh
     * @param {Object} product - The product to refresh
     */
    function refreshProduct(row, product) {
        showLoader();
        chrome.storage.sync.get('products', (data) => {
            const products = data.products || [];
            const currentProduct = products.find(p => p.name === product.name);
            
            if (currentProduct) {
                // Create an array of promises for all price fetches
                const pricePromises = currentProduct.sources.map(source => {
                    return new Promise((resolve) => {
                        fetchProductPrice(source.link, { selector: source.selector }, (fetchedPrice) => {
                            if (fetchedPrice !== null) {
                                source.price = fetchedPrice;
                                source.last_update = getCurrentDate();
                            }
                            resolve(); // Resolve the promise regardless of fetch success
                        });
                    });
                });

                // Wait for all price fetches to complete before updating UI and storage
                Promise.all(pricePromises).then(() => {
                    // updateExistingRow(row, currentProduct);
                    chrome.storage.sync.set({ products: products });
                    refreshPopup();
                    hideLoader();
                });
            }
        });
    }

    // Function to fetch product price via AJAX
    function fetchProductPrice(link, product, callback) {
        console.log(product);

        // Send a request to fetch the page content
        fetch(link)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text(); // Get the HTML as text
            })
            .then(html => {
                // Create a temporary div to parse the HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                console.log(product.selector)

                // Use the selector to find the price element in the parsed document
                const priceElement = doc.querySelector(product.selector);
                console.log(priceElement)
                if (priceElement) {
                    const priceText = priceElement.innerText || priceElement.textContent; // Get the price text
                    const priceValue = parseFloat(priceText.replace(/[^0-9.-]+/g, "")); // Extract number from string
                    console.log(priceValue)
                    callback(priceValue); // Call the callback with the price value
                } else {
                    console.error("No valid price element found for selector:", product.selector);
                    callback(null); // Return null if no valid price element is found
                }
            })
            .catch(error => {
                console.error('Error fetching price:', error);
                callback(null); // In case of an error, return null
            });
    }

    // Function to find a product row by name
    function findProductRow(productName) {
        const rows = productList.getElementsByTagName('tr');
        for (let row of rows) {
            if (row.cells[0].textContent === productName) {
                return row;
            }
        }
        return null;
    }

    // Function to remove a product from the list and storage
    function removeProduct(product) {
        chrome.storage.sync.get('products', (data) => {
            const products = data.products || [];
            const productIndex = products.findIndex(p => p.name === product.name);
            
            if (productIndex !== -1) {
                products.splice(productIndex, 1);
                chrome.storage.sync.set({ products: products }, () => {
                    // Find the row by iterating through rows and matching product name
                    const row = findProductRow(product.name);
                    if (row) {
                        productList.removeChild(row);
                    }
                    updateBadge(products.length);
                    updateProductSelector();
                });
            }
        });
    }

    // Function to update the badge in the action
    function updateBadge(count) {
        if (count > 0) {
            chrome.action.setBadgeText({ text: count.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#808080' }); // Set badge color to grey
            chrome.action.setBadgeTextColor({ color: '#FFFFFF' }); // Change text color to white
        } else {
            chrome.action.setBadgeText({ text: "" }); // Clear badge if no products
        }
    }

    // Function to remove a source from a product
    function removeSource(productName, sourceLink) {
        chrome.storage.sync.get('products', (data) => {
            const products = data.products || [];
            const product = products.find(p => p.name === productName);
            
            if (product) {
                // Remove the source
                product.sources = product.sources.filter(source => source.link !== sourceLink);
                
                // If no sources left, remove the entire product
                if (product.sources.length === 0) {
                    const productIndex = products.findIndex(p => p.name === productName);
                    products.splice(productIndex, 1);
                }

                // Update storage and UI
                chrome.storage.sync.set({ products: products }, () => {
                    // Refresh the product list display
                    productList.innerHTML = '';
                    products.forEach(product => {
                        addProductToTable(product);
                    });
                    updateBadge(products.length);
                });
            }
        });
    }

    // Add new function to update product selector
    function updateProductSelector() {
        // Clear existing options except "New Product"
        while (productSelect.options.length > 1) {
            productSelect.remove(1);
        }
        
        // Add existing products as options
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.name;
            option.textContent = product.name;
            productSelect.appendChild(option);
        });
    }

    // Add event listener for product selection
    productSelect.addEventListener('change', () => {
        const selectedValue = productSelect.value;
        if (selectedValue === 'new') {
            // For new product, clear the name field and get the page title
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                if (activeTab) {
                    nameInput.value = activeTab.title;
                }
            });
        } else {
            // For existing product, set the name field to the selected product name
            nameInput.value = selectedValue;
        }
    });

    // For the sources container
    function toggleSources(sourcesContainer) {
        sourcesContainer.classList.toggle('active');
    }

    // Function to clear and re-render the popup
    function refreshPopup() {
        // Clear the input fields
        nameInput.value = '';
        selectorInput.value = '';
        
        // Reset product selector to "New Product"
        productSelect.value = 'new';
        
        // Clear the product list
        productList.innerHTML = '';
        
        // Re-fetch products from storage and re-render
        chrome.storage.sync.get(['products', 'baseCurrency'], (data) => {
            products = data.products || [];
            const selectedCurrency = data.baseCurrency || 'USD';
            
            // Update currency select if it exists
            if (currencySelect) {
                currencySelect.value = selectedCurrency;
            }
            
            // Update product selector dropdown
            updateProductSelector();
            
            // Update badge count
            updateBadge(products.length);
            
            // Re-render product list
            products.forEach(product => {
                addProductToTable(product);
            });
        });
    }

    // Function to populate currency select
    function populateCurrencySelect() {
        const currencySelect = document.getElementById('currency');
        
        // Clear existing options
        currencySelect.innerHTML = '';
        
        // Get both allowed currencies and base currency from storage
        chrome.storage.sync.get(['allowedCurrencies', 'baseCurrency'], (data) => {
            const allowedCurrencies = data.allowedCurrencies || DEFAULT_CONFIG.defaultAllowedCurrencies;
            const baseCurrency = data.baseCurrency || DEFAULT_CONFIG.baseCurrency;
            
            // Add options only for allowed currencies
            allowedCurrencies.forEach(code => {
                const details = DEFAULT_CONFIG.supportedCurrencies[code];
                const option = document.createElement('option');
                option.value = code;
                option.textContent = `${details.symbol} ${code}`;
                
                // Set selected if this is the base currency
                if (code === baseCurrency) {
                    option.selected = true;
                }
                
                currencySelect.appendChild(option);
            });
        });
    }

    // Call it after DOMContentLoaded
    populateCurrencySelect();
});
