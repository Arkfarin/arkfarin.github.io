# ARKFARIN

Source code for [ark.farin.cc](https://ark.farin.cc), my personal website.
The project catalog and links come from a Gist; project READMEs come from their GitHub repositories.

## Stack and structure

React 19, React Router, strict TypeScript, Vite, CSS Modules and CSS Custom Properties.
Markdown uses react-markdown, remark-gfm, rehype-raw and rehype-sanitize.
Lowlight/Highlight.js provides syntax highlighting for a limited set of languages.
ESLint and Prettier handle code quality and formatting.

```text
src/
  app/                 application shell and routes
  pages/               Home, Projects, Project, NotFound
  components/
    layout/            Header, Navigation, Footer
    home/              Hero, About, Projects, OtherLinks, Contact, SocialLinks
    projects/          cards, grid, Markdown, code and table of contents
    ui/                theme and language controls, shared UI primitives
  hooks/               theme, menus, clipboard, scrolling, media queries, reveals
  i18n/                translations and language preferences
  lib/                 Markdown, links, anchors, highlighting, loading and theme
  data/                Gist data context, README loading and navigation
  styles/              reset, tokens, typography, global styles and animations
  types/               data models
  main.tsx             client entry point
  entry-server.tsx     prerendering with the same components
public/
  assets/              favicon, social image, fonts and licenses
  theme-init.js        theme and language selection before the first paint
  preloader.css        animated loading screen
scripts/               prerendering with Gist data
```

Component styles live alongside their components. `Primitives.module.css` contains
shared visual elements: link buttons, section labels and accent text.
Global CSS does not style individual components. The `@/` alias points to `src/`.

## Getting started

Use Node.js **22.12+** and npm. The deployment workflow uses Node.js 24.

```bash
npm ci
npm run dev
```

Vite prints the local URL. To preview the production build:

```bash
npm run build
npm run preview
```

The build runs TypeScript checking, the Vite client build, a temporary server build
and static prerendering with **the same React components**. It produces `dist/index.html`,
`dist/projects/index.html`, `dist/projects/<slug>/index.html`, `dist/404.html` and
assets, `sitemap.xml`, `robots.txt` and `llms.txt`. The temporary `.ssr/` directory
is removed. Hosting does not require Node.js.

Home content, the project catalog, and each project's title, description,
technologies and repository link are visible in HTML without JavaScript.
The client hydrates this snapshot, then refreshes the Gist in the background.
If the Gist is unavailable, the snapshot remains visible with an error message
and a retry button.

The build does not fetch READMEs or embed their source in HTML. A README is
requested only after its project page opens in the browser; the project's header
stays usable while it loads. Successful requests are cached for the session.
An unavailable README shows a retry button and a GitHub source link without
blocking the rest of the page or the site build.

`dist/` is generated output: do not edit it or commit it to Git.

## Data, projects and links

The [Gist](https://gist.github.com/Arkfarin/1a4b2ba90dde5629ace2f9330522f0cd/raw)
is the only source for the project catalog and contact/profile links.
The build fetches this URL. The browser uses its final URL on
`gist.githubusercontent.com`, since the redirect from `gist.github.com` does not
include CORS headers. Data is fetched once when the site opens, with a 15-second
timeout. Internal navigation reuses the loaded data.

The parser supports standard JSON, comments and the Gist's existing format with
`["title": ...]` objects inside `{ ... }` collections. Remote text is parsed without
`eval`; URLs, fields, unique slugs and the single `main` contact are validated.
The recommended format for new entries is:

```json
{
  "links": {
    "contacts": [
      {
        "title": "Telegram",
        "value": "https://telegram.me/arkfarin",
        "alt": "arkfarin",
        "main": true,
        "background": "https://example.com/telegram.webp"
      }
    ],
    "others": [
      {
        "title": "Steam",
        "value": "https://steamcommunity.com/id/arkfarin",
        "background": "https://example.com/steam.gif"
      },
      { "title": "MLBB", "value": "123456789 (1234)", "copyable": true }
    ]
  },
  "projects": [
    {
      "slug": "my-project",
      "title": "My Project",
      "description": "A short project description.",
      "background": "https://example.com/project.webp",
      "technologies": ["Python"],
      "repository": "https://github.com/owner/my-project",
      "branch": "main",
      "readme_blob_sha": ""
    }
  ]
}
```

`contacts` populates `#contact`; the single entry with `main: true` defines the main
contact button. `others` populates the Other links section (`#links`). `alt` is an
optional caption; empty or whitespace-only strings are treated as omitted.
`copyable: true` creates a button that copies the exact `value`
and displays feedback, or a selectable value if clipboard access fails.

Each entry in `projects`, `links.contacts` and `links.others` supports an optional
`background` field with a direct HTTP(S) image URL. This includes GIF, WebP, PNG,
JPEG, AVIF and SVG when supported by the browser. The image appears behind the
project card or link, including the main contact button and copyable values.
Images fill their container with centered cropping and **80% opacity**, with a
horizontal tint for text readability. Only the left and right edges fade to
transparency; there is no bottom shadow or vertical fade. Hovering or focusing a
link gently zooms and shifts its image while the edge mask stays fixed. This
animation is disabled for reduced motion. Copy feedback
temporarily covers the image with a red fill and a confirmation label. Entries
without `background` keep their regular appearance. Image loading failures do not
prevent opening links or copying values.

The home page shows the first **two** projects. If there are more, a More projects
link appears below the cards. The **Projects** page (`/projects/`) shows all entries.
Projects are defined in the Gist; client routes and cards are
created from the data. READMEs are fetched using `repository` and `branch`, while
`readme_blob_sha` forms part of the cache key. `category` and `language` are optional.

A new route needs a rebuild to receive its own static HTML on hosts without an SPA
fallback. GitHub Pages serves `404.html` for routes not included in the build.
Once JavaScript loads, the client can display the project from the Gist, but the
HTTP status remains 404.
After changing the Gist, run the **Deploy to GitHub Pages** workflow manually on
`main` (or push a site change) to update static pages and the sitemap together.

The footer also includes MyNickname and Farin Works. These fixed links live in
`src/data/navigation.ts` and open in a new tab.

## Preloader

The animated wordmark runs in both development and production. On the home page,
it moves into the Hero while the accent band and introductory text appear.
Other pages and deep links use a short fade.

The application activates the preloader after its JavaScript loads. Without
JavaScript, or if the application bundle fails to load, the prerendered HTML
remains visible. A 10-second fallback dismisses a stalled loader.
Progress follows site data (40%), fonts (15%), document loading (10%) and rendering
(35%), with a 500 ms minimum. In production, the embedded snapshot completes the
data step immediately while the Gist refreshes in the background.
Reduced motion skips the exit animation.

## Markdown and images

Edit each project's README in its own repository. The renderer supports headings,
nested lists, tables, task lists, strikethrough, links, images, quotes and fenced
code blocks. A leading H1 matching the project title is not repeated in the UI.
The table of contents uses H2–H6 headings; duplicate headings receive distinct anchors.

HTML inside READMEs is sanitized. Supported elements include `picture`, `source`
and `img`, along with alignment attributes. Scripts, event handlers and unsafe
URLs are removed. To enable highlighting, specify a language after the opening
triple backticks: `bash`, `python`, `powershell`, `javascript`, `typescript`, `json`,
`css`, `xml` or their aliases. Unknown languages remain readable plain text.
Additional languages can be registered in `src/lib/markdown/plugins.ts`.

Relative links resolve from the root of the **project repository** containing the
README: links point to GitHub's `blob/<branch>/` paths, and images point to
`raw.githubusercontent.com`. `#section` fragments stay local. Images use the URLs
from the README. Download .md saves the loaded README without another network request.

## Languages, themes and accessibility

The language selector supports **EN / RU / UK / JA / ZH / KY**: English, Russian,
Ukrainian, Japanese, Simplified Chinese and Kyrgyz. **English is the default**,
including prerendered HTML and page metadata. The selection is stored under
`arkfarin-language`, survives navigation and reloads, and syncs across tabs.
If localStorage is blocked, language changes still work in the current tab.

Translations cover the interface: navigation, home page copy, actions, errors,
page metadata and screen reader labels. Gist data and project READMEs retain
their original text. Dictionaries live in `src/i18n/locales/`; TypeScript checks
that all six languages use the same set of keys.

Sections fade and move into place on scroll, and interactive elements respond
to hover. Without JavaScript, section content is visible immediately.

Colors, dimensions, spacing, radii, durations and z-index values live in
`src/styles/tokens.css`. The `<html>` attribute `data-theme="light|dark"` selects
the palette. `public/theme-init.js` runs before the first paint: a saved
`arkfarin-theme` preference takes priority, otherwise the system theme is used.
Without a saved choice, the theme follows OS changes; explicit choices sync
across tabs. To return to the system theme, remove `arkfarin-theme` from
localStorage and reload.

The menu closes when a link is selected, Escape is pressed, a click or focus moves
outside it, or the viewport crosses the mobile breakpoint. The site includes a
skip link, visible focus indicators and
semantic landmarks. CSS handles hover and entrance animations;
IntersectionObserver handles section reveals. Hooks clean up listeners,
observers, timers and animation frames. Reduced motion disables movement and
smooth scrolling.

## Types and code style

```bash
npm run typecheck
npm run lint
npm run format:check
```

## Static hosting

SEO settings live in `src/lib/seo.ts`. The build and browser share titles,
descriptions, canonical URLs, robots directives, Open Graph, Twitter Cards and
JSON-LD (`WebSite`, `Person`, `ProfilePage`, project information and breadcrumbs).
The 404 page has `noindex`; valid client routes reset it. English is the indexed
default; language preferences do not create separate localized URLs or `hreflang`.

The shared social image is `public/assets/og-card.png` (1200 × 630). Its editable
source is `scripts/og-card.html`, using the existing local fonts and logo.
To regenerate it with Playwright installed:

```bash
npx playwright screenshot --viewport-size="1200,630" --wait-for-timeout=1000 \
  "file://$(pwd)/scripts/og-card.html" public/assets/og-card.png
```

`robots.txt` allows all crawlers and advertises the generated sitemap. `llms.txt`
is an optional human-readable index of the site's actual pages; it is not a
requirement for AI search inclusion. Every crawler receives the same content.
Google's [AI search guidance](https://developers.google.com/search/docs/appearance/ai-features)
and [Yandex's rendering documentation](https://yandex.ru/support/webmaster/ru/yandex-indexing/rendering)
both make accessible page content the practical foundation.

`SITE_URL` sets the canonical HTTPS origin (default `https://ark.farin.cc`).
It is shared by the static and browser builds, sitemap, robots and structured
data. If the domain changes, also update the visible domain in the OG source
and regenerate the image.

Publish the contents of `dist/`. Known routes already have their own `index.html`,
so direct links and page reloads work on a regular file server. Configure unknown
URLs to serve `404.html` with a 404 status. Hosts with an SPA fallback are also
supported, but their HTTP status depends on the server configuration.
`vite preview` is intended for local previews only.

Use `base: '/'` for `arkfarin.github.io` and `ark.farin.cc`. For a subdirectory,
build with a setting such as `SITE_BASE=/portfolio/ npm run build`. The path must
start and end with `/`; a relative `./` base is not supported.

The [GitHub Pages workflow](.github/workflows/pages.yml) runs on pushes to `main`,
pull requests targeting `main`, and manual dispatch. It installs dependencies
with `npm ci` on Node.js 24 and runs `npm run build`.
Pushes and manual runs on `main` publish `dist/` to GitHub Pages;
pull requests build the site without publishing.

In the repository, set **Settings → Pages → Build and deployment → Source** to
**GitHub Actions**. The `github-pages` environment must allow deployment from
`main`. To use a custom domain, set `ark.farin.cc` in Pages settings and configure
DNS. See [Vite's static deployment guide](https://vite.dev/guide/static-deploy.html)
and [GitHub's Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
Local npm commands do not publish the site or change remote hosting settings.

After publication, verify HTTPS, redirects to the canonical hostname, HTTP 200
on real pages and HTTP 404 on missing URLs. Submit `/sitemap.xml` in Google Search
Console and Yandex Webmaster, inspect the rendered HTML and test social previews.
For a subdirectory deployment, the host still needs a robots.txt at the origin
root pointing to that subdirectory's sitemap.
