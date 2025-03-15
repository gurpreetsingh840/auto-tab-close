const defaultRules = [
    { pattern: "zoom.us/j/", seconds: 5, enabled: true },
    { pattern: "teams.microsoft.com/meet", seconds: 5, enabled: true },
    { pattern: "vpn.", seconds: 5, enabled: true },
    { pattern: "webex.com/meet/", seconds: 5, enabled: true },
    { pattern: "gotomeeting.com/join/", seconds: 5, enabled: true }
];

let rules = [];

document.addEventListener('DOMContentLoaded', async () => {
    const stored = await chrome.storage.sync.get('rules');
    rules = stored.rules || defaultRules;
    renderRules();

    document.getElementById('addRule').addEventListener('click', addNewRule);
    document.getElementById('saveRules').addEventListener('click', saveRules);

    // Add event delegation for delete buttons
    document.getElementById('rules').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const index = parseInt(e.target.dataset.index);
            rules.splice(index, 1);
            renderRules();
        }
    });
});

function validateRule(pattern, seconds) {
    if (!pattern.trim()) {
        return "Domain pattern cannot be empty";
    }
    if (seconds <= 0) {
        return "Inactivity time must be greater than 0";
    }
    return null;
}

function renderRules() {
    const container = document.getElementById('rules');
    container.innerHTML = rules.map((rule, index) => `
        <div class="rule">
            <div class="form-group">
                <label>Domain Pattern</label>
                <input type="text" value="${rule.pattern}" 
                    placeholder="e.g., *.example.com" 
                    data-index="${index}" 
                    class="pattern${rule.error ? ' error' : ''}">
                ${rule.error ? `<div class="error-message">${rule.error}</div>` : ''}
            </div>
            <div class="form-group">
                <label>Close After (seconds)</label>
                <input type="number" value="${rule.seconds}" min="1" data-index="${index}" class="seconds">
            </div>
            <div class="checkbox-group">
                <input type="checkbox" id="enabled-${index}" ${rule.enabled ? 'checked' : ''} data-index="${index}" class="enabled">
                <label for="enabled-${index}">Enable auto-close for this rule</label>
            </div>
            <button class="delete-btn" data-index="${index}">Delete Rule</button>
        </div>
    `).join('');
}

function addNewRule() {
    rules.push({ pattern: "", seconds: 300, enabled: true });
    renderRules();
}

async function saveRules() {
    const patterns = [...document.getElementsByClassName('pattern')];
    const seconds = [...document.getElementsByClassName('seconds')];
    const enabled = [...document.getElementsByClassName('enabled')];

    let hasErrors = false;
    const newRules = patterns.map((p, i) => {
        const pattern = p.value;
        const secondsValue = Math.floor(parseFloat(seconds[i].value));
        const error = validateRule(pattern, secondsValue);
        if (error) {
            hasErrors = true;
        }
        return {
            pattern,
            seconds: secondsValue,
            enabled: enabled[i].checked,
            error
        };
    });

    if (hasErrors) {
        rules = newRules;
        renderRules();
        return;
    }

    // Remove error properties and save
    rules = newRules.map(({ pattern, seconds, enabled }) => ({ pattern, seconds, enabled }));
    await chrome.storage.sync.set({ rules });
    alert('Rules saved!');
    renderRules(); // Re-render to clear any remaining error states
}
