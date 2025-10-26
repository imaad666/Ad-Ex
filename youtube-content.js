// YouTube Ad Overlay & Auto-Skip
console.log('AdEx: YouTube content script loaded');

let enableOverlay = true;
let enableAutoSkip = true;
let enableAutoMute = true;
let overlayType = 'black';
let adsSkipped = 0;
let videoWasMuted = false;
let isAdPlaying = false;

// Load settings
chrome.storage.local.get(['enableOverlay', 'enableAutoSkip', 'enableAutoMute', 'overlayType'], (result) => {
    enableOverlay = result.enableOverlay !== false;
    enableAutoSkip = result.enableAutoSkip !== false;
    enableAutoMute = result.enableAutoMute !== false;
    overlayType = result.overlayType || 'black';
    console.log('AdEx: Settings loaded', { enableOverlay, enableAutoSkip, enableAutoMute, overlayType });
});

// Listen for settings changes from popup
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.enableOverlay) {
        enableOverlay = changes.enableOverlay.newValue;
    }
    if (changes.enableAutoSkip) {
        enableAutoSkip = changes.enableAutoSkip.newValue;
    }
    if (changes.enableAutoMute) {
        enableAutoMute = changes.enableAutoMute.newValue;
    }
    if (changes.overlayType) {
        overlayType = changes.overlayType.newValue;
    }
});

// Function to create overlay
function createOverlay() {
    // Remove existing overlay if any
    const existingOverlay = document.getElementById('adex-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    if (!enableOverlay) return;

    // Find the ad container
    const adContainer = document.querySelector('.ad-showing, .ytp-ad-player-overlay, [class*="ad-interrupting"]');

    if (!adContainer) {
        // Try finding video container
        const videoContainer = document.querySelector('.html5-video-container, .html5-main-video');
        if (videoContainer) {
            const overlay = document.createElement('div');
            overlay.id = 'adex-overlay';
            overlay.className = 'adex-overlay';

            const backgroundColor = overlayType === 'white' ? '#FFFFFF' : '#000000';
            overlay.style.backgroundColor = backgroundColor;

            videoContainer.appendChild(overlay);
        }
    } else {
        // Overlay on ad container
        const overlay = document.createElement('div');
        overlay.id = 'adex-overlay';
        overlay.className = 'adex-overlay';

        const backgroundColor = overlayType === 'white' ? '#FFFFFF' : '#000000';
        overlay.style.backgroundColor = backgroundColor;

        document.body.appendChild(overlay);
    }
}

// Function to click skip button
function clickSkipButton() {
    if (!enableAutoSkip) return;

    // Multiple possible selectors for skip button
    const skipSelectors = [
        '.ytp-ad-skip-button',
        '.ytp-ad-skip-button-modern',
        'button.ytp-ad-skip-button',
        '.ytp-ad-overlay-close-button'
    ];

    let clicked = false;
    skipSelectors.forEach(selector => {
        const skipButton = document.querySelector(selector);
        if (skipButton && skipButton.offsetParent !== null) {
            skipButton.click();
            clicked = true;
            adsSkipped++;
            console.log('AdEx: Ad skipped!', adsSkipped);

            // Save stats
            chrome.storage.local.set({ adsSkipped: adsSkipped });

            // Send message to background to update popup
            chrome.runtime.sendMessage({ action: 'adSkipped', count: adsSkipped });
        }
    });

    return clicked;
}

// Function to mute/unmute video
function handleMute(newAdState) {
    if (!enableAutoMute) return;

    const video = document.querySelector('video');
    if (!video) return;

    // If ad just started playing
    if (newAdState && !isAdPlaying) {
        // Store original muted state
        videoWasMuted = video.muted;
        // Mute the video
        video.muted = true;
        console.log('AdEx: Ad detected, muting video');
    }
    // If ad just ended
    else if (!newAdState && isAdPlaying) {
        // Restore original muted state
        if (!videoWasMuted) {
            video.muted = false;
            console.log('AdEx: Ad ended, unmuting video');
        }
    }
}

// Monitor for ads
function monitorAds() {
    // Check if ad is playing
    const playerStatus = document.querySelector('.ytp-ad-module, .ytp-ad-overlay-container, .ad-showing');
    const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern');
    const adPlaying = !!(playerStatus || skipButton);

    // Update ad playing state
    const newAdPlaying = adPlaying;

    if (newAdPlaying) {
        // Ad detected
        if (enableOverlay) {
            createOverlay();
        }

        // Mute the ad
        handleMute(true);

        if (enableAutoSkip) {
            // Try to click skip button
            clickSkipButton();
        }

        isAdPlaying = true;
    } else {
        // No ad detected
        if (isAdPlaying) {
            // Ad just ended
            handleMute(false);
            isAdPlaying = false;
        }

        // Remove overlay
        const overlay = document.getElementById('adex-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Also check for ad text indicators
    const adIndicators = document.querySelectorAll('[class*="ad"], [class*="Ad"]');
    if (adIndicators.length > 0 && enableOverlay) {
        createOverlay();
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monitorAds);
} else {
    monitorAds();
}

// Monitor for dynamic ad changes
const observer = new MutationObserver(() => {
    monitorAds();
});

// Observe body changes
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
});

// Also monitor for video changes
const videoObserver = new MutationObserver(() => {
    monitorAds();
});

// Wait for video container
const checkForVideo = setInterval(() => {
    const videoElement = document.querySelector('video');
    if (videoElement) {
        videoObserver.observe(videoElement, {
            attributes: true,
            attributeFilter: ['src']
        });
        clearInterval(checkForVideo);
    }
}, 1000);

// Periodic check (for safety)
setInterval(monitorAds, 500);

console.log('AdEx: YouTube monitor initialized');

