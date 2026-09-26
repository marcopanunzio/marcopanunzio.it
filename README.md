# marcopanunzio.it

Personal website of Marco Panunzio. Astro 7 + React 19 islands, Tailwind CSS 4, GSAP (ScrollTrigger, SplitText) and Lenis for smooth scrolling.
Static, self-hostable, no trackers, fonts served locally.

## Editing content

All content lives in `src/content/`, as Markdown (the site itself is in Italian):

| File | What it contains |
|---|---|
| `sito.md` | Name, SEO title, description, preloader words, footer note |
| `sezioni/*.md` | One homepage section per file |
| `progetti/*.md` | One project per file (shown in the `projects` section) |

- **Section order**: the `order` field.
- **Hide** a section or project: `enabled: false`.
- **Menu entry**: add `navLabel: Name`; without it, the section does not appear in the menu.
- **Orange italic in titles**: `*word*`.
- **Light theme** for a section: `theme: light` (the page changes colour while the section is in view).
- The Markdown body (below the `---`) is the section's free text.

### Available layouts (`layout:` in the frontmatter)

| layout | Specific fields |
|---|---|
| `hero` | `headline` (lines), `intro`, `meta`, `cta` |
| `marquee` | `items` |
| `about` | `stats` (`value`, `label`), `interests`, `interestsTitle` + body |
| `timeline` | `items` (`period`, `company`, `role`, `note`) + body |
| `principles` | `quotes` (`text`, `note`) + body |
| `projects` | `stack`, `stackTitle` + body; the cards come from `progetti/` |
| `skills` | `groups` (`title`, `items`) |
| `list` | `items` (`title`, `text`, `tag`) |
| `contact` | `email`, `links` (`label`, `href`) + body |

To add a section, create a new file in `sezioni/` using one of these layouts. If a field is wrong, the build stops and tells you which one.

## Development

```bash
npm install
npm run dev      # http://localhost:4321, reloads on every change
npm run build    # generates dist/
npm run preview  # serves dist/
```

## Deployment

Everything runs in Docker: the VPS only needs Docker with Compose.

- `sito`: builds the site and serves the static files with nginx
- `proxy` (`vps` profile): nginx reverse proxy with HTTPS, ports 80 and 443
- `certbot` (`vps` profile): renews the Let's Encrypt certificates every 12 hours

### Local test

```bash
docker compose up -d --build   # http://localhost:8080
docker compose down
```

### First install on the VPS

1. DNS: point the A/AAAA records of `marcopanunzio.it` and `www` to the VPS IP (do not touch MX, SPF, DKIM, DMARC).
2. Clone the repository and build the site:

   ```bash
   git clone git@github.com:marcopanunzio/marcopanunzio.it.git && cd marcopanunzio.it
   docker compose build
   ```

3. First certificate (port 80 must be free):

   ```bash
   docker compose --profile vps run --rm -p 80:80 --entrypoint certbot certbot \
     certonly --standalone -d marcopanunzio.it -d www.marcopanunzio.it \
     -m posta@marcopanunzio.it --agree-tos --no-eff-email
   ```

4. Start:

   ```bash
   docker compose --profile vps up -d
   ```

### Updates

```bash
git pull && docker compose --profile vps up -d --build
```

The proxy configuration is in `deploy/nginx/proxy.conf`, the site container's in `docker/nginx.conf`.
