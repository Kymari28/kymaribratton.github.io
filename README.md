# Kymari Bratton Portfolio

This is a lightweight static portfolio site built to replace a Figma-hosted portfolio with something you fully own.

## Files

- `index.html` - page structure and content
- `styles.css` - all visual styling and responsive layout
- `script.js` - reveal animations and project filters
- `about/`, `contact/`, `case-study/` - routed portfolio pages
- `assets/` - images and custom type assets used by the live site
- `404.html`, `robots.txt`, `sitemap.xml` - deploy-ready site support files

## Local preview

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy-ready package

After cleanup, the simplest upload-friendly bundle is:

- `deploy/kymaribratton.com/` - clean folder containing only the live website files
- `deploy/kymaribratton.com.zip` - zipped version of the same bundle for easy upload or sharing

These are prepared so you do not need to include old Figma export files.

## Recommended free hosting path

The cleanest free option for this site is a static host like Netlify, Cloudflare Pages, or GitHub Pages.

### Option 1: Netlify Drop

1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag this whole folder into the browser window.
3. Netlify will publish a free temporary site.
4. In the Netlify dashboard, add `kymaribratton.com` as a custom domain.
5. Netlify will show the exact DNS records it needs.
6. In Porkbun, open `Domain Management` for `kymaribratton.com`, then `DNS`.
7. Add the records Netlify gives you exactly as shown.
8. Wait for DNS to propagate and SSL to finish.

### Option 2: Cloudflare Pages

1. Create a Cloudflare account.
2. Create a new Pages project and upload this site.
3. Add `kymaribratton.com` as a custom domain.
4. Copy the DNS records Cloudflare gives you into Porkbun DNS.

### Option 3: GitHub Pages

1. Create a GitHub repository and upload these files to the repository root.
2. Turn on GitHub Pages in the repo settings.
3. Add `kymaribratton.com` as the custom domain in GitHub Pages settings.
4. Update Porkbun DNS with the records GitHub Pages requires.

## Porkbun note

No matter which free host you choose, the host should tell you the exact DNS records to place in Porkbun. That is better than guessing generic records, because the required setup can vary by provider.

## Suggested next improvements

- Add a real resume PDF and link it in the hero
- Add deeper case-study pages for 2-3 flagship projects
- Add professional headshot or brand photography if desired
- Add LinkedIn and email footer links
