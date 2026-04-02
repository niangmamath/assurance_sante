# Fix Form Mouse Buttons Not Working (Landing Page)

## Status: [IN PROGRESS]

### Step 1: [PENDING] CSS Fixes - Add pointer-events & z-index
- Edit frontend/landing/style.css
  * Add `pointer-events: auto !important` to form buttons (.btn-next, .btn-back, .btn-submit)
  * Add `pointer-events: auto` to .radio-item, .check-item
  * Set `.form-card { z-index: 1001; position: relative; }`
  * Lower `#chatbot-panel { z-index: 500; }`

### Step 2: [PENDING] JS - Improve Event Handling
- Edit frontend/landing/index.html (inline script)
  * In radio/check click handlers: change `e.preventDefault()` to conditional
  * Add `e.stopPropagation()`
  * Hide chatbot on form input focus

### Step 3: [PENDING] Test Interactions
- Verify button clicks work
- Check radio/check toggles
- Confirm no overlay blocking

### Step 4: [PENDING] Update TODO & Complete
- Mark steps done
- attempt_completion

