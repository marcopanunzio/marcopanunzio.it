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

The `sito` container builds the site and serves it over plain HTTP with nginx on `127.0.0.1:8080`.
HTTPS is handled by the reverse proxy already running on the VPS.

### Local test

```bash
docker compose up -d --build   # http://localhost:8080
docker compose down
```

### VPS

```bash
git clone git@github.com:marcopanunzio/marcopanunzio.it.git && cd marcopanunzio.it
docker compose up -d --build
```

Updates:

```bash
git pull && docker compose up -d --build
```

Reverse proxy example (nginx, TLS certificates managed as for the other containers):

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name marcopanunzio.it;

    # ssl_certificate / ssl_certificate_key ...

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

If the proxy runs in a container, put both on the same Docker network and use `proxy_pass http://marcopanunzio-it:80;` instead.

When pointing the domain to the VPS, only change the A/AAAA records: `marcopanunzio.it` is also used for email (MX, SPF, DKIM, DMARC).

The site container's nginx configuration is in `docker/nginx.conf`.
