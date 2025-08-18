# Gemini Toolbox - Plain HTML/CSS Landing Page

A clean, fast, and responsive pre-launch website for the Gemini Toolbox Chrome Extension built with plain HTML, CSS, and vanilla JavaScript. No frameworks, no build process, just pure web technologies.

## Features

- **Zero Dependencies** - No frameworks or libraries required
- **Material Design 3** - Following Google's design system
- **Fully Responsive** - Mobile-first design approach
- **Fast Loading** - No JavaScript framework overhead
- **SEO Optimized** - Clean HTML structure with proper meta tags
- **Email Capture** - Form validation with JavaScript
- **Bridge Pages** - Smart funneling for existing extension users

## Pages

- `index.html` - Main landing page with email capture
- `pdf.html` - Bridge page for Gemini to PDF users
- `delete.html` - Bridge page for Bulk Delete users  
- `privacy.html` - Privacy policy
- `terms.html` - Terms of service

## Quick Start

### Local Development

1. Navigate to the project folder:
```bash
cd gemini-toolbox-html
```

2. Start a simple HTTP server:
```bash
# Python 3
python3 -m http.server 8000

# Or using Node.js
npx http-server

# Or using PHP
php -S localhost:8000
```

3. Open in browser: `http://localhost:8000`

## Project Structure

```
gemini-toolbox-html/
├── index.html      # Homepage
├── pdf.html        # PDF export bridge page
├── delete.html     # Bulk delete bridge page
├── privacy.html    # Privacy policy
├── terms.html      # Terms of service
├── styles.css      # All styling (Material Design 3)
├── script.js       # Email validation & animations
└── README.md       # This file
```

## Navigation Flow

1. **Direct Traffic** → `index.html` → Email signup
2. **PDF Extension Users** → `pdf.html` → Redirects to homepage signup
3. **Delete Extension Users** → `delete.html` → Redirects to homepage signup

The stat cards on the homepage are clickable and link to their respective bridge pages.

## Customization

### Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary: #1A73E8;        /* Google Blue */
    --primary-hover: #1765CC;
    --primary-light: #E8F0FE;
    /* ... */
}
```

### Content
Simply edit the HTML files directly - no build process needed!

### Email Integration
The form currently stores emails in localStorage for demo purposes. To connect to a real backend:

1. Edit `script.js`
2. Replace the `submitToAPI` function with your actual API endpoint
3. Update the endpoint URL and authentication

## Deployment

### GitHub Pages
1. Push to GitHub repository
2. Enable GitHub Pages in Settings
3. Select main branch

### Netlify
1. Drag and drop the folder to Netlify
2. Site goes live instantly

### Any Web Host
Simply upload all files via FTP - no build process required!

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Performance

- **Page Load**: < 1 second
- **First Paint**: < 200ms
- **No JavaScript frameworks**: 0KB overhead
- **Total Size**: ~15KB (HTML + CSS + JS)

## SEO

All pages include:
- Meta descriptions
- Open Graph tags
- Twitter Card tags
- Semantic HTML structure
- Clean URLs

## License

Private - All rights reserved

## Contact

For questions: hamzaw31@gmail.com