// Default rules definition
const defaultRules = [
    { pattern: "zoom.us/j/", seconds: 10, enabled: true },
    { pattern: "teams.microsoft.com/meet", seconds: 10, enabled: true },
    { pattern: "webex.com/meet/", seconds: 10, enabled: true },
    { pattern: "gotomeeting.com/join/", seconds: 10, enabled: true }
];

let rules = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const stored = await chrome.storage.sync.get('rules');
        rules = stored.rules || defaultRules;
        console.log('Loaded rules:', rules); // Debug log
        renderRules();
    } catch (error) {
        console.error('Failed to load rules:', error);
        document.getElementById('rulesBody').innerHTML =
            '<tr><td colspan="4">Error loading rules. Please refresh.</td></tr>';
    }

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

/**
 * Validates a rule's pattern and seconds
 * @param {string} pattern - URL pattern to match
 * @param {number} seconds - Inactivity time before closing
 * @returns {string|null} Error message or null if valid
 */
function validateRule(pattern, seconds) {
    if (!pattern.trim()) {
        return "Domain pattern cannot be empty";
    }
    if (seconds <= 0) {
        return "Inactivity time must be greater than 0";
    }
    return null;
}

/**
 * Renders the list of rules in the popup
 */
function renderRules() {
    const container = document.getElementById('rulesBody');
    container.innerHTML = rules.map((rule, index) => `
        <tr>
            <td>
                <input type="text" value="${rule.pattern}" 
                    placeholder="e.g., *.example.com" 
                    data-index="${index}" 
                    class="pattern${rule.error ? ' error' : ''}">
                ${rule.error ? `<span class="error-message">${rule.error}</span>` : ''}
            </td>
            <td>
                <input type="number" value="${rule.seconds}" min="1" data-index="${index}" class="seconds">
            </td>
            <td>
                <input type="checkbox" id="enabled-${index}" ${rule.enabled ? 'checked' : ''} data-index="${index}" class="enabled">
            </td>
            <td>
                <button class="delete-btn" data-index="${index}">Delete</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Adds a new empty rule to the list
 */
function addNewRule() {
    rules.push({ pattern: "", seconds: 10, enabled: true });
    renderRules();
}

/**
 * Saves rules to chrome storage after validation
 */
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
