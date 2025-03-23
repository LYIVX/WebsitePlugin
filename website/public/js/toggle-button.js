/**
 * Universal Toggle Button Component
 * 
 * Usage:
 * 1. Include toggle-button.css and toggle-button.js in your HTML
 * 2. Create toggle with the following HTML structure:
 * 
 * <label class="universal-toggle">
 *   <input type="checkbox" data-toggle-id="uniqueId" data-callback="callbackFunctionName">
 *   <span class="universal-toggle-slider"></span>
 *   <span class="universal-toggle-label">Toggle Label</span>
 * </label>
 * 
 * Options:
 * - Add .small or .large class to .universal-toggle for different sizes
 * - Add .disabled class to disable the toggle
 * - data-toggle-id: Optional unique identifier for the toggle
 * - data-callback: Optional callback function name to be called when toggle state changes
 */

document.addEventListener('DOMContentLoaded', function() {
  initToggles();
});

function initToggles() {
  // Find all universal toggle inputs
  const toggleInputs = document.querySelectorAll('.universal-toggle input[type="checkbox"]');
  
  // Add event listeners to each toggle
  toggleInputs.forEach(input => {
    // Set initial state (if needed from localStorage or other source)
    const toggleId = input.getAttribute('data-toggle-id');
    if (toggleId) {
      const savedState = localStorage.getItem(`toggle_${toggleId}`);
      if (savedState !== null) {
        input.checked = savedState === 'true';
      }
    }
    
    // Add change event listener
    input.addEventListener('change', handleToggleChange);
  });
}

function handleToggleChange(event) {
  const input = event.target;
  const toggleId = input.getAttribute('data-toggle-id');
  const callbackName = input.getAttribute('data-callback');
  
  // Save state to localStorage if ID is provided
  if (toggleId) {
    localStorage.setItem(`toggle_${toggleId}`, input.checked);
    
    // Special handling for theme toggles
    if (toggleId === 'lightThemePreference') {
      // This will be handled by the profile.js event listener
      // but we'll add this here as a fallback
      const hasAccentTheme = document.body.classList.contains('accent-theme');
      
      if (input.checked) {
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
      } else {
        document.body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
      }
      
      // Optional: Show feedback if showToast function is available
      if (typeof window.showToast === 'function') {
        const themeDesc = input.checked ? 'Light' : 'Dark';
        const accentDesc = hasAccentTheme ? 'accent' : 'primary';
        window.showToast(`${themeDesc} ${accentDesc} theme applied`, 'info');
      }
    }
    
    // Handle accent theme toggle
    if (toggleId === 'accentThemePreference') {
      // This will be handled by profile.js event listener
      // but we'll add this here as a fallback
      const isLightTheme = document.body.classList.contains('light-theme');
      
      if (input.checked) {
        document.body.classList.add('accent-theme');
        localStorage.setItem('accent_theme', 'true');
      } else {
        document.body.classList.remove('accent-theme');
        localStorage.setItem('accent_theme', 'false');
      }
      
      // Optional: Show feedback if showToast function is available
      if (typeof window.showToast === 'function') {
        const themeDesc = isLightTheme ? 'Light' : 'Dark';
        const accentDesc = input.checked ? 'accent' : 'primary';
        window.showToast(`${themeDesc} ${accentDesc} theme applied`, 'info');
      }
    }
  }
  
  // Call callback function if specified
  if (callbackName && typeof window[callbackName] === 'function') {
    window[callbackName](input.checked, toggleId);
  }
  
  // Dispatch a custom event
  const toggleEvent = new CustomEvent('toggle-changed', {
    detail: {
      id: toggleId,
      checked: input.checked,
      element: input
    }
  });
  
  document.dispatchEvent(toggleEvent);
}

// Method to set toggle state programmatically
function setToggleState(toggleId, state) {
  if (!toggleId) return;
  
  const toggle = document.querySelector(`.universal-toggle input[data-toggle-id="${toggleId}"]`);
  if (toggle) {
    // Only trigger change if state is different
    if (toggle.checked !== state) {
      toggle.checked = state;
      
      // Save to localStorage
      localStorage.setItem(`toggle_${toggleId}`, state);
      
      // Dispatch change event to trigger callbacks
      toggle.dispatchEvent(new Event('change'));
    }
  }
}

// Method to get current toggle state
function getToggleState(toggleId) {
  if (!toggleId) return null;
  
  const toggle = document.querySelector(`.universal-toggle input[data-toggle-id="${toggleId}"]`);
  return toggle ? toggle.checked : null;
}

// Method to enable/disable toggle
function setToggleEnabled(toggleId, enabled) {
  if (!toggleId) return;
  
  const toggleLabel = document.querySelector(`.universal-toggle input[data-toggle-id="${toggleId}"]`).closest('.universal-toggle');
  
  if (toggleLabel) {
    const toggle = toggleLabel.querySelector('input');
    toggle.disabled = !enabled;
    
    if (enabled) {
      toggleLabel.classList.remove('disabled');
    } else {
      toggleLabel.classList.add('disabled');
    }
  }
} 