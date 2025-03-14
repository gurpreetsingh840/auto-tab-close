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
        console.log('Checking tab:', tab.url);

        for (const rule of rules) {
            if (!rule.enabled) continue;

            if (tab.url.includes(rule.pattern)) {
                console.log(`Match found for pattern: ${rule.pattern}`);

                try {
                    // Check if it's a protocol handler page
                    const [{ result }] = await chrome.scripting.executeScript({
                        target: { tabId },
                        func: () => {
                            return {
                                hasProtocol: !!document.querySelector('[href^="zoommtg://"], [href^="msteams://"], [href^="webex://"]'),
                                hasDirectLink: !!document.querySelector('a[href*="launch"], a[href*="start"], form[action*="/join"]')
                            };
                        }
                    });

                    if (result.hasProtocol) {
                        // Protocol handler found, wait for click
                        console.log('Protocol handler found, waiting for launch...');
                        await chrome.scripting.executeScript({
                            target: { tabId },
                            func: () => {
                                document.addEventListener('click', (e) => {
                                    if (e.target.closest('[href^="zoommtg://"], [href^="msteams://"], [href^="webex://"]')) {
                                        chrome.runtime.sendMessage({ action: 'protocolLaunched' });
                                    }
                                }, true);
                            }
                        });

                        // Set up one-time listener for protocol launch
                        const handleLaunch = (message) => {
                            if (message.action === 'protocolLaunched') {
                                console.log('Protocol launched, starting timer...');
                                setTimeout(() => startTimer(tabId, rule.seconds), 2000);
                                chrome.runtime.onMessage.removeListener(handleLaunch);
                            }
                        };
                        chrome.runtime.onMessage.addListener(handleLaunch);
                    } else {
                        // No protocol handler, start timer with delay
                        console.log('No protocol handler, starting timer with delay...');
                        setTimeout(() => startTimer(tabId, rule.seconds), 5000);
                    }
                } catch (error) {
                    console.error('Failed to setup handlers:', error);
                }
                break;
            }
        }
    }
});

function startTimer(tabId, seconds) {
    if (activeTimers.has(tabId)) return;

    chrome.tabs.sendMessage(tabId, {
        action: 'startCountdown',
        seconds: seconds
    }).catch(async (err) => {
        console.log('Retrying content script injection...');
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
    });

    const timer = setTimeout(() => {
        chrome.tabs.remove(tabId);
        activeTimers.delete(tabId);
    }, seconds * 1000);

    activeTimers.set(tabId, timer);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getTabId') {
        sendResponse(sender.tab.id);
        return true;
    }

    if (message.action === 'closeTab') {
        const tabId = message.tabId || sender.tab.id;
        chrome.tabs.remove(tabId, () => {
            // ignore if any error occurs while closing the tab
            activeTimers.delete(tabId);
        });
    }

    if (message.action === 'cancelTimer' && activeTimers.has(message.tabId)) {
        clearTimeout(activeTimers.get(message.tabId)); // Clear the timeout
        activeTimers.delete(message.tabId);
    }

    if (message.action === 'startTimer' && activeTimers.has(message.tabId)) {
        const timer = setTimeout(() => {
            chrome.tabs.remove(message.tabId);
            activeTimers.delete(message.tabId);
        }, message.seconds * 1000);
        activeTimers.set(message.tabId, timer);
    }
});

// Cleanup when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
    activeTimers.delete(tabId);
});
