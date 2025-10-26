// AdEx - YouTube Ad Blocker
console.log('AdEx: Content script loaded');

let settings = {
    enableOverlay: true,
    enableAutoSkip: true,
    enableAutoMute: true,
    overlayType: 'black',
    adsSkipped: 0
};

let isAdPlaying = false;
let videoWasMuted = false;

// Load settings
chrome.storage.local.get(['enableOverlay', 'enableAutoSkip', 'enableAutoMute', 'overlayType', 'adsSkipped'], (result) => {
    Object.assign(settings, result);
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
    Object.keys(changes).forEach(key => {
        settings[key] = changes[key].newValue;
    });
});

function createOverlay() {
    if (!settings.enableOverlay) return;

    const existing = document.getElementById('adex-overlay');
    if (existing) return;

    const overlay = document.createElement('div');
    overlay.id = 'adex-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: ${settings.overlayType === 'white' ? '#FFFFFF' : '#000000'};
        z-index: 999999;
        pointer-events: none;
    `;

    document.body.appendChild(overlay);
}

function removeOverlay() {
    const overlay = document.getElementById('adex-overlay');
    if (overlay) overlay.remove();
}

function muteVideo() {
    if (!settings.enableAutoMute) return;
    const video = document.querySelector('video');
    if (video) {
        videoWasMuted = video.muted;
        video.muted = true;
    }
}

function unmuteVideo() {
    if (!settings.enableAutoMute) return;
    const video = document.querySelector('video');
    if (video && !videoWasMuted) {
        video.muted = false;
    }
}

function trySkipAd() {
    if (!settings.enableAutoSkip) return false;

    const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern');
    if (skipButton && skipButton.offsetParent !== null) {
        skipButton.click();
        settings.adsSkipped++;
        chrome.storage.local.set({ adsSkipped: settings.adsSkipped });
        chrome.runtime.sendMessage({ action: 'adSkipped', count: settings.adsSkipped });
        return true;
    }
    return false;
}

function checkForAds() {
    const isAd = document.querySelector('.ad-showing, .ytp-ad-player-overlay, .ytp-ad-module');
    const skipButton = document.querySelector('.ytp-ad-skip-button');

    if (isAd || skipButton) {
        if (!isAdPlaying) {
            // Ad just started
            isAdPlaying = true;
            createOverlay();
            muteVideo();
            trySkipAd();
        } else {
            // Ad already playing, try to skip
            trySkipAd();
        }
    } else {
        if (isAdPlaying) {
            // Ad just ended
            isAdPlaying = false;
            removeOverlay();
            unmuteVideo();
        }
    }
}

// Check for ads every second
setInterval(checkForAds, 1000);

// Also use mutation observer for more responsive detection
const observer = new MutationObserver(checkForAds);
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
});

console.log('AdEx: Initialized');
