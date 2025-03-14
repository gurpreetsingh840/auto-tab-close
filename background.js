let activeTimers = new Map();
let rules = [];

// Load rules when extension starts
chrome.storage.sync.get('rules', (data) => {
    rules = data.rules || [];
    console.log('Loaded rules:', rules);
});

// Listen for rule updates
chrome.storage.onChanged.addListener((changes) => {
    if (changes.rules) {
        rules = changes.rules.newValue;
        console.log('Rules updated:', rules);
    }
});

// Monitor tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        console.log('Checking tab:', tab.url);

        for (const rule of rules) {
            if (!rule.enabled) continue;

            if (tab.url.includes(rule.pattern)) {
                console.log(`Match found for pattern: ${rule.pattern}`);
                console.log(`Will close in ${rule.seconds} seconds`);

                // Try to send message to content script with retry
                try {
                    await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay to ensure content script is ready
                    await chrome.tabs.sendMessage(tabId, {
                        action: 'startCountdown',
                        seconds: rule.seconds
                    }).catch(async (err) => {
                        console.log('Retrying content script injection...');
                        // If content script isn't ready, inject it manually
                        await chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['content.js']
                        });
                        await chrome.scripting.insertCSS({
                            target: { tabId: tabId },
                            files: ['content.css']
                        });
                        // Try sending message again after injection
                        await chrome.tabs.sendMessage(tabId, {
                            action: 'startCountdown',
                            seconds: rule.seconds
                        });
                    });
                } catch (error) {
                    console.error('Failed to initialize countdown:', error);
                }

                const timer = setTimeout(() => {
                    chrome.tabs.remove(tabId, () => {
                        console.log(`Tab ${tabId} closed`);
                        activeTimers.delete(tabId);
                    });
                }, rule.seconds * 1000);

                activeTimers.set(tabId, timer);
                break;
            }
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getTabId') {
        sendResponse(sender.tab.id);
        return true;
    }

    if (message.action === 'closeTab' && activeTimers.has(message.tabId)) {
        chrome.tabs.remove(message.tabId);
        activeTimers.delete(message.tabId);
    }

    if (message.action === 'cancelTimer' && activeTimers.has(message.tabId)) {
        clearTimeout(activeTimers.get(message.tabId)); // Clear the timeout
        activeTimers.delete(message.tabId);
    }
});

// Cleanup when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
    activeTimers.delete(tabId);
});
