import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { parseSiteData } from '../src/lib/site-data';

const source = await readFile('tests/fixtures/site.gist', 'utf8');
const fixture = parseSiteData(source);

test('the published Gist format preserves URLs, main contact and copyable IDs', () => {
  assert.equal(fixture.projects.length, 2);
  assert.equal(fixture.links.contacts[0].value, 'https://telegram.me/arkfarin');
  assert.equal(fixture.links.contacts.filter((link) => link.main).length, 1);
  assert.equal(fixture.links.others[2].copyable, true);
  assert.equal(fixture.links.others[2].value, '123456789 (1234)');
  assert.equal(fixture.projects[0].category, undefined);
  assert.deepEqual(parseSiteData(JSON.stringify(fixture)), fixture);
});

test('comments and container characters inside strings remain literal', () => {
  const data = structuredClone(fixture);
  data.links.others.push({
    title: 'A "quoted" [title]',
    value: 'https://example.com/a//b?x=/*literal*/#{}',
  });
  assert.deepEqual(
    parseSiteData(
      `/* header */ ${JSON.stringify(data)} // footer`,
    ).links.others.at(-1),
    {
      ...data.links.others.at(-1),
      main: false,
      copyable: false,
    },
  );
});

test('empty collections are supported without hardcoded contacts or projects', () => {
  assert.deepEqual(
    parseSiteData('{"links":{"contacts":{},"others":[]},"projects":[]}'),
    {
      links: { contacts: [], others: [] },
      projects: [],
    },
  );
});

test('invalid data, duplicate slugs, ambiguous main contacts and unsafe links are rejected', () => {
  const duplicate = structuredClone(fixture);
  duplicate.projects.push(duplicate.projects[0]);
  assert.throws(
    () => parseSiteData(JSON.stringify(duplicate)),
    /duplicate slug/,
  );
  const contacts = structuredClone(fixture);
  contacts.links.contacts[1].main = true;
  assert.throws(() => parseSiteData(JSON.stringify(contacts)), /one main/);
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,hello',
    'https://user:secret@example.com',
  ]) {
    const unsafe = structuredClone(fixture);
    unsafe.links.contacts[0].value = url;
    assert.throws(() => parseSiteData(JSON.stringify(unsafe)), /HTTP/);
  }
  for (const invalid of [
    '{}; alert(1)',
    '{"links":null}',
    '{"x":1,"x":2}',
    '{"x":[1,2}',
    ' '.repeat(1_000_001),
  ])
    assert.throws(() => parseSiteData(invalid));
});
