/**
 * Components Index
 * ================
 * Central export point for all component modules.
 * 
 * @module components
 * @version 1.0.0
 */

// Import all component modules
import * as hubCard from './hub-card.js';
import * as navigation from './navigation.js';
import * as njzButton from './njz-button.js';
import * as helpPanel from './help-panel.js';
import * as toast from './toast.js';

// Named exports
export { hubCard, navigation, njzButton, helpPanel, toast };

// Convenience exports for commonly used functions
export const { createHubCard, createHubCardGrid, getHubTheme, getAllHubThemes } = hubCard;
export const { createNavigation, toggleMobileMenu, highlightNavItem, getHubConfig, getCurrentHubFromURL } = navigation;
export const { createNJZButton, getGlowControl, updateGlowColor, triggerClickAnimation } = njzButton;
export const { createHelpPanel, openHelpPanel, closeHelpPanel, switchHelpTab } = helpPanel;
export const { showToast, showSuccess, showError, showWarning, showInfo, clearAllToasts } = toast;

// Default export with all components
export default {
    hubCard,
    navigation,
    njzButton,
    helpPanel,
    toast,
    // Convenience methods
    createHubCard,
    createHubCardGrid,
    createNavigation,
    toggleMobileMenu,
    createNJZButton,
    createHelpPanel,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
};
