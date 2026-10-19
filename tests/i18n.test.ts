import assert from 'node:assert/strict';
import { test } from 'node:test';
import { locales, messages, translate, isLocale } from '../src/i18n/messages';

test('every locale covers the same messages and preserves interpolation placeholders', () => {
  const keys = Object.keys(messages.ru).sort();
  for (const locale of locales) {
    assert.deepEqual(Object.keys(messages[locale]).sort(), keys);
    for (const [key, value] of Object.entries(messages[locale])) {
      assert.ok(value.trim(), `${locale}:${key}`);
      assert.deepEqual(
        value.match(/\{\w+\}/g)?.sort() ?? [],
        messages.ru[key as keyof typeof messages.ru]
          .match(/\{\w+\}/g)
          ?.sort() ?? [],
        `${locale}:${key}`,
      );
    }
    assert.ok(
      translate(locale, 'openProject', { title: 'Example' }).includes(
        'Example',
      ),
    );
  }
  assert.equal(isLocale('ja'), true);
  assert.equal(isLocale('jp'), false);
  assert.equal(
    translate('en', 'copyValue', { value: '$& <script>' }),
    'Copy $& <script>',
  );
});
