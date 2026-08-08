# kymaribratton.com

Static portfolio site: plain HTML, CSS, and JavaScript. No build step, no
framework, no dependencies. Edit the files and push.

## Structure

```
index.html            homepage
styles.css            all styling (design tokens at the top)
script.js             sticky header, scroll reveal, footer year
assets/               images, fonts, project covers, favicon
about/                about page
contact/              contact page
case-study/<slug>/    one folder per project
404.html  robots.txt  sitemap.xml  CNAME
```

## Local preview

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Use a server rather than opening the files
directly, since paths are root-absolute (`/styles.css`), so `file://` will not
resolve them.

## Editing

**Colours and type** live in the `:root` block at the top of `styles.css`.
Change a token there and it updates everywhere.

Text colours are deliberately darker than the brand pastels. `--sage` and
`--blush` are surface colours only; they do not have enough contrast for
small text. Use `--sage-deep` and `--rose-deep` for coloured text, and dark
`--ink` on top of sage or blush fills.

**Adding a project:** copy the closest existing folder in `case-study/`,
update the content, then add a card to the work grid in `index.html` and a
`<url>` entry to `sitemap.xml`.

**Project status badges:** `.status--live` (documented), `.status--progress`
(case study being written), `.status--ongoing` (project not finished). These
mean different things: a finished project can still have a case study in
progress.

## Adding a resume

Save the PDF to `assets/kymari-bratton-resume.pdf`, then uncomment the resume
line in the footer of `index.html`.

## Deploying

The repo is `kymaribratton.github.io`, so GitHub Pages serves it from the
root. `CNAME` points at kymaribratton.com. Push to `main` and Pages rebuilds.
