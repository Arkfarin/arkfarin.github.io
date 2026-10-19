import GithubSlugger from 'github-slugger';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { toString } from 'mdast-util-to-string';
import { toString as hastToString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';
import type { Root } from 'hast';

export interface Heading {
  id: string;
  text: string;
  depth: number;
}
const parser = unified().use(remarkParse).use(remarkGfm);
export function getHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  visit(parser.parse(markdown), 'heading', (node) => {
    const text = toString(node, { includeImageAlt: false, includeHtml: false });
    const id = slugger.slug(text);
    if (node.depth > 1) headings.push({ id, text, depth: node.depth });
  });
  return headings;
}
export function rehypeHeadings() {
  return (tree: Root) => {
    const slugger = new GithubSlugger();
    visit(tree, 'element', (node) => {
      if (/^h[1-6]$/.test(node.tagName))
        node.properties.id = slugger.slug(hastToString(node));
    });
  };
}

// The project header already supplies the page's title; retain other H1 headings.
export function omitRepeatedTitle(markdown: string, title: string) {
  return markdown.replace(/^#\s+([^\n]+)\r?\n\s*/, (match, heading: string) =>
    heading.trim().toLowerCase() === title.toLowerCase() ? '' : match,
  );
}
