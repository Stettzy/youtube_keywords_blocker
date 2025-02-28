document.addEventListener('DOMContentLoaded', function () {
    // Load saved keywords
    chrome.storage.sync.get('filterKeywords', function (data) {
        if (data.filterKeywords) {
            document.getElementById('keywords').value = data.filterKeywords.join('\n');
        }
    });

    // Function to save keywords and apply filter immediately
    function saveAndApplyFilters() {
        const keywordsText = document.getElementById('keywords').value;
        const keywordsArray = keywordsText.split('\n')
            .map(keyword => keyword.trim())
            .filter(keyword => keyword !== '');

        chrome.storage.sync.set({
            'filterKeywords': keywordsArray
        }, function () {
            const status = document.getElementById('status');
            status.style.opacity = '1';

            // Send message to the content script to apply filters immediately
            chrome.tabs.query({ url: "*://*.youtube.com/*" }, function (tabs) {
                tabs.forEach(function (tab) {
                    chrome.tabs.sendMessage(tab.id, { action: "applyFilters" });
                });
            });

            setTimeout(function () {
                status.style.opacity = '0';
            }, 2000);
        });
    }

    // Save keywords on button click
    document.getElementById('save').addEventListener('click', saveAndApplyFilters);

    // Also save on Enter key press
    document.getElementById('keywords').addEventListener('keydown', function (e) {
        // If Enter is pressed without Shift key (Shift+Enter allows for new lines)
        if (e.key === 'Enter') {
            // Wait for the new line to be added, then save
            setTimeout(() => {
                // Save the keywords after the new line is added
                saveAndApplyFilters();
            }, 10);
        }
    });

    // Clear all keywords
    document.getElementById('clear').addEventListener('click', function () {
        document.getElementById('keywords').value = '';
        chrome.storage.sync.set({
            'filterKeywords': []
        }, function () {
            const status = document.getElementById('status');
            status.textContent = 'All keywords cleared!';
            status.style.opacity = '1';

            // Send message to the content script to apply filters immediately
            chrome.tabs.query({ url: "*://*.youtube.com/*" }, function (tabs) {
                tabs.forEach(function (tab) {
                    chrome.tabs.sendMessage(tab.id, { action: "applyFilters" });
                });
            });

            setTimeout(function () {
                status.textContent = 'Settings saved!';
                status.style.opacity = '0';
            }, 2000);
        });
    });
});