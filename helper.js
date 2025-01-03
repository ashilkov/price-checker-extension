function getCurrentDate() {
    const now = new Date();

    const padZero = (number) => number.toString().padStart(2, '0');

    const hours = padZero(now.getHours());
    const minutes = padZero(now.getMinutes());
    const seconds = padZero(now.getSeconds());
    
    const day = padZero(now.getDate());
    const month = padZero(now.getMonth() + 1); // Months are zero-indexed
    const year = now.getFullYear();

    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
}

function extractDomainName(url) {
    try {
        const hostname = new URL(url).hostname;
        return hostname.replace('www.', '');
    } catch (e) {
        return url;
    }
}

function showLoader() {
    const loaderContainer = document.querySelector('.loader-container');
    loaderContainer.classList.add('active');
}

function hideLoader() {
    const loaderContainer = document.querySelector('.loader-container');
    loaderContainer.classList.remove('active');
}
