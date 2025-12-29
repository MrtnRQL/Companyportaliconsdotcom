// Application data
const apps = [
    {
        name: "Google Chrome",
        slug: "chrome",
        category: "Browsers",
        source: "github",
        iconUrl: "https://raw.githubusercontent.com/aaronparker/icons/main/companyportal/GoogleChrome.png",
        downloadUrl: "https://raw.githubusercontent.com/aaronparker/icons/main/companyportal/GoogleChrome.png"
    },
    {
        name: "Mozilla Firefox",
        slug: "firefox",
        category: "Browsers",
        source: "github",
        iconUrl: "https://raw.githubusercontent.com/aaronparker/icons/main/companyportal/MozillaFirefox.png",
        downloadUrl: "https://raw.githubusercontent.com/aaronparker/icons/main/companyportal/MozillaFirefox.png"
    },
    {
        name: "Visual Studio Code",
        slug: "vscode",
        category: "Dev Tools",
        source: "github",
        iconUrl: "https://raw.githubusercontent.com/aaronparker/icons/main/companyportal/MicrosoftVisualStudioCode.png",
        downloadUrl: "https://raw.githubusercontent.com/aaronparker/icons/main/companyportal/MicrosoftVisualStudioCode.png"
    },
    {
        name: "Microsoft Visio",
        slug: "visio",
        category: "Microsoft",
        source: "github",
        iconUrl: "https://raw.githubusercontent.com/aaronparker/icons/main/companyportal/MicrosoftVisio.png",
        downloadUrl: "https://raw.githubusercontent.com/aaronparker/icons/main/companyportal/MicrosoftVisio.png"
    },
    {
        name: "Microsoft Word",
        slug: "word",
        category: "Microsoft",
        source: "github",
        iconUrl: "https://raw.githubusercontent.com/aaronparker/icons/main/companyportal/MicrosoftWord.png",
        downloadUrl: "https://raw.githubusercontent.com/aaronparker/icons/main/companyportal/MicrosoftWord.png"
    },
    {
        name: "Microsoft Outlook",
        slug: "outlook",
        category: "Microsoft",
        source: "github",
        iconUrl: "https://raw.githubusercontent.com/aaronparker/icons/main/companyportal/MicrosoftOutlook.png",
        downloadUrl: "https://raw.githubusercontent.com/aaronparker/icons/main/companyportal/MicrosoftOutlook.png"
    },
    {
        name: "Microsoft Teams",
        slug: "teams",
        category: "Communication",
        source: "github",
        iconUrl: "https://raw.githubusercontent.com/aaronparker/icons/main/companyportal/MicrosoftTeams.png",
        downloadUrl: "https://raw.githubusercontent.com/aaronparker/icons/main/companyportal/MicrosoftTeams.png"
    }
];

let filteredApps = [...apps];
let currentCategory = 'all';
let currentApp = null;

// Initialize
function init() {
    renderIcons();
    updateStats();
    setupEventListeners();
}

// Render icons
function renderIcons() {
    const grid = document.getElementById('iconGrid');
    
    if (filteredApps.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p>No icons found</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredApps.map((app, index) => `
        <div class="icon-card">
            <div class="icon-image">
                <img src="${app.iconUrl}" alt="${app.name}" loading="lazy">
            </div>
            <div class="icon-name">${app.name}</div>
            <div class="icon-category">${app.category}</div>
            <span class="icon-source source-${app.source}">${app.source === 'github' ? 'GitHub' : 'Chocolatey'}</span>
            <div class="icon-actions">
                <button class="icon-btn preview-btn" onclick="previewIcon(${index})">👁️</button>
                <button class="icon-btn download-btn" onclick="downloadIcon(${index})">⬇️</button>
            </div>
        </div>
    `).join('');
}

// Filter icons
function filterIcons() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    
    filteredApps = apps.filter(app => {
        const matchesSearch = !search || app.name.toLowerCase().includes(search) || app.slug.toLowerCase().includes(search);
        const matchesCategory = currentCategory === 'all' || app.category === currentCategory;
        return matchesSearch && matchesCategory;
    });

    renderIcons();
    updateStats();
}

// Filter by category
function filterCategory(category) {
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    filterIcons();
}

// Update statistics
function updateStats() {
    document.getElementById('totalIcons').textContent = apps.length;
    document.getElementById('filteredIcons').textContent = filteredApps.length;
    const categories = [...new Set(apps.map(app => app.category))];
    document.getElementById('categoryCount').textContent = categories.length;
}

// Preview icon
function previewIcon(index) {
    currentApp = filteredApps[index];
    document.getElementById('modalTitle').textContent = currentApp.name;
    document.getElementById('previewName').textContent = currentApp.name;
    document.getElementById('previewSource').textContent = currentApp.source === 'github' ? 'GitHub' : 'Chocolatey';
    document.getElementById('previewImg').src = currentApp.iconUrl;
    document.getElementById('previewModal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('previewModal').classList.remove('active');
}

// Download icon
function downloadIcon(index) {
    const app = filteredApps[index];
    const link = document.createElement('a');
    link.href = app.downloadUrl;
    link.download = `${app.slug}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download from modal
function downloadFromModal() {
    if (currentApp) {
        const link = document.createElement('a');
        link.href = currentApp.downloadUrl;
        link.download = `${currentApp.slug}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', filterIcons);
    
    // Close modal on outside click
    document.getElementById('previewModal').addEventListener('click', (e) => {
        if (e.target.id === 'previewModal') {
            closeModal();
        }
    });
    
    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('previewModal').classList.contains('active')) {
            closeModal();
        }
    });
}

// Initialize app
init();
