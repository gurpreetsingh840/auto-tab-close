// Track the state of the countdown
let countdownInterval;
let timerStarted = false;
let currentTabId = null;
let countdownElement = null;

// Get current tab ID when script loads
chrome.runtime.sendMessage({ action: 'getTabId' }, (tabId) => {
    currentTabId = tabId;
});

/**
 * Creates and displays countdown popup with close controls
 * @param {number} seconds - Seconds until auto-close
 */
function createPopup(seconds) {
    const popup = document.createElement('div');
    popup.id = 'auto-close-popup';
    popup.className = 'atc-popup';
    popup.innerHTML = `
        <div class="atc-countdown">Tab will close in <span id="timer">${seconds}</span>s</div>
        <div class="atc-controls">
            <button id="closeNow" class="atc-close-now">Close Now</button>
            <button id="cancelClose" class="atc-cancel">Cancel</button>
        </div>
    `;
    document.body.appendChild(popup);

    let timeLeft = seconds;
    countdownInterval = setInterval(() => {
        timeLeft--;
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                chrome.runtime.sendMessage({ action: 'closeTab', tabId: currentTabId });
                popup.remove();
            }
        }
    }, 1000);

    document.getElementById('closeNow').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'getTabId' }, (tabId) => {
            chrome.runtime.sendMessage({ action: 'closeTab', tabId });
        });
    });

    document.getElementById('cancelClose').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'getTabId' }, (tabId) => {
            chrome.runtime.sendMessage({ action: 'cancelTimer', tabId });
            popup.remove();
            clearInterval(countdownInterval);
            timerStarted = false;
        });
    });
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'startCountdown' && !timerStarted) {
        timerStarted = true;
        createPopup(message.seconds);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startCountdown') {
        showCountdown(message.seconds);
    }
});

/**
 * Displays countdown UI without creating new elements
 * @param {number} seconds - Seconds remaining
 */
function showCountdown(seconds) {
    updateCountdown(seconds);
}

/**
 * Updates the countdown display
 * @param {number} seconds - Seconds remaining
 */
function updateCountdown(seconds) {
    if (countdownElement) {
        countdownElement.textContent = `Tab will close in ${seconds} seconds`;
    }
}
