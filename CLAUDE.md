# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static marketing website for Gemini Toolbox, a Chrome Extension that unifies multiple Gemini-related tools (PDF export, bulk delete, folders, prompt library). It's built with plain HTML/CSS/JavaScript following Material Design 3 principles - no build process or frameworks.

## Development Commands

```bash
# Start local development server (use any available port if 8000 is taken)
python3 -m http.server 8000

# Alternative servers
npx http-server
php -S localhost:8000
```

## Architecture & Key Design Decisions

### Page Structure
- **index.html**: Main landing page with email capture for beta signups. Features slideshow of product screenshots.
- **pdf.html**: Bridge page for existing "Gemini to PDF" extension users, funnels them to the unified toolbox
- **delete.html**: Bridge page for existing "Gemini Bulk Delete" extension users, similar funnel strategy
- **privacy.html** & **terms.html**: Legal pages (currently placeholders)

### Styling Strategy
- All styles in single `styles.css` file using CSS variables for Material Design 3 color system
- Primary color: `#1A73E8` (Google Blue)
- Mobile-first responsive design with breakpoint at 768px
- Slideshow components use `.slide`, `.dots-container`, and `.dot` classes

### JavaScript Functionality
- `script.js`: Handles email form validation and slideshow auto-rotation on homepage
- PDF and delete pages have inline `<script>` tags for their independent slideshows
- Email submissions currently use localStorage (demo mode) - `submitToAPI()` function needs backend integration

### Image Assets
- `/images/slide[1-6].png`: Homepage slideshow showcasing Gemini Toolbox features
- `/images/pdf-*.png`: PDF export feature screenshots for pdf.html slideshow
- `/images/delete-*.png`: Bulk delete feature screenshots for delete.html slideshow

## Current Extension Links

- Gemini to PDF: https://chromewebstore.google.com/detail/gemini-to-pdf/blndbnmpkgfoopgmcejnhdnepfejgipe
- Gemini Bulk Delete: https://chromewebstore.google.com/detail/gemini-bulk-delete/bdbdcppgiiidaolmadifdlceedoojpfh

## SEO & Conversion Optimization

The site is optimized for these primary search queries:
- "how to export gemini chat to pdf"
- "how to delete multiple gemini chats"
- "gemini chat folders"
- "save gemini conversation"

Each page includes:
- SEO-optimized title and meta description
- FAQ sections with high-intent questions
- Trust signals (4.7★ rating, 5000+ users, award badges)
- Huzzler Launch Arena badges for credibility

## Important Business Context

- The individual extensions (PDF export, bulk delete) already exist with 20+ reviews each
- Gemini Toolbox is the new unified extension in beta, combining all features
- Bridge pages exist to capture existing extension users and funnel them to the unified solution
- Email signups are for beta access to the combined toolbox
- Developer has 5000+ total users across existing extensions

## Deployment

No build process required. For deployment:
- Upload all files as-is to any static host (GitHub Pages, Netlify, etc.)
- Ensure `/images/` directory is included
- No server-side requirements unless implementing real email backend