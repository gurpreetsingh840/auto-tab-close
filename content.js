let timerElement = null;
let countdown = null;
let currentTabId = null;
let countdownInterval;

// Get current tab ID when script loads
chrome.runtime.sendMessage({ action: 'getTabId' }, (tabId) => {
    currentTabId = tabId;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startTimer' && message.tabId === currentTabId) {
        startTimer(message.seconds);
    }
    if (message.action === 'startCountdown') {
        createPopup(message.seconds);
    }
});

function startTimer(seconds) {
    if (timerElement) return;

    timerElement = document.createElement('div');
    timerElement.className = 'auto-close-timer';
    timerElement.innerHTML = `
    <span class="timer">Closing in ${seconds}s</span>
    <button class="close-now">Close Now</button>
    <button class="cancel">Cancel</button>
  `;

    document.body.appendChild(timerElement);

    let timeLeft = seconds;
    countdown = setInterval(() => {
        timeLeft--;
        timerElement.querySelector('.timer').textContent = `Closing in ${timeLeft}s`;

        if (timeLeft <= 0) {
            chrome.runtime.sendMessage({ action: 'closeTab', tabId: currentTabId });
        }
    }, 1000);

    timerElement.querySelector('.close-now').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'closeTab', tabId: currentTabId });
    });

    timerElement.querySelector('.cancel').addEventListener('click', () => {
        clearInterval(countdown);
        timerElement.remove();
        timerElement = null;
        chrome.runtime.sendMessage({ action: 'cancelTimer', tabId: currentTabId });
    });
}

function createPopup(seconds) {
    // Remove any existing popup first
    const existingPopup = document.getElementById('auto-close-popup');
    if (existingPopup) {
        existingPopup.remove();
        clearInterval(countdownInterval);
    }

    const popup = document.createElement('div');
    popup.id = 'auto-close-popup';
    popup.innerHTML = `
        <div class="countdown">Closing in <span id="timer">${seconds}</span>s</div>
        <button id="closeNow">Close Now</button>
        <button id="cancelClose">Cancel</button>
    `;
    document.body.appendChild(popup);

    let timeLeft = seconds;
    countdownInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;
        if (timeLeft <= 0) clearInterval(countdownInterval);
    }, 1000);

    document.getElementById('closeNow').addEventListener('click', async () => {
        const tabId = await chrome.runtime.sendMessage({ action: 'getTabId' });
        chrome.runtime.sendMessage({ action: 'closeTab', tabId });
    });

    document.getElementById('cancelClose').addEventListener('click', async () => {
        const tabId = await chrome.runtime.sendMessage({ action: 'getTabId' });
        await chrome.runtime.sendMessage({ action: 'cancelTimer', tabId });
        popup.remove();
        clearInterval(countdownInterval);
        countdownInterval = null;
    });
}
