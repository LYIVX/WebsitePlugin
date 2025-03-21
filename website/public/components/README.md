# Website Components

This directory contains reusable components for the website.

## Components

### Universal Button

The `button.html` component provides a standardized button style that should be used across the entire website to ensure visual consistency.

#### Usage Options

There are three ways to use the universal button:

1. **HTML/CSS Classes:**
   
   ```html
   <button class="universal-btn primary">Button Text</button>
   ```

2. **Web Component:**
   
   ```html
   <universal-button text="Button Text" type="primary"></universal-button>
   ```

3. **JavaScript API:**
   
   ```javascript
   const button = UniversalButtonUtil.createButton({
     text: "Button Text",
     type: "primary",
     icon: "fas fa-edit",
     onClick: () => console.log("Button clicked")
   });
   document.body.appendChild(button);
   ```

#### Button Types

- `primary` - Main action buttons (default purple)
- `secondary` - Secondary action buttons
- `danger` - Destructive action buttons (red)

#### Button Sizes

- `small` - Smaller buttons
- `medium` - Default size
- `large` - Larger buttons

#### Additional Options

- **Icons**: Add FontAwesome icons to buttons
- **Full Width**: Make buttons span the full width of their container
- **Disabled State**: Disable interaction with buttons

#### Documentation

For more detailed documentation and examples, see the demo page:

`/components/button-demo.html`

### Other Components

- **nav.html** - Navigation bar component
- **footer.html** - Footer component
- **tab-bar.html** - Tab navigation component 