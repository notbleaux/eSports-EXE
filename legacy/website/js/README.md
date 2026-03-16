[Ver001.000]

# SATOR Website JavaScript

This directory contains all JavaScript code for the SATOR website.

## Structure

```
js/
├── components/         # Reusable UI components
│   └── (shared components)
├── utils/              # Utility functions
│   └── (helper functions)
└── (root level scripts)
```

## Components (`components/`)

Reusable JavaScript components used across multiple pages.

### Planned Components:
- `Navigation.js` - Shared navigation functionality
- `HubCard.js` - HUB selector card component
- `DataTable.js` - Sortable/filterable data tables
- `ChartComponent.js` - Chart rendering wrapper
- `Modal.js` - Modal dialog component
- `Toast.js` - Notification toast component

## Utilities (`utils/`)

Helper functions and utilities.

### Planned Utilities:
- `api.js` - API communication helpers
- `storage.js` - Local storage management
- `formatters.js` - Data formatting functions
- `validators.js` - Input validation
- `helpers.js` - General helper functions

## Usage

### Including Scripts

```html
<!-- Component -->
<script src="/js/components/Navigation.js"></script>

<!-- Utility -->
<script src="/js/utils/api.js"></script>
```

### Module Pattern

Scripts should use the module pattern for encapsulation:

```javascript
const SATORComponent = (function() {
    // Private variables
    let privateVar = '';
    
    // Private functions
    function privateFunction() {
        // ...
    }
    
    // Public API
    return {
        init: function() {
            // Initialize component
        },
        publicMethod: function() {
            // Public method
        }
    };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    SATORComponent.init();
});
```

## Coding Standards

1. **ES6+ Features**: Use modern JavaScript features
2. **Strict Mode**: Always use `'use strict';`
3. **Comments**: Document public APIs with JSDoc
4. **Error Handling**: Always handle errors gracefully
5. **Performance**: Debounce/throttle expensive operations

## Dependencies

External libraries (loaded via CDN where needed):
- Tailwind CSS (styling)
- Chart.js (for data visualization - planned)
- D3.js (for advanced visualizations - planned)
