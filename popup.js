document.addEventListener('DOMContentLoaded', () => {
    const enableOverlay = document.getElementById('enableOverlay');
    const enableAutoSkip = document.getElementById('enableAutoSkip');
    const enableAutoMute = document.getElementById('enableAutoMute');
    const overlayType = document.getElementById('overlayType');
    const status = document.getElementById('status');
    const adsSkipped = document.getElementById('adsSkipped');

    // Load saved state
    chrome.storage.local.get(['enableOverlay', 'enableAutoSkip', 'enableAutoMute', 'overlayType', 'adsSkipped'], (result) => {
        if (result.enableOverlay !== undefined) {
            enableOverlay.checked = result.enableOverlay;
        }
        if (result.enableAutoSkip !== undefined) {
            enableAutoSkip.checked = result.enableAutoSkip;
        }
        if (result.enableAutoMute !== undefined) {
            enableAutoMute.checked = result.enableAutoMute;
        }
        if (result.overlayType) {
            overlayType.value = result.overlayType;
        }
        if (result.adsSkipped) {
            adsSkipped.textContent = result.adsSkipped;
        }

        updateStatus();
    });

    // Toggle overlay
    enableOverlay.addEventListener('change', () => {
        const enabled = enableOverlay.checked;
        chrome.storage.local.set({ enableOverlay: enabled });
        updateStatus();
    });

    // Toggle auto-skip
    enableAutoSkip.addEventListener('change', () => {
        const enabled = enableAutoSkip.checked;
        chrome.storage.local.set({ enableAutoSkip: enabled });
        updateStatus();
    });

    // Toggle auto-mute
    enableAutoMute.addEventListener('change', () => {
        const enabled = enableAutoMute.checked;
        chrome.storage.local.set({ enableAutoMute: enabled });
        updateStatus();
    });

    // Change overlay type
    overlayType.addEventListener('change', () => {
        chrome.storage.local.set({ overlayType: overlayType.value });
        status.textContent = '✓ Overlay type updated - reload YouTube to apply';
        setTimeout(() => updateStatus(), 2000);
    });

    function updateStatus() {
        const overlayOn = enableOverlay.checked;
        const skipOn = enableAutoSkip.checked;
        const muteOn = enableAutoMute.checked;

        const activeFeatures = [overlayOn, skipOn, muteOn].filter(Boolean).length;

        if (activeFeatures === 3) {
            status.textContent = '✓ AdEx Fully Active';
            status.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
        } else if (activeFeatures === 2) {
            status.textContent = '✓ AdEx Active';
            status.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
        } else if (activeFeatures === 1) {
            status.textContent = '✓ Partial Active';
            status.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
        } else {
            status.textContent = '⚠ AdEx Disabled';
            status.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
        }
    }

    // Listen for updates from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'adSkipped') {
            adsSkipped.textContent = message.count || 0;
        }
        sendResponse({ received: true });
    });

    // Display initial status
    updateStatus();
});

