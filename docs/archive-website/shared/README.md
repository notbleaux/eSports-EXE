# SATOR Shared Components

This directory contains shared components used across all HUBs and pages.

## Structure

```
shared/
├── partials/           # HTML partials/templates
├── css/                # Shared stylesheets
└── js/                 # Shared JavaScript
```

## Partials (`partials/`)

Reusable HTML components that can be included in multiple pages.

### Planned Partials:
- `header.html` - Site header with navigation
- `footer.html` - Site footer
- `hub-navigation.html` - HUB-specific navigation
- `meta-tags.html` - Common meta tags template
- `loading-spinner.html` - Loading state component

### Usage

Partials can be included using server-side includes or copied during build:

```html
<!-- Server-side include example -->
<!--#include virtual="/shared/partials/header.html" -->
```

## CSS (`css/`)

Shared stylesheets used across all pages.

### Planned Stylesheets:
- `variables.css` - CSS custom properties (colors, spacing, etc.)
- `utilities.css` - Utility classes
- `animations.css` - Shared animations
- `components.css` - Shared component styles

### CSS Variables

```css
:root {
    /* Colors */
    --sator-bg: #0a0a0f;
    --sator-card: #111118;
    --sator-border: #1a1a25;
    
    /* HUB Colors */
    --hub-stat-primary: #1E3A5F;
    --hub-analytics-primary: #6B46C1;
    --hub-esports-primary: #FF4655;
    --hub-fantasy-primary: #00FF88;
    --hub-help-primary: #22D3EE;
    
    /* Spacing */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;
    
    /* Typography */
    --font-sans: system-ui, -apple-system, sans-serif;
    --font-mono: 'Fira Code', monospace;
}
```

## JavaScript (`js/`)

Shared JavaScript modules used across all pages.

### Planned Scripts:
- `config.js` - Site configuration
- `api-client.js` - API communication
- `auth.js` - Authentication handling
- `theme.js` - Theme/dark mode management
- `analytics.js` - Usage analytics

## Integration

### Including Shared Resources

```html
<!-- CSS -->
<link rel="stylesheet" href="/shared/css/variables.css">
<link rel="stylesheet" href="/shared/css/utilities.css">

<!-- JavaScript -->
<script src="/shared/js/config.js"></script>
<script src="/shared/js/api-client.js"></script>
```

## Build Process

In production, shared resources should be:
1. Concatenated and minified
2. Versioned for cache busting
3. Served from CDN (if applicable)

## Contributing

When adding shared components:
1. Ensure they are truly reusable across multiple pages
2. Document usage in this README
3. Follow naming conventions
4. Test across all HUBs
5. Keep dependencies minimal
