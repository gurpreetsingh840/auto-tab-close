// Track active timers and rules
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

// Monitor tab updates with protocol handler detection
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        for (const rule of rules) {
            if (!rule.enabled) continue;

            if (tab.url.includes(rule.pattern)) {
                console.log(`Match found for pattern: ${rule.pattern}`);
                // Simple delay before starting timer
                setTimeout(() => startTimer(tabId, rule.seconds), 2000);
                break;
            }
        }
    }
});

/**
 * Starts a countdown timer for a tab
 * @param {number} tabId - ID of tab to close
 * @param {number} seconds - Seconds until close
 */
function startTimer(tabId, seconds) {
    if (activeTimers.has(tabId)) return;

    // Create close timer
    const timer = setTimeout(() => {
        chrome.tabs.remove(tabId).catch(() => {
            // Tab already gone, cleanup
        }).finally(() => {
            activeTimers.delete(tabId);
        });
    }, seconds * 1000);

    activeTimers.set(tabId, timer);

    // Initialize countdown UI
    chrome.tabs.sendMessage(tabId, {
        action: 'startCountdown',
        seconds: seconds
    }).catch(async (err) => {
        try {
            // Retry content script injection if failed
            const [tab] = await Promise.all([
                chrome.tabs.get(tabId),
                chrome.permissions.contains({ permissions: ['scripting'] })
            ]);

            if (!tab) throw new Error('Tab not found');

            // Inject required scripts and retry
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            });
            await chrome.scripting.insertCSS({
                target: { tabId: tabId },
                files: ['content.css']
            });
            await chrome.tabs.sendMessage(tabId, {
                action: 'startCountdown',
                seconds: seconds
            });
        } catch (e) {
            console.log('Failed to inject content script:', e);
        }
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getTabId') {
        sendResponse(sender.tab.id);
        return true;
    }

    if (message.action === 'closeTab') {
        const tabId = message.tabId || sender.tab.id;
        chrome.tabs.remove(tabId).catch(() => {
            // Silent catch for missing tab
        }).finally(() => {
            activeTimers.delete(tabId);
        });
        return;
    }

    if (message.action === 'cancelTimer' && activeTimers.has(message.tabId)) {
        clearTimeout(activeTimers.get(message.tabId)); // Clear the timeout
        activeTimers.delete(message.tabId);
    }

    if (message.action === 'startTimer' && activeTimers.has(message.tabId)) {
        const timer = setTimeout(() => {
            chrome.tabs.remove(message.tabId).catch(() => {
                // Tab already gone, just cleanup
            }).finally(() => {
                activeTimers.delete(message.tabId);
            });
        }, message.seconds * 1000);
        activeTimers.set(message.tabId, timer);
    }
});

// Cleanup when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
    activeTimers.delete(tabId);
});
