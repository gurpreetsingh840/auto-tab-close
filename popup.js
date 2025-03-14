const defaultRules = [
    // Example test URLs:
    // https://zoom.us/j/123456789
    // https://zoom.us/j/987654321?pwd=xxxxx
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
});

function renderRules() {
    const container = document.getElementById('rules');
    container.innerHTML = rules.map((rule, index) => `
    <div class="rule">
      <input type="text" value="${rule.pattern}" placeholder="URL pattern" data-index="${index}" class="pattern">
      <input type="number" value="${rule.seconds}" min="1" data-index="${index}" class="seconds">
      <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-index="${index}" class="enabled">
      <button onclick="deleteRule(${index})">Delete</button>
    </div>
  `).join('');
}

function addNewRule() {
    rules.push({ pattern: "", seconds: 5, enabled: true });
    renderRules();
}

function deleteRule(index) {
    rules.splice(index, 1);
    renderRules();
}

async function saveRules() {
    const patterns = [...document.getElementsByClassName('pattern')];
    const seconds = [...document.getElementsByClassName('seconds')];
    const enabled = [...document.getElementsByClassName('enabled')];

    rules = patterns.map((p, i) => ({
        pattern: p.value,
        seconds: parseInt(seconds[i].value),
        enabled: enabled[i].checked
    }));

    await chrome.storage.sync.set({ rules });
    alert('Rules saved!');
}
