document.addEventListener('DOMContentLoaded', () => {
    const enableOverlay = document.getElementById('enableOverlay');
    const enableAutoSkip = document.getElementById('enableAutoSkip');
    const enableAutoMute = document.getElementById('enableAutoMute');
    const overlayType = document.getElementById('overlayType');
    const adsSkipped = document.getElementById('adsSkipped');
    const status = document.getElementById('status');

    // Load saved state
    chrome.storage.local.get(['enableOverlay', 'enableAutoSkip', 'enableAutoMute', 'overlayType', 'adsSkipped'], (result) => {
        if (result.enableOverlay !== undefined) enableOverlay.checked = result.enableOverlay;
        if (result.enableAutoSkip !== undefined) enableAutoSkip.checked = result.enableAutoSkip;
        if (result.enableAutoMute !== undefined) enableAutoMute.checked = result.enableAutoMute;
        if (result.overlayType) overlayType.value = result.overlayType;
        if (result.adsSkipped) adsSkipped.textContent = result.adsSkipped;
    });

    // Listen for updates from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'adSkipped') {
            adsSkipped.textContent = message.count || 0;
        }
        sendResponse({ received: true });
    });

    // Handle toggles
    enableOverlay.addEventListener('change', () => {
        chrome.storage.local.set({ enableOverlay: enableOverlay.checked });
        status.textContent = 'saved';
        setTimeout(() => status.textContent = '', 1000);
    });

    enableAutoSkip.addEventListener('change', () => {
        chrome.storage.local.set({ enableAutoSkip: enableAutoSkip.checked });
        status.textContent = 'saved';
        setTimeout(() => status.textContent = '', 1000);
    });

    enableAutoMute.addEventListener('change', () => {
        chrome.storage.local.set({ enableAutoMute: enableAutoMute.checked });
        status.textContent = 'saved';
        setTimeout(() => status.textContent = '', 1000);
    });

    overlayType.addEventListener('change', () => {
        chrome.storage.local.set({ overlayType: overlayType.value });
        status.textContent = 'reload youtube to apply';
        status.classList.add('active');
        setTimeout(() => {
            status.textContent = '';
            status.classList.remove('active');
        }, 2000);
    });
});
