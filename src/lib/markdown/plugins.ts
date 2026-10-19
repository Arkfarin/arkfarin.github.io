import { defaultSchema } from 'rehype-sanitize';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import powershell from 'highlight.js/lib/languages/powershell';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';

export const highlightLanguages = {
  bash,
  python,
  powershell,
  javascript,
  typescript,
  json,
  css,
  xml,
};
export const markdownSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'picture', 'source'],
  attributes: {
    ...defaultSchema.attributes,
    source: ['srcSet', 'media', 'type'],
    img: [...(defaultSchema.attributes?.img ?? []), 'width', 'height'],
  },
};
