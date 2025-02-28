// content.js
let filterKeywords = [];
let observer = null;

// Load saved filter keywords
function loadKeywords() {
    chrome.storage.sync.get('filterKeywords', function (data) {
        if (data.filterKeywords) {
            filterKeywords = data.filterKeywords;
            filterVideos();
            setupObserver();
        }
    });
}

// Listen for direct messages from popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "applyFilters") {
        // Reload keywords and apply filters immediately
        loadKeywords();
        sendResponse({ status: "Filters applied" });
    }
    return true; // Indicates async response
});

// Filter videos based on keywords
function filterVideos() {
    if (filterKeywords.length === 0) return;

    // Regular YouTube videos
    filterRegularVideos();

    // Handle rich sections which contain shelves (like Shorts)
    filterRichSections();
}

// Filter regular YouTube videos
function filterRegularVideos() {
    // Selectors for regular videos
    const selectors = [
        'ytd-video-renderer',
        'ytd-grid-video-renderer',
        'ytd-compact-video-renderer',
        'ytd-rich-item-renderer',
        'ytd-compact-radio-renderer',
        'ytd-grid-shorts-video-renderer'
    ];

    // Process all video elements on the page
    selectors.forEach(selector => {
        const videos = document.querySelectorAll(selector);

        videos.forEach(video => {
            const titleElement = video.querySelector('#video-title') ||
                video.querySelector('.title') ||
                video.querySelector('h3');

            if (titleElement && titleElement.textContent) {
                const title = titleElement.textContent.trim().toLowerCase();

                // Check if title contains any filtered keywords
                const shouldHide = filterKeywords.some(keyword =>
                    title.includes(keyword.toLowerCase())
                );

                if (shouldHide) {
                    video.style.display = 'none';
                }
            }
        });
    });
}

// Filter rich sections (like Shorts shelves)
function filterRichSections() {
    // Target rich sections on the page
    const richSections = document.querySelectorAll('ytd-rich-section-renderer');

    richSections.forEach(section => {
        // First, check if this is a Shorts section by looking for indicators
        const isShorts =
            section.querySelector('span#title')?.textContent?.includes('Shorts') ||
            section.hasAttribute('is-shorts') ||
            section.querySelector('[is-shorts]') ||
            section.querySelector('ytd-rich-shelf-renderer[is-shorts]');

        // Process all items in this section
        const items = section.querySelectorAll('ytd-rich-item-renderer');

        // Keep track of how many items we've hidden
        let hiddenItemsCount = 0;
        const totalItems = items.length;

        items.forEach(item => {
            // Find the title using various possible selectors
            const titleSelectors = [
                '#video-title',
                '.title',
                '#title-text',
                'span#title',
                'yt-formatted-string#video-title',
                'a#video-title-link'
            ];

            let titleElement = null;
            for (const selector of titleSelectors) {
                titleElement = item.querySelector(selector);
                if (titleElement && titleElement.textContent.trim()) break;
            }

            if (titleElement && titleElement.textContent) {
                const title = titleElement.textContent.trim().toLowerCase();

                // Check if title contains any filtered keywords
                const shouldHide = filterKeywords.some(keyword =>
                    title.includes(keyword.toLowerCase())
                );

                if (shouldHide) {
                    // Hide the item
                    item.style.display = 'none';
                    hiddenItemsCount++;
                }
            }
        });

        // If we've hidden all or most items in a section, hide the entire section
        if (hiddenItemsCount > 0 && hiddenItemsCount >= totalItems * 0.75) { // hide if 75% or more are hidden
            section.style.display = 'none';
        }
    });

    // Also look for the shorts shelf directly
    const shortsShelf = document.querySelector('ytd-reel-shelf-renderer');
    if (shortsShelf) {
        const items = shortsShelf.querySelectorAll('ytd-reel-item-renderer');
        let hiddenItemsCount = 0;

        items.forEach(item => {
            // Check different locations for title
            const overlayText = item.querySelector('#overlay-text');
            const videoTitle = item.querySelector('#video-title');
            const anyTitle = item.querySelector('[title]');

            let titleText = '';
            if (overlayText && overlayText.textContent) {
                titleText = overlayText.textContent;
            } else if (videoTitle && videoTitle.textContent) {
                titleText = videoTitle.textContent;
            } else if (anyTitle && anyTitle.getAttribute('title')) {
                titleText = anyTitle.getAttribute('title');
            } else if (anyTitle && anyTitle.textContent) {
                titleText = anyTitle.textContent;
            }

            titleText = titleText.trim().toLowerCase();

            if (titleText) {
                const shouldHide = filterKeywords.some(keyword =>
                    titleText.includes(keyword.toLowerCase())
                );

                if (shouldHide) {
                    item.style.display = 'none';
                    hiddenItemsCount++;
                }
            }
        });

        // If we've hidden all or most items, hide the entire shelf
        if (hiddenItemsCount > 0 && hiddenItemsCount >= items.length * 0.75) {
            shortsShelf.style.display = 'none';
        }
    }
}

// Set up MutationObserver to detect new videos being added
function setupObserver() {
    // Disconnect existing observer if it exists
    if (observer) {
        observer.disconnect();
    }

    // Create a new observer
    observer = new MutationObserver(mutations => {
        let shouldFilter = false;

        // Check if relevant nodes were added
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                shouldFilter = true;
            }
        });

        if (shouldFilter) {
            filterVideos();
        }
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Listen for changes to filter keywords
chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (changes.filterKeywords) {
        filterKeywords = changes.filterKeywords.newValue;
        filterVideos();
    }
});

// Re-filter when navigating within YouTube (it's a single-page application)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(filterVideos, 1000); // Delay to allow page content to load
    }
}).observe(document, { subtree: true, childList: true });

// Set up periodic checking to catch new content
setInterval(filterVideos, 3000);

// Initial load
loadKeywords();