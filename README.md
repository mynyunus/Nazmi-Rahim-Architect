# Nazmi Rahim Architect (NRA) Landing Page

Static corporate landing page built with pure HTML, CSS, and vanilla JavaScript.
Visual direction: flat minimalist corporate theme (no gradients, no pulse animation).

## Stack
- `index.html`
- `styles.css`
- `script.js`
- `assets/` images and icons

No framework, no bundler, no backend.

## Local Preview
From the project root:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Cloudflare Pages Deployment
Use these settings in Cloudflare Pages:

- Framework preset: `None`
- Build command: *(leave empty)*
- Build output directory: `/`

Because this is a static site, deployment is direct with no build step.

## Asset Replacement Guide
Current image files are placeholders. Replace these with final assets while keeping filenames unchanged:

- `assets/hero.jpg`
- `assets/portfolio-1.jpg` ... `assets/portfolio-9.jpg`
- `assets/testimonial-1.jpg`

Recommended export:
- Hero image: `1600px+` wide
- Portfolio images: `1200px+` long side
- JPEG/WebP optimized to keep total page weight low

## CTA and Contact Links
Primary CTA is hardcoded to WhatsApp deep link:

`https://api.whatsapp.com/send?phone=60125518000&text=Hi%20Nazmi%20Rahim%20Architect,%20I%20would%20like%20to%20request%20a%20proposal%20for%20my%20project.`

Also used in:
- hero primary button
- contact section button
- floating WhatsApp button

## Flaticon Icons
Downloaded Flaticon icon assets are stored in:

- `assets/icons/whatsapp.png`
- `assets/icons/email.png`
- `assets/icons/instagram.png`
- `assets/icons/map.png`
- `assets/icons/phone.png`

If you replace icons later, keep style consistency and update footer attribution text in `index.html` accordingly.

## SEO Notes
Before production launch, update in `index.html`:

- canonical URL (`<link rel="canonical">`)
- Open Graph URL/image (`og:url`, `og:image`)
- Twitter image metadata

## Accessibility and UX Included
- semantic sectioning and heading hierarchy
- skip link
- keyboard focus states
- responsive mobile menu
- back-to-top button
- sticky floating WhatsApp CTA
