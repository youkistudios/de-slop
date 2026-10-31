'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { analyze, clean, SAMPLE, PATTERNS } = require('./playground.js');

const HUMAN = [
  'I rewrote the opening this morning.',
  'The second sentence was doing too much, so I cut it and let the example carry the point.',
  'The draft is shorter now, and it sounds like me.'
].join(' ');

test('pattern list is one extensible array', () => {
  assert.ok(Array.isArray(PATTERNS));
  assert.ok(PATTERNS.length >= 8);
  const ids = PATTERNS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const pattern of PATTERNS) {
    assert.equal(typeof pattern.name, 'string');
    assert.equal(typeof pattern.find, 'function');
  }
});

test('sample paragraph produces findings', () => {
  const report = analyze(SAMPLE);
  const ids = new Set(report.findings.map((f) => f.patternId));
  assert.ok(report.tellCount >= 8);
  assert.ok(report.findings.some((f) => f.disposition === 'rewritten'));
  assert.ok(report.findings.some((f) => f.disposition === 'flagged'));
  for (const id of ['throat', 'not-just', 'not-only', 'antithesis', 'triplet', 'em-dash', 'seesaw', 'hedge', 'restate', 'puffery']) {
    assert.ok(ids.has(id), 'missing pattern ' + id);
  }
  assert.ok(report.scoreBefore > report.scoreAfter);
  assert.ok(report.afterTellCount < report.tellCount);
  assert.equal(report.cleaned.includes("In today's rapidly evolving landscape"), false);
  assert.equal(report.cleaned.includes("it's important to note that"), false);
  assert.equal(report.cleaned.includes("isn't just"), false);
  assert.equal(report.cleaned.includes('not only'), false);
  assert.equal(report.cleaned.includes('It could be said that'), false);
  assert.equal(report.cleaned.includes('In conclusion'), false);
  assert.equal(report.cleaned.includes('potentially'), false);
  assert.equal(report.cleaned.includes('not spectacle'), false);
  assert.equal(report.cleaned.includes('not clutter'), true);
  assert.equal(report.cleaned.includes('clear, concise, and compelling'), true);
  assert.ok((report.cleaned.match(/\u2014/g) || []).length <= 2);
});

test('clean human paragraph produces zero findings', () => {
  const report = analyze(HUMAN);
  assert.equal(report.tellCount, 0);
  assert.equal(report.afterTellCount, 0);
  assert.equal(report.cleaned, HUMAN);
  assert.deepEqual(report.findings, []);
});

test('cleaning is idempotent', () => {
  const once = clean(SAMPLE);
  assert.equal(clean(once), once);
  assert.equal(clean(clean(once)), once);
  const again = analyze(once);
  assert.equal(again.findings.some((f) => f.disposition === 'rewritten'), false);
  assert.equal(again.cleaned, once);
  assert.equal(clean(HUMAN), HUMAN);
  assert.equal(clean(clean(HUMAN)), HUMAN);
  assert.equal(clean(''), '');
  assert.equal(clean(clean('')), '');
});

test('safe rewrites say Y, strip frames, and cap em dashes', () => {
  assert.equal(
    clean("It's not just a tool, it's a revolution."),
    "It's a revolution."
  );
  assert.equal(
    clean("It’s not just a tool, it’s a revolution."),
    "It's a revolution."
  );
  assert.equal(
    clean("This product isn't just a tool, it's a revolution."),
    'This product is a revolution.'
  );
  assert.equal(
    clean('It serves not only startups but also enterprises.'),
    'It serves enterprises.'
  );
  assert.equal(
    clean("In today's rapidly evolving landscape, the draft sat for a week."),
    'The draft sat for a week.'
  );
  assert.equal(
    clean("It's important to note that the kiln was cold."),
    'The kiln was cold.'
  );
  assert.equal(
    clean('It could be said that the kiln was cold.'),
    'The kiln was cold.'
  );
  assert.equal(
    clean('In conclusion, the kiln was cold.'),
    'The kiln was cold.'
  );
  assert.equal(
    clean('The kiln could potentially cool overnight.'),
    'The kiln could cool overnight.'
  );
  assert.equal(
    clean('One \u2014 two \u2014 three \u2014 four.'),
    'One \u2014 two \u2014 three, four.'
  );
});

test('a single antithesis, triplet, see-saw, or puffery phrase is left', () => {
  const contrast = 'This is an edit, not a rewrite.';
  const contrastReport = analyze(contrast);
  assert.equal(contrastReport.cleaned, contrast);
  assert.equal(contrastReport.tellCount, 1);
  assert.equal(contrastReport.findings[0].patternId, 'antithesis');
  assert.equal(contrastReport.findings[0].disposition, 'flagged');

  const pair = 'This is clarity, not clutter, and it is speed, not spectacle.';
  assert.equal(clean(pair), 'This is clarity, not clutter, and it is speed.');

  const triplet = 'The notes were clear, concise, and compelling.';
  const tripletReport = analyze(triplet);
  assert.equal(tripletReport.cleaned, triplet);
  assert.equal(tripletReport.findings.some((f) => f.patternId === 'triplet'), true);

  const seesaw = 'On the one hand the kiln holds heat, and on the other hand it cracks.';
  assert.equal(clean(seesaw), seesaw);

  const puff = 'The draft is a testament to patience.';
  const puffReport = analyze(puff);
  assert.equal(puffReport.cleaned, puff);
  assert.equal(puffReport.findings.some((f) => f.patternId === 'puffery'), true);

  const withinCap = 'The kiln \u2014 still hot.';
  const capReport = analyze(withinCap);
  assert.equal(capReport.cleaned, withinCap);
  assert.equal(capReport.tellCount, 0);
  assert.equal(capReport.findings[0].disposition, 'kept');
});
