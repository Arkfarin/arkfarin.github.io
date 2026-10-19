import { createLowlight } from 'lowlight';
import { toString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';
import type { Root } from 'hast';
import { highlightLanguages } from './plugins';

const highlighter = createLowlight(highlightLanguages);
export function rehypeCodeHighlight() {
  return (tree: Root) => {
    visit(tree, 'element', (node, _index, parent) => {
      if (
        node.tagName !== 'code' ||
        parent?.type !== 'element' ||
        parent.tagName !== 'pre'
      )
        return;
      const classes = Array.isArray(node.properties.className)
        ? node.properties.className.map(String)
        : [];
      if (classes.includes('no-highlight') || classes.includes('nohighlight'))
        return;
      const language = classes
        .find((name) => name.startsWith('language-'))
        ?.slice(9);
      if (!language || !highlighter.registered(language)) return;
      node.children = highlighter
        .highlight(language, toString(node))
        .children.filter((child) => child.type !== 'doctype');
      node.properties.className = [...classes, 'hljs'];
    });
  };
}
