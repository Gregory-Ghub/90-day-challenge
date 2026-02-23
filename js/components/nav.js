const tabs = [
  {
    id: 'home',
    label: 'Home',
    hash: '#/home',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>`
  },
  {
    id: 'log',
    label: 'Log',
    hash: '#/log',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>`
  },
  {
    id: 'history',
    label: 'History',
    hash: '#/history',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>`
  },
  {
    id: 'templates',
    label: 'Templates',
    hash: '#/templates',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="9" y1="21" x2="9" y2="9"/>
    </svg>`
  }
];

export function renderNav(activeTab) {
  const nav = document.getElementById('bottom-nav');
  nav.innerHTML = tabs.map(tab => `
    <button class="nav-tab ${activeTab === tab.id ? 'active' : ''}" data-hash="${tab.hash}">
      ${tab.icon}
      <span>${tab.label}</span>
    </button>
  `).join('');

  nav.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = btn.dataset.hash;
    });
  });
}
