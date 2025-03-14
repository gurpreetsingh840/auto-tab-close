let countdownInterval;
let timerStarted = false;
let currentTabId = null;

// Get current tab ID when script loads
chrome.runtime.sendMessage({ action: 'getTabId' }, (tabId) => {
    currentTabId = tabId;
});

function createPopup(seconds) {
    const popup = document.createElement('div');
    popup.id = 'auto-close-popup';
    popup.innerHTML = `
        <div class="countdown">Tab will close in <span id="timer">${seconds}</span>s</div>
        <div class="controls">
            <button id="closeNow">Close Now</button>
            <button id="cancelClose">Cancel</button>
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
