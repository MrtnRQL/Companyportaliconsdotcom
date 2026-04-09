// ============================================================
//  Company Portal Icons — Intune Direct Integration
//  intune-integration.js
// ============================================================
//  Uses MSAL.js v2 + Microsoft Graph Beta API
//  to send icons directly to Intune without downloading.
// ============================================================

const IntuneIntegration = (() => {
  "use strict";

  // ── Configuration ─────────────────────────────────────────
  const CONFIG = {
    clientId: "a8a317ff-0d2c-44f0-9a7f-4fa5422cadca",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin,
    popupRedirectUri: window.location.origin + "/auth/popup.html",
    scopes: ["https://graph.microsoft.com/DeviceManagementApps.ReadWrite.All"],
    graphBase: "https://graph.microsoft.com/beta",
  };

  let msalInstance = null;
  let currentAccount = null;

  // ── Initialize MSAL ──────────────────────────────────────
  function init() {
    if (typeof msal === "undefined") {
      console.error("[Intune] MSAL.js not loaded.");
      return;
    }

    const msalConfig = {
      auth: {
        clientId: CONFIG.clientId,
        authority: CONFIG.authority,
        redirectUri: CONFIG.redirectUri,
      },
      cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
      },
      system: {
        loggerOptions: {
          logLevel: msal.LogLevel.Warning,
          loggerCallback: (level, message) => {
            if (level === msal.LogLevel.Error) console.error("[MSAL]", message);
          },
        },
      },
    };

    msalInstance = new msal.PublicClientApplication(msalConfig);

    // Handle redirect response
    msalInstance.handleRedirectPromise()
      .then((response) => {
        if (response) {
          currentAccount = response.account;
          onAuthStateChanged(true);
        } else {
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            currentAccount = accounts[0];
            onAuthStateChanged(true);
          }
        }
      })
      .catch((error) => {
        console.error("[Intune] Redirect error:", error);
      });

    // Inject UI
    injectSignInButton();
    injectIntuneButtons();
    injectModal();

    console.log("[Intune] Integration initialized — redirectUri:", CONFIG.redirectUri);
  }

  // ── Authentication ───────────────────────────────────────
  async function signIn() {
    const btn = document.getElementById("intune-signin-btn");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="intune-spinner-sm"></span> Signing in...`;
    }

    try {
      // First: check if we already have an account and can get a token silently
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        try {
          const silentResponse = await msalInstance.acquireTokenSilent({
            scopes: CONFIG.scopes,
            account: accounts[0],
          });
          currentAccount = silentResponse.account;
          onAuthStateChanged(true);
          showToast(`Connected as ${currentAccount.username}`, "info");
          trackEvent("intune-signin", currentAccount.tenantId || "unknown");
          return true;
        } catch (silentError) {
          // Silent failed, continue to popup below
          console.log("[Intune] Silent sign-in failed, showing popup");
        }
      }

      // Second: interactive popup
      const loginResponse = await msalInstance.loginPopup({
        scopes: CONFIG.scopes,
        redirectUri: CONFIG.popupRedirectUri,
      });
      currentAccount = loginResponse.account;
      onAuthStateChanged(true);
      showToast(`Connected as ${currentAccount.username}`, "info");
      trackEvent("intune-signin", currentAccount.tenantId || "unknown");
      return true;
    } catch (error) {
      console.error("[Intune] Sign-in failed:", error);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Sign in to Intune
        `;
      }
      if (error.errorCode !== "user_cancelled") {
        showToast("Sign-in failed: " + (error.errorMessage || error.message), "error");
      }
      return false;
    }
  }

  async function signOut() {
    try {
      await msalInstance.logoutPopup({ account: currentAccount });
    } catch (e) {
      // Fallback: clear local state
    }
    currentAccount = null;
    onAuthStateChanged(false);
    showToast("Signed out from Intune", "info");
  }

  async function getAccessToken() {
    if (!currentAccount) throw new Error("Not signed in");

    const tokenRequest = {
      scopes: CONFIG.scopes,
      account: currentAccount,
    };

    try {
      const response = await msalInstance.acquireTokenSilent(tokenRequest);
      return response.accessToken;
    } catch (error) {
      console.warn("[Intune] Silent token failed, trying popup:", error);
      const response = await msalInstance.acquireTokenPopup({
        ...tokenRequest,
        redirectUri: CONFIG.popupRedirectUri,
      });
      return response.accessToken;
    }
  }

  function isAuthenticated() {
    return currentAccount !== null;
  }

  // ── UI State Management ──────────────────────────────────
  function onAuthStateChanged(authenticated) {
    const signInBtn = document.getElementById("intune-signin-btn");
    const userInfo = document.getElementById("intune-user-info");

    if (authenticated && currentAccount) {
      if (signInBtn) signInBtn.style.display = "none";
      if (userInfo) {
        userInfo.style.display = "flex";
        const nameEl = userInfo.querySelector(".intune-user-name");
        if (nameEl) nameEl.textContent = currentAccount.name || currentAccount.username;
        const emailEl = userInfo.querySelector(".intune-user-email");
        if (emailEl) emailEl.textContent = currentAccount.username;
      }
      document.querySelectorAll(".intune-send-btn").forEach((btn) => {
        btn.style.display = "inline-flex";
      });
    } else {
      if (signInBtn) {
        signInBtn.style.display = "inline-flex";
        signInBtn.disabled = false;
        signInBtn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Sign in to Intune
        `;
      }
      if (userInfo) userInfo.style.display = "none";
      document.querySelectorAll(".intune-send-btn").forEach((btn) => {
        btn.style.display = "none";
      });
    }
  }

  // ── Inject Sign-In Button ────────────────────────────────
  function injectSignInButton() {
    // Look for the header actions area
    const navRight =
      document.querySelector(".header-actions") ||
      document.querySelector("nav .space-x-4") ||
      document.querySelector("nav");
    if (!navRight) return;

    const signInBtn = document.createElement("button");
    signInBtn.id = "intune-signin-btn";
    signInBtn.className = "intune-header-btn";
    signInBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
      Sign in to Intune
    `;
    signInBtn.addEventListener("click", signIn);

    const userInfo = document.createElement("div");
    userInfo.id = "intune-user-info";
    userInfo.className = "intune-user-info";
    userInfo.style.display = "none";
    userInfo.innerHTML = `
      <div class="intune-user-badge">
        <span class="intune-dot-online"></span>
        <div>
          <div class="intune-user-name"></div>
          <div class="intune-user-email"></div>
        </div>
      </div>
      <button class="intune-signout-btn">Sign out</button>
    `;
    userInfo.querySelector(".intune-signout-btn").addEventListener("click", signOut);

    navRight.appendChild(signInBtn);
    navRight.appendChild(userInfo);
  }

  // ── Inject Send to Intune Buttons ────────────────────────
  function injectIntuneButtons() {
    addButtonsToCards();
    const observer = new MutationObserver(() => addButtonsToCards());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function addButtonsToCards() {
    // Find icon cards directly — more reliable than looking for download buttons
    const cards = document.querySelectorAll(".icon-card, .card, [data-app]");

    cards.forEach((card) => {
      if (card.querySelector(".intune-send-btn")) return;

      // Find the download button to extract icon info
      const downloadBtn = card.querySelector(
        'a[download], button[data-action="download"], .download-btn, [onclick*="download"], [onclick*="Download"]'
      );
      if (!downloadBtn) return;

      const intuneBtn = document.createElement("button");
      intuneBtn.className = "intune-send-btn";
      intuneBtn.style.display = isAuthenticated() ? "inline-flex" : "none";
      intuneBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
        </svg>
        Send to Intune
      `;

      const iconUrl = getIconUrl(downloadBtn);
      const iconName = getIconName(downloadBtn);

      intuneBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openAppPicker(iconUrl, iconName);
      });

      // Always append to the card itself — this ensures it goes below everything
      card.appendChild(intuneBtn);
    });
  }

  function getIconUrl(btn) {
    if (btn.href) return btn.href;
    if (btn.dataset.iconUrl) return btn.dataset.iconUrl;
    const onclick = btn.getAttribute("onclick") || "";
    const urlMatch = onclick.match(/['"]([^'"]*\.png)['"]/i);
    if (urlMatch) return urlMatch[1];
    const card = btn.closest(".icon-card, .card, [data-app], .app-card");
    if (card) {
      const img = card.querySelector("img");
      if (img) return img.src;
    }
    return null;
  }

  function getIconName(btn) {
    const card = btn.closest(".icon-card, .card, [data-app], .app-card");
    if (card) {
      const nameEl = card.querySelector("h3, h4, .app-name, .icon-name, .card-title");
      if (nameEl) return nameEl.textContent.trim();
      if (card.dataset.app) return card.dataset.app;
      if (card.dataset.name) return card.dataset.name;
    }
    return "";
  }

  // ── App Picker Modal ─────────────────────────────────────
  function injectModal() {
    const modal = document.createElement("div");
    modal.id = "intune-modal-overlay";
    modal.className = "intune-modal-overlay";
    modal.innerHTML = `
      <div class="intune-modal">
        <div class="intune-modal-header">
          <div class="intune-modal-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
            </svg>
            Send to Intune
          </div>
          <button class="intune-modal-close" id="intune-modal-close">&times;</button>
        </div>
        <div class="intune-modal-body">
          <div class="intune-modal-preview" id="intune-modal-preview">
            <img id="intune-preview-img" src="" alt="Icon preview" />
            <div>
              <div id="intune-preview-name" class="intune-preview-name"></div>
              <div class="intune-preview-sub">PNG icon — ready to send</div>
            </div>
          </div>
          <div class="intune-search-row">
            <input type="text" id="intune-app-search" placeholder="Search Intune apps..." class="intune-search-input" />
            <button class="intune-btn intune-btn-search" id="intune-search-go">Search</button>
          </div>
          <div class="intune-app-list" id="intune-app-list">
            <div class="intune-empty">Search for an app to apply the icon to</div>
          </div>
          <div class="intune-status" id="intune-status" style="display:none;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("intune-modal-close").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

    document.getElementById("intune-search-go").addEventListener("click", () => searchApps());
    document.getElementById("intune-app-search").addEventListener("keydown", (e) => {
      if (e.key === "Enter") searchApps();
    });
  }

  let currentIconUrl = null;

  function openAppPicker(iconUrl, iconName) {
    if (!iconUrl) {
      showToast("Could not find the icon URL", "error");
      return;
    }

    currentIconUrl = iconUrl;
    const cleanedName = cleanIconName(iconName);
    document.getElementById("intune-preview-img").src = iconUrl;
    document.getElementById("intune-preview-name").textContent = cleanedName || "Selected icon";
    document.getElementById("intune-app-search").value = cleanedName || "";
    document.getElementById("intune-status").style.display = "none";
    document.getElementById("intune-modal-overlay").classList.add("active");
    document.body.style.overflow = "hidden";

    if (iconName) searchApps();
    setTimeout(() => document.getElementById("intune-app-search").focus(), 200);
  }

  function closeModal() {
    document.getElementById("intune-modal-overlay").classList.remove("active");
    document.body.style.overflow = "";
    document.getElementById("intune-status").style.display = "none";
  }

  // ── Graph API: Search Apps ───────────────────────────────
  async function searchApps() {
    const query = document.getElementById("intune-app-search").value.trim();
    const listEl = document.getElementById("intune-app-list");

    listEl.innerHTML = '<div class="intune-loading"><div class="intune-spinner"></div> Searching Intune apps...</div>';

    try {
      const token = await getAccessToken();

      let endpoint = `${CONFIG.graphBase}/deviceAppManagement/mobileApps?$top=50&$select=id,displayName,description,largeIcon`;
      if (query) {
        endpoint += `&$filter=contains(displayName,'${encodeURIComponent(query)}')`;
      }

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        currentAccount = null;
        onAuthStateChanged(false);
        throw new Error("Session expired. Please sign in again.");
      }

      if (response.status === 403) {
        throw new Error("Insufficient permissions. Admin consent may be required for DeviceManagementApps.ReadWrite.All");
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const apps = (data.value || []).filter((app) => {
        const t = app["@odata.type"] || "";
        return (
          t.includes("win32LobApp") ||
          t.includes("winGetApp") ||
          t.includes("webApp") ||
          t.includes("windowsMobileMSI") ||
          t.includes("windowsUniversalAppX") ||
          t.includes("officeSuiteApp")
        );
      });

      renderAppList(apps);
    } catch (error) {
      console.error("[Intune] Search error:", error);
      listEl.innerHTML = `<div class="intune-error">${error.message}</div>`;
    }
  }

  function renderAppList(apps) {
    const listEl = document.getElementById("intune-app-list");

    if (apps.length === 0) {
      listEl.innerHTML = '<div class="intune-empty">No matching apps found. Try a different search.</div>';
      return;
    }

    listEl.innerHTML = "";
    apps.forEach((app) => {
      const item = document.createElement("div");
      item.className = "intune-app-item";

      const hasIcon = app.largeIcon?.value;
      const iconHtml = hasIcon
        ? `<img src="data:image/png;base64,${app.largeIcon.value}" alt="" />`
        : `<div class="intune-app-no-icon">?</div>`;

      item.innerHTML = `
        <div class="intune-app-icon">${iconHtml}</div>
        <div class="intune-app-info">
          <div class="intune-app-name">${escapeHtml(app.displayName)}</div>
          <div class="intune-app-type">${formatAppType(app["@odata.type"])}</div>
        </div>
        <button class="intune-btn intune-btn-send">Apply Icon</button>
      `;

      item.querySelector(".intune-btn-send").addEventListener("click", () => {
        applyIcon(app);
      });

      listEl.appendChild(item);
    });
  }

  // ── Graph API: Apply Icon ────────────────────────────────
  async function applyIcon(app) {
    const statusEl = document.getElementById("intune-status");
    showStatus(statusEl, `Sending icon to "${app.displayName}"...`, "loading");

    document.querySelectorAll("#intune-app-list .intune-btn-send").forEach((b) => (b.disabled = true));

    try {
      const token = await getAccessToken();

      // Fetch icon as base64
      const iconResponse = await fetch(currentIconUrl);
      if (!iconResponse.ok) throw new Error("Failed to fetch the icon file");
      const blob = await iconResponse.blob();
      const base64 = await blobToBase64(blob);

      // PATCH the Intune app
      const patchResponse = await fetch(
        `${CONFIG.graphBase}/deviceAppManagement/mobileApps/${app.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "@odata.type": app["@odata.type"],
            largeIcon: {
              "@odata.type": "#microsoft.graph.mimeContent",
              type: "image/png",
              value: base64,
            },
          }),
        }
      );

      if (!patchResponse.ok) {
        const err = await patchResponse.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Failed: ${patchResponse.status}`);
      }

      showStatus(statusEl, `Icon applied to "${app.displayName}" successfully! It may take a few minutes to appear in the Intune portal.`, "success");
      showToast(`Icon sent to "${app.displayName}"!`, "success");
      trackEvent("intune-icon-sent", cleanIconName(document.getElementById("intune-preview-name").textContent));
    } catch (error) {
      console.error("[Intune] Apply error:", error);
      showStatus(statusEl, `Failed: ${error.message}`, "error");
    } finally {
      document.querySelectorAll("#intune-app-list .intune-btn-send").forEach((b) => (b.disabled = false));
    }
  }

  // ── Analytics ─────────────────────────────────────────────
  // Sends events to GoatCounter (if available on the page)
  // Events: "intune-signin", "intune-icon-sent"
  function trackEvent(eventName, detail) {
    if (typeof window.goatcounter === "undefined") return;
    try {
      window.goatcounter.count({
        path: `intune/${eventName}/${detail || ""}`,
        title: eventName,
        event: true,
      });
    } catch (e) {
      // Silently ignore tracking errors
    }
  }

  // ── Utilities ────────────────────────────────────────────

  // Clean up icon names for better Intune search matching
  // "CompanyPortal" → "Company Portal"
  // "AcrobatReader" → "Acrobat Reader"
  // "MicrosoftTeams" → "Microsoft Teams"
  // "7-Zip" → "7-Zip" (unchanged)
  function cleanIconName(name) {
    if (!name) return "";
    return name
      // Split camelCase/PascalCase: "CompanyPortal" → "Company Portal"
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      // Split when lowercase is followed by numbers: "v2App" → "v2 App"
      .replace(/([a-zA-Z])(\d)/g, "$1 $2")
      // Remove file extensions
      .replace(/\.(png|jpg|svg|ico)$/i, "")
      // Clean up multiple spaces
      .replace(/\s+/g, " ")
      .trim();
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function formatAppType(odataType) {
    if (!odataType) return "App";
    const map = {
      win32LobApp: "Win32 App",
      winGetApp: "WinGet App",
      webApp: "Web App",
      windowsMobileMSI: "MSI App",
      officeSuiteApp: "Microsoft 365",
      windowsUniversalAppX: "AppX/MSIX",
    };
    for (const [key, label] of Object.entries(map)) {
      if (odataType.includes(key)) return label;
    }
    return "App";
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function showStatus(el, message, type) {
    el.style.display = "flex";
    el.className = `intune-status intune-status-${type}`;
    const icon =
      type === "loading" ? '<div class="intune-spinner"></div>' :
      type === "success" ? '<span style="font-weight:700;font-size:15px">✓</span>' :
      '<span style="font-weight:700;font-size:15px">✕</span>';
    el.innerHTML = `${icon} <span>${message}</span>`;
  }

  function showToast(message, type = "info") {
    const existing = document.querySelector(".intune-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `intune-toast intune-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("intune-toast-visible"));
    setTimeout(() => {
      toast.classList.remove("intune-toast-visible");
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  return { init, signIn, signOut, isAuthenticated };
})();

// Auto-init
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => IntuneIntegration.init());
} else {
  IntuneIntegration.init();
}