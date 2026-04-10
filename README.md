# Company Portal Icons

**[companyportalicons.com](https://companyportalicons.com)** — Free, high-quality PNG icons for Microsoft Intune Company Portal applications.

Browse 260+ icons, preview how they look in Company Portal, and either download them or send them directly to Intune with one click.

## Features

- **260+ curated icons** across 16 categories
- **Real-time search** and category filtering
- **Live Company Portal preview** — see how the icon looks on a device
- **Send to Intune** — apply icons directly to your Intune apps without downloading


## Send to Intune

Send icons directly from the website to your Microsoft Intune tenant — no downloading, no re-uploading.

### How it works

1. Click **"Sign in to Intune"** in the header
2. Sign in with your Microsoft work account
3. A **"Send to Intune"** button appears on every icon card
4. Click it — the app picker opens with your Intune apps pre-searched
5. Click **"Apply Icon"** — done. The icon is updated in Intune.

### Technical details

- Uses **MSAL.js v2** (Microsoft Authentication Library) for OAuth2 authentication
- Calls **Microsoft Graph Beta API** to update app icons
- Runs entirely in the browser — no data passes through any third-party server
- Multi-tenant App Registration — works for any Microsoft 365 organization
- Requires `DeviceManagementApps.ReadWrite.All` (delegated) permission



### Supported Intune app types

- Win32 Apps (.intunewin)
- WinGet Apps
- Web Apps
- MSI Apps
- Microsoft 365 Apps
- Universal AppX/MSIX

### Security and privacy

- **No backend server** — authentication and API calls happen directly between your browser and Microsoft
- **Session-only tokens** — stored in sessionStorage, cleared when the tab closes
- **Minimal permissions** — only requests what is needed to update app icons
- **Client ID is public by design** — this is standard for SPA (Single Page Application) OAuth2 flows



## Categories

| Category | Count | Examples |
|----------|-------|----------|
| Browsers | 8 | Chrome, Edge, Firefox, Brave |
| Communication | 12 | Teams, Zoom, Slack, Discord |
| Microsoft Office | 5 | Outlook, 365 Apps |
| Microsoft | 45 | OneDrive, PowerToys, VS Code |
| Dev Tools | 7 | Git, VS Code, GitHub Desktop |
| Media & Graphics | 14 | VLC, Spotify, GIMP |
| Business | 12 | QuickBooks, Nitro PDF, LibreOffice |
| Security | 4 | Malwarebytes, Fortinet |
| Remote Access | 5 | TeamViewer, AnyDesk, Citrix |
| Utilities | 18 | 7-Zip, Notepad++, Everything |
| Hardware/Drivers | 5 | Jabra, Logitech, NVIDIA |
| Runtimes | 2 | .NET, Visual C++ |
| Adobe | 12 | Acrobat, Photoshop, Illustrator |
| Cloud Storage | 3 | Dropbox, Box, Google Drive |
| Printing | 3 | HP Smart, Canon, Epson |
| Backup | 2 | Veeam, Acronis |

## Usage

1. Visit [companyportalicons.com](https://companyportalicons.com)
2. Search or browse for your app
3. Click **"Preview"** to see how it looks in Company Portal
4. Click **"Download"** to get the PNG file, or **"Send to Intune"** to apply it directly



- **[Intune Documentation Generator](https://mrtnrql.github.io/intune-doc-generator/)** — Generate documentation for your Intune environment

## Credits

- **[Aaron Parker](https://github.com/aaronparker/icons)** — For creating and maintaining the foundational icon collection (MIT licensed)
- **Microsoft Intune Community** — For continuous feedback and support
- All vendors who provide official icons for their applications

## License

MIT — See [LICENSE](LICENSE) for details.

---

**Author:** [@MrtnRQL](https://github.com/MrtnRQL)

**Made with ❤️ for the Intune community**

*"A Company Portal without icons is like pizza without cheese — a tragedy that should never happen"*  
— Unknown IT Legend

**Website:** [companyportalicons.com](https://companyportalicons.com)