# Self-Hosting DevPockit

DevPockit is a static web app that runs entirely in the browser. You can self-host it on GitHub Pages, your own server, or any static hosting platform.

## Prerequisites

- Node.js 20+
- pnpm 10+

## Configuration

Before building, set these environment variables for self-hosting:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_BASE_URL` | Full base URL for metadata, sitemap, canonical URLs | `https://mytools.example.com` |
| `BASE_PATH` | Base path when serving from a subpath (e.g. GitHub Pages project site) | `/devpockit` or empty for root |

## Option 1: GitHub Pages (Fork)

**Best for:** Free hosting, no server required.

### Steps

1. **Fork** the repository to your GitHub account.
2. **Enable GitHub Pages:**
   - Go to **Settings → Pages**
   - Under "Build and deployment", set Source to **GitHub Actions**
3. **Deploy** by going to **Actions → Deploy to GitHub Pages → Run workflow**.

Your site will be available at:
- **Project site:** `https://<username>.github.io/<repo-name>/`
- **User/org site:** `https://<username>.github.io/` (when repo name is `username.github.io`)

The deploy workflow sets `NEXT_PUBLIC_BASE_URL` and `BASE_PATH` automatically based on your repository.

### Why syncing your fork is always safe

This project uses a two-branch model: development happens on `develop`, and `main` is only updated when a release is published. When you sync your fork, GitHub syncs `main` — which means you only ever get released, stable code. Tags always point to commits in `main`, so they are present in your fork after a sync.

### Environment variables (optional)

For **custom domains** or to override the default URL, set repository variables:

1. Go to **Settings → Secrets and variables → Actions**
2. Open the **Variables** tab
3. Click **New repository variable**
4. Add:

| Variable | Value | When to use |
|----------|-------|-------------|
| `NEXT_PUBLIC_BASE_URL` | `https://mytools.example.com` | Custom domain (e.g. `mytools.example.com`) |
| `BASE_PATH` | `` (empty) or `/subpath` | Usually empty for custom domain; use `/repo-name` if serving from subpath |

**Example (custom domain):** If your site is at `https://devtools.mycompany.com`:
- `NEXT_PUBLIC_BASE_URL` = `https://devtools.mycompany.com`
- `BASE_PATH` = (leave empty)

**Example (override default):** To force a specific GitHub Pages URL:
- `NEXT_PUBLIC_BASE_URL` = `https://username.github.io/devpockit`
- `BASE_PATH` = `/devpockit`

If these variables are not set, the workflow uses the default URL from your repository.

---

## Option 2: Docker

**Best for:** VPS, NAS, or any environment with Docker.

### Build and run

```bash
docker build -t devpockit .
docker run -p 8080:80 devpockit
```

Visit http://localhost:8080

### With custom base URL

Build with build args:

```bash
docker build \
  --build-arg NEXT_PUBLIC_BASE_URL=https://mytools.example.com \
  -t devpockit .
```

---

## Option 3: Custom Server (nginx, Apache, Caddy)

**Best for:** VPS or internal network with an existing web server.

### Build locally

```bash
pnpm install
pnpm build
```

The output is in the `out/` directory. Copy it to your web server's document root.

### nginx

```nginx
server {
    listen 80;
    root /path/to/out;
    index index.html;

    location / {
        try_files $uri $uri/ $uri/index.html /index.html;
    }

    location /_next/static/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

See [docker/nginx.conf](../docker/nginx.conf) for a full example.

### Apache

Add to `.htaccess` in the `out/` directory:

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Caddy

```bash
caddy file-server --root out
```

Or with a Caddyfile:

```
:80 {
    root * /path/to/out
    file_server
    try_files {path} {path}/ {path}/index.html /index.html
}
```

---

## Option 4: Netlify, Vercel, Cloudflare Pages

**Best for:** Managed static hosting with CI/CD.

### Build settings

| Setting | Value |
|---------|-------|
| Build command | `pnpm install && pnpm build` |
| Output directory | `out` |
| Node version | 20 |
| Package manager | pnpm |

Enable pnpm: set `NPM_FLAGS=--package-manager=pnpm` or use `corepack enable` in the build.

### Environment variables

Set `NEXT_PUBLIC_BASE_URL` to your deployment URL (e.g. `https://your-app.netlify.app`).

### Netlify

Create `netlify.toml` in the project root:

```toml
[build]
  command = "pnpm install && pnpm build"
  publish = "out"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--package-manager=pnpm"
```

### Vercel

Create `vercel.json`:

```json
{
  "buildCommand": "pnpm install && pnpm build",
  "outputDirectory": "out",
  "framework": null,
  "installCommand": "pnpm install"
}
```

### Cloudflare Pages

In the dashboard, set:
- Build command: `pnpm install && pnpm build`
- Build output directory: `out`
- Environment variable: `NODE_VERSION=20`

---

## Testing locally

After building:

```bash
pnpm serve:build
```

Visit http://localhost:8080
