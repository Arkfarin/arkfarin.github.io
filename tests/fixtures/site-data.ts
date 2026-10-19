import { parseSiteData } from '../../src/lib/site-data';

// Synthetic input exercises the Gist syntax without storing a live catalog.
export const gist = `{
  "links": {
    "contacts": {
      ["title": "Contact", "value": "https://example.com/contact", "main": true],
      ["title": "Other contact", "value": "https://example.com/other"]
    },
    "others": {
      ["title": "Profile", "value": "https://example.com/profile"],
      ["title": "Game ID", "value": "1234 (56)", "copyable": true]
    }
  },
  "projects": [
    {
      "slug": "alpha",
      "title": "Alpha",
      "description": "Example project A.",
      "technologies": ["TypeScript"],
      "repository": "https://github.com/example/alpha"
    },
    {
      "slug": "beta",
      "title": "Beta",
      "description": "Example project B.",
      "technologies": ["Python"],
      "repository": "https://github.com/example/beta"
    }
  ]
}`;
export const siteData = parseSiteData(gist);
