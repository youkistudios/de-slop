/**
 * de-slop playground.
 *
 * Rules follow skills/de-slop/SKILL.md: durable structural tells, an edit
 * rather than a rewrite. A "rewritten" cut is mechanically safe (a filler
 * frame, "say Y", an em dash past the cap of two). "flagged" is left for a
 * human. "kept" is noted and spared — the em-dash cap, or the one antithesis
 * the pass allows when several are present.
 *
 * To add a tell, push an object onto PATTERNS. find(text) returns zero or
 * more { start, end, disposition, note, replacement? }.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.DeSlop = api;
  if (typeof document !== 'undefined') {
    var start = function () { mount(api); };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SAMPLE = [
    "In today's rapidly evolving landscape, it's important to note that this product isn't just a tool, it's a revolution.",
    'The work is clear, concise, and compelling \u2014 a testament to what happens when teams truly delve into the tapestry of modern work.',
    'This is clarity, not clutter, and it is speed, not spectacle.',
    'On the one hand it saves time, and on the other hand it builds trust.',
    'It could be said that the results speak for themselves \u2014 perhaps more than any dashboard \u2014 and more than any slide.',
    'In conclusion, the platform could potentially unlock their potential and serve not only startups but also enterprises \u2014 seamlessly and at scale.'
  ].join(' ');

  // Sentence-initial throat clearing. The durable frame, not a word list.
  var OPENERS = [
    /^in today's (?:rapidly |ever-)?(?:evolving|fast-paced|digital|modern|competitive|changing) (?:world|landscape|environment|age|era),\s+/i,
    /^in the (?:ever-evolving|rapidly evolving|ever-changing) (?:landscape|world)(?: of [^,\n]{0,40})?,\s+/i,
    /^in the realm of [^,\n]{2,50},\s+/i,
    /^in a world where [^,\n]{2,80},\s+/i,
    /^when it comes to [^,\n]{2,60},\s+/i,
    /^let's (?:dive in|delve in|delve into this)[.!]?\s+/i
  ];

  // "It's important to note that" can sit after a comma, so it is not anchored.
  var NOTE_THAT = /\bit's (?:important|worth) (?:to note|noting|mentioning|to remember|to understand) that\s+/gi;

  var RESTATE = /^(?:in conclusion|in summary|to summarize|to sum up|all in all|at the end of the day|in the final analysis),\s+/i;

  // Empty hedge frames. The claim is the clause after them.
  var HEDGE_FRAMES = [
    /\bit could be said that\s+/gi,
    /\bit might be argued that\s+/gi,
    /\bone might argue that\s+/gi,
    /\bit is often said that\s+/gi
  ];

  // Single hedges and filler adverbs are voice calls. Density is the tell;
  // a blocklist cannot settle it, so these are flagged and left.
  var HEDGE_WORDS = /\b(?:perhaps|arguably|somewhat)\b|\bin a sense\b/gi;
  var FILLER_ADVERBS = /\b(?:truly|incredibly|fundamentally)\b/gi;

  // Stock puffery the skill names as a class. Flagged, never auto-deleted:
  // the README rejects word-blocklists because one deliberate use can be craft.
  var PUFFERY = [
    { re: /\ba testament to\b/gi },
    { re: /\b(?:rich )?tapestry\b/gi },
    { re: /\bdelve(?:s|d|ing)?(?:\s+into)?\b/gi },
    { re: /\bplays? (?:a |an )?(?:vital|key|crucial|important|pivotal) role\b/gi },
    { re: /\bunlock(?:s|ed|ing)? (?:their|its|your|our|the) potential\b/gi },
    { re: /\bgame[- ]changer\b/gi },
    { re: /\bthe results speak for themselves\b/gi },
    { re: /\bseamlessly\b/gi },
    { re: /\bholistically\b/gi },
    { re: /\bcutting-edge\b/gi },
    { re: /\bnestled\b/gi }
  ];

  function scan(text, regex, build) {
    var flags = regex.flags.indexOf('g') === -1 ? regex.flags + 'g' : regex.flags;
    var re = new RegExp(regex.source, flags);
    var out = [];
    var match;
    while ((match = re.exec(text)) !== null) {
      if (match[0] === '') {
        re.lastIndex += 1;
        continue;
      }
      var built = build(match);
      if (built) out.push(built);
    }
    return out;
  }

  function sentenceStarts(text) {
    var starts = [0];
    var re = /[.!?]["']?\s+/g;
    var match;
    while ((match = re.exec(text)) !== null) {
      var at = match.index + match[0].length;
      if (at < text.length) starts.push(at);
    }
    var nl = /\n+/g;
    while ((match = nl.exec(text)) !== null) {
      var nlAt = match.index + match[0].length;
      if (nlAt < text.length) starts.push(nlAt);
    }
    starts.sort(function (a, b) { return a - b; });
    var uniq = [];
    for (var i = 0; i < starts.length; i += 1) {
      if (i === 0 || starts[i] !== starts[i - 1]) uniq.push(starts[i]);
    }
    return uniq;
  }

  function findAnchored(text, regex, build) {
    var flags = regex.flags.replace('g', '');
    var out = [];
    var starts = sentenceStarts(text);
    for (var i = 0; i < starts.length; i += 1) {
      var start = starts[i];
      var re = new RegExp(regex.source, flags);
      var match = re.exec(text.slice(start));
      if (!match || match.index !== 0) continue;
      var built = build(match, start);
      if (built) out.push(built);
    }
    return out;
  }

  function span(match, start, disposition, note, replacement) {
    var at = start == null ? match.index : start;
    return {
      start: at,
      end: at + match[0].length,
      disposition: disposition,
      note: note,
      replacement: replacement
    };
  }

  function findOpeners(text) {
    var out = [];
    for (var i = 0; i < OPENERS.length; i += 1) {
      out = out.concat(findAnchored(text, OPENERS[i], function (match, start) {
        return span(match, start, 'rewritten', 'Stripped a throat-clearing opener so the sentence starts on the claim.', '');
      }));
    }
    out = out.concat(scan(text, NOTE_THAT, function (match) {
      return span(match, null, 'rewritten', 'Stripped a throat-clearing frame (“it’s important to note that”). The claim stays.', '');
    }));
    return out;
  }

  function findRestate(text) {
    return findAnchored(text, RESTATE, function (match, start) {
      return span(match, start, 'rewritten', 'Stripped a summary closer. The pass cuts restate-conclusions instead of letting them re-announce the point.', '');
    });
  }

  function yClause(clause) {
    return clause.replace(/^(?:it|this|that|there|they|he|she)(?:'s| is|'re| are| was| were)\s+/i, '');
  }

  function positiveCopula(verb) {
    var v = verb.toLowerCase();
    if (v === "isn't" || v === 'is not') return 'is';
    if (v === "aren't" || v === 'are not') return 'are';
    if (v === "wasn't" || v === 'was not') return 'was';
    if (v === "weren't" || v === 'were not') return 'were';
    return 'is';
  }

  // "It's not (just) X, it's Y" — delete the setup, say Y.
  var NOT_JUST_ITS = /\b(It|This|That|There)('s| is)\s+not\s+(?:just\s+|only\s+|merely\s+)?([^,\n]{1,80}?),\s+((?:it|this|that|there)(?:'s| is)\s+[^.;!\n]+)/gi;

  // "this product isn't just a tool, it's a revolution" — keep the subject, say Y.
  // The subject cannot start on "that"/"note", or it swallows the throat-clearing frame in front of it.
  var ISNT_JUST = /\b(?!(?:that|note|important|worth)\b)((?:[A-Za-z][\w'-]+)(?:\s+(?!that\b)[A-Za-z][\w'-]*){0,4})\s+(isn't|is not|aren't|are not|wasn't|was not|weren't|were not)\s+(?:just|only|merely)\s+([^,\n]{1,80}?),\s+((?:it|this|that|there|they|he|she)(?:'s| is|'re| are| was| were)\s+[^.;!\n]+)/gi;

  var NOT_ONLY = /\bnot\s+only\s+[^.;!\n]{1,80}?,?\s+but\s+(?:also\s+)?/gi;

  function findNotJust(text) {
    var its = scan(text, NOT_JUST_ITS, function (match) {
      return span(match, null, 'rewritten', 'Deleted the “it’s not X, it’s Y” setup and kept Y.', match[4]);
    });
    var isnt = scan(text, ISNT_JUST, function (match) {
      var subject = match[1];
      var verb = positiveCopula(match[2]);
      var complement = yClause(match[4]);
      return span(match, null, 'rewritten', 'Deleted the “not just X” setup and stated Y.', subject + ' ' + verb + ' ' + complement);
    });
    return its.concat(isnt);
  }

  function findNotOnly(text) {
    return scan(text, NOT_ONLY, function (match) {
      return span(match, null, 'rewritten', 'Cut “not only … but also” and kept Y.', '');
    });
  }

  function findHedges(text) {
    var out = [];
    for (var i = 0; i < HEDGE_FRAMES.length; i += 1) {
      out = out.concat(scan(text, HEDGE_FRAMES[i], function (match) {
        return span(match, null, 'rewritten', 'Stripped an empty hedge frame. The clause after it is the claim.', '');
      }));
    }
    out = out.concat(scan(text, /\b(could|may|might)\s+potentially\b/gi, function (match) {
      return span(match, null, 'rewritten', 'Dropped the stacked “potentially”. The modal already hedges.', match[1]);
    }));
    out = out.concat(scan(text, HEDGE_WORDS, function (match) {
      return span(match, null, 'flagged', 'Hedge. Cutting it changes how sure the sentence sounds, so it stays for a human.', null);
    }));
    return out;
  }

  function findFiller(text) {
    return scan(text, FILLER_ADVERBS, function (match) {
      return span(match, null, 'flagged', 'Filler adverb. It is often empty and sometimes emphasis. Left for a human.', null);
    });
  }

  function findPuffery(text) {
    var out = [];
    for (var i = 0; i < PUFFERY.length; i += 1) {
      out = out.concat(scan(text, PUFFERY[i].re, function (match) {
        return span(
          match,
          null,
          'flagged',
          'Stock puffery. Left for a human, because a blocklist cannot tell this from a word the author chose.',
          null
        );
      }));
    }
    return out;
  }

  function findEmDashes(text) {
    var raw = scan(text, / \u2014 | -- |\u2014|--/g, function (match) {
      var replacement = (match[0] === ' \u2014 ' || match[0] === ' -- ') ? ', ' : ',';
      return {
        start: match.index,
        end: match.index + match[0].length,
        replacement: replacement
      };
    });
    return raw.map(function (item, index) {
      var over = raw.length > 2 && index >= 2;
      if (!over) {
        return {
          start: item.start,
          end: item.end,
          disposition: 'kept',
          replacement: null,
          note: 'Within the cap of two em dashes per piece. Left as-is.'
        };
      }
      return {
        start: item.start,
        end: item.end,
        disposition: 'rewritten',
        replacement: item.replacement,
        note: 'Swapped an em dash past the cap of two for a comma.'
      };
    });
  }

  var ANTITHESIS = /,\s+not\s+(?!because\b|that\b|to\b|only\b|just\b|merely\b|yet\b)([A-Za-z][^,;:!?\n]{0,40}?)(?=\s*[,.;:!?]|$)/g;

  function findAntithesis(text) {
    var raw = scan(text, ANTITHESIS, function (match) {
      return { start: match.index, end: match.index + match[0].length };
    });
    return raw.map(function (item, index) {
      if (raw.length === 1 || index === 0) {
        return {
          start: item.start,
          end: item.end,
          disposition: 'flagged',
          replacement: null,
          note: raw.length === 1
            ? 'One “X, not Y” contrast. A single antithesis can be craft when it does real semantic work, so it stays.'
            : 'Kept as the one antithesis the pass allows. A human should decide whether this one does real work.'
        };
      }
      return {
        start: item.start,
        end: item.end,
        disposition: 'rewritten',
        replacement: '',
        note: 'Cut the “not …” tail. The pass states the thing and keeps at most one contrast.'
      };
    });
  }

  var TRIPLET = /\b([A-Za-z][\w'-]{2,})\s*,\s*([A-Za-z][\w'-]{2,})\s*,\s*and\s+([A-Za-z][\w'-]{2,})\b/g;

  function findTriplets(text) {
    return scan(text, TRIPLET, function (match) {
      var lens = [match[1].length, match[2].length, match[3].length];
      var max = Math.max.apply(null, lens);
      var min = Math.min.apply(null, lens);
      if (max - min > 8) return null;
      return span(
        match,
        null,
        'flagged',
        'Reflexive triplet. Breaking one changes which claim survives, so the choice stays with a human.',
        null
      );
    });
  }

  var SEESAW = /\bon the one hand\b[\s\S]{8,180}?\bon the other(?:\s+hand)?\b/gi;

  function findSeesaw(text) {
    return scan(text, SEESAW, function (match) {
      return span(
        match,
        null,
        'flagged',
        'Balanced see-saw. Making it asymmetric means choosing which half leads. Left for a human.',
        null
      );
    });
  }

  var PATTERNS = [
    { id: 'throat', name: 'Throat-clearing opener', find: findOpeners },
    { id: 'restate', name: 'Restate-conclusion', find: findRestate },
    { id: 'not-just', name: "It's not just X, it's Y", find: findNotJust },
    { id: 'not-only', name: 'not only… but also', find: findNotOnly },
    { id: 'hedge', name: 'Hedge', find: findHedges },
    { id: 'em-dash', name: 'Em-dash punchline', find: findEmDashes },
    { id: 'antithesis', name: '“X, not Y” antithesis', find: findAntithesis },
    { id: 'triplet', name: 'Reflexive triplet', find: findTriplets },
    { id: 'seesaw', name: 'Balanced see-saw', find: findSeesaw },
    { id: 'filler', name: 'Filler adverb', find: findFiller },
    { id: 'puffery', name: 'Puffery', find: findPuffery }
  ];

  function overlaps(a, b) {
    return a.start < b.end && a.end > b.start;
  }

  function resolveRewrites(items) {
    var sorted = items.slice().sort(function (a, b) {
      return a.priority - b.priority || a.start - b.start;
    });
    var kept = [];
    for (var i = 0; i < sorted.length; i += 1) {
      var item = sorted[i];
      var hit = false;
      for (var k = 0; k < kept.length; k += 1) {
        if (overlaps(item, kept[k])) {
          hit = true;
          break;
        }
      }
      if (!hit) kept.push(item);
    }
    return kept;
  }

  function detect(text) {
    var rewritten = [];
    var others = [];
    for (var p = 0; p < PATTERNS.length; p += 1) {
      var pattern = PATTERNS[p];
      var found = pattern.find(text) || [];
      for (var i = 0; i < found.length; i += 1) {
        var item = found[i];
        if (item.end <= item.start) continue;
        var row = {
          patternId: pattern.id,
          name: pattern.name,
          priority: p,
          start: item.start,
          end: item.end,
          disposition: item.disposition,
          replacement: item.disposition === 'rewritten' ? String(item.replacement) : null,
          note: item.note
        };
        if (row.disposition === 'rewritten') rewritten.push(row);
        else others.push(row);
      }
    }
    var safe = resolveRewrites(rewritten);
    var rest = [];
    for (var r = 0; r < others.length; r += 1) {
      var flag = others[r];
      var inside = false;
      for (var s = 0; s < safe.length; s += 1) {
        if (flag.start >= safe[s].start && flag.end <= safe[s].end) {
          inside = true;
          break;
        }
      }
      if (!inside) rest.push(flag);
    }
    return safe.concat(rest).sort(function (a, b) {
      return a.start - b.start || a.end - b.end;
    });
  }

  function applyRewrites(text, findings) {
    var rewrites = findings.filter(function (f) {
      return f.disposition === 'rewritten';
    }).sort(function (a, b) {
      return b.start - a.start;
    });
    var out = text;
    var limit = Infinity;
    for (var i = 0; i < rewrites.length; i += 1) {
      var f = rewrites[i];
      if (f.end > limit) continue;
      out = out.slice(0, f.start) + f.replacement + out.slice(f.end);
      limit = f.start;
    }
    return out;
  }

  function normalize(text) {
    var t = text.replace(/[ \t]+\n/g, '\n');
    t = t.replace(/[ \t]{2,}/g, ' ');
    t = t.replace(/\s+([,.;:!?])/g, '$1');
    t = t.replace(/,([^\s\d])/g, ', $1');
    t = t.replace(/(^|[.!?]\s+)([a-z])/g, function (full, lead, ch, offset, whole) {
      if (lead.charAt(0) === '.') {
        var periodAt = offset + lead.indexOf('.');
        var prev = whole.charAt(periodAt - 1);
        var prev2 = periodAt >= 2 ? whole.charAt(periodAt - 2) : '';
        if (prev && /[A-Z]/.test(prev) && (!prev2 || /\s/.test(prev2))) return full;
      }
      return lead + ch.toUpperCase();
    });
    return t.trim();
  }

  function foldApostrophes(text) {
    return text.replace(/[’‘]/g, "'");
  }

  function wordCount(text) {
    var trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }

  function per100(tells, words) {
    if (!words) return 0;
    return Math.round((tells / words) * 1000) / 10;
  }

  function tellCountOf(findings) {
    var n = 0;
    for (var i = 0; i < findings.length; i += 1) {
      if (findings[i].disposition !== 'kept') n += 1;
    }
    return n;
  }

function withExcerpts(findings, text) {
  return findings.map(function (f) {
    var slice = text.slice(f.start, f.end);
    var display = slice;
    if (slice.trim().length <= 2) {
      var from = Math.max(0, f.start - 16);
      var to = Math.min(text.length, f.end + 16);
      display = (from > 0 ? '\u2026' : '') + text.slice(from, to) + (to < text.length ? '\u2026' : '');
    }
    return {
      patternId: f.patternId,
      name: f.name,
      start: f.start,
      end: f.end,
      disposition: f.disposition,
      note: f.note,
      excerpt: display.replace(/\s+/g, ' ').trim()
    };
  });
}

  function clean(text) {
    var source = String(text == null ? '' : text);
    var findings = detect(foldApostrophes(source));
    return normalize(applyRewrites(source, findings));
  }

  function analyze(text) {
    var source = String(text == null ? '' : text);
    var folded = foldApostrophes(source);
    var detected = detect(folded);
    var findings = withExcerpts(detected, source);
    var cleaned = normalize(applyRewrites(source, detected));
    var after = detect(foldApostrophes(cleaned));
    var tells = tellCountOf(findings);
    var afterTells = tellCountOf(after);
    var words = wordCount(source);
    var afterWords = wordCount(cleaned);
    return {
      original: source,
      cleaned: cleaned,
      findings: findings,
      tellCount: tells,
      wordCount: words,
      scoreBefore: per100(tells, words),
      afterTellCount: afterTells,
      afterWordCount: afterWords,
      scoreAfter: per100(afterTells, afterWords),
      afterFindings: withExcerpts(after, cleaned)
    };
  }

  return {
    PATTERNS: PATTERNS,
    SAMPLE: SAMPLE,
    analyze: analyze,
    clean: clean
  };
});

function mount(api) {
  'use strict';

  var draft = document.getElementById('draft');
  var backdrop = document.getElementById('backdrop');
  var cleanedEl = document.getElementById('cleaned');
  var auditEl = document.getElementById('audit');
  var summaryEl = document.getElementById('audit-summary');
  var beforeEl = document.getElementById('score-before');
  var afterEl = document.getElementById('score-after');
  var detailEl = document.getElementById('score-detail');
  var tooltip = document.getElementById('tooltip');
  var copyBtn = document.getElementById('copy');
  var restoreBtn = document.getElementById('restore');
  if (!draft || !backdrop || !cleanedEl || !auditEl) return;

  var latestCleaned = '';

  function escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function tipFor(finding) {
    if (finding.disposition === 'rewritten') return finding.name + ': cut. ' + finding.note;
    if (finding.disposition === 'kept') return finding.name + ': kept. ' + finding.note;
    return finding.name + ': left for a human. ' + finding.note;
  }

  function renderMarks(text, findings) {
    var marks = findings.filter(function (f) { return f.end > f.start; })
      .slice()
      .sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    var html = '';
    var cursor = 0;
    for (var i = 0; i < marks.length; i += 1) {
      var mark = marks[i];
      if (mark.end <= cursor) continue;
      var start = Math.max(mark.start, cursor);
      html += escapeHtml(text.slice(cursor, start));
      html += '<mark class="mark mark-' + mark.disposition + '" data-tip="' + escapeHtml(tipFor(mark)) + '">';
      html += escapeHtml(text.slice(start, mark.end));
      html += '</mark>';
      cursor = mark.end;
    }
    html += escapeHtml(text.slice(cursor));
    return html;
  }

  function badge(disposition) {
    if (disposition === 'rewritten') return 'Cut';
    if (disposition === 'kept') return 'Kept';
    return 'Left';
  }

  function excerptOf(finding) {
    var flat = finding.excerpt || '';
    if (flat.length <= 96) return flat;
    return flat.slice(0, 93) + '\u2026';
  }

  function renderAudit(report) {
    var findings = report.findings;
    auditEl.textContent = '';
    if (!findings.length) {
      var empty = document.createElement('li');
      empty.className = 'audit-empty';
      empty.textContent = 'Already clean. Nothing manufactured.';
      auditEl.appendChild(empty);
      summaryEl.textContent = 'No tells.';
      return;
    }
    var cuts = 0;
    var left = 0;
    var kept = 0;
    for (var i = 0; i < findings.length; i += 1) {
      var f = findings[i];
      if (f.disposition === 'rewritten') cuts += 1;
      else if (f.disposition === 'kept') kept += 1;
      else left += 1;
      var li = document.createElement('li');
      li.className = 'audit-item audit-' + f.disposition;
      var top = document.createElement('div');
      top.className = 'audit-top';
      var b = document.createElement('span');
      b.className = 'badge badge-' + f.disposition;
      b.textContent = badge(f.disposition);
      var name = document.createElement('span');
      name.className = 'audit-name';
      name.textContent = f.name;
      top.appendChild(b);
      top.appendChild(name);
      var quote = document.createElement('q');
      quote.textContent = excerptOf(f);
      var note = document.createElement('p');
      note.textContent = f.note;
      li.appendChild(top);
      li.appendChild(quote);
      li.appendChild(note);
      auditEl.appendChild(li);
    }
    var bits = [];
    bits.push(cuts + (cuts === 1 ? ' cut' : ' cuts'));
    bits.push(left + ' left for a human');
    if (kept) bits.push(kept + ' kept inside the em-dash cap');
    summaryEl.textContent = bits.join(' · ');
  }

  function autosize() {
    draft.style.height = '0px';
    var height = draft.scrollHeight;
    draft.style.height = height + 'px';
    backdrop.style.height = height + 'px';
  }

  function render() {
    var text = draft.value;
    var report = api.analyze(text);
    latestCleaned = report.cleaned;
    backdrop.innerHTML = renderMarks(text, report.findings);
    cleanedEl.innerHTML = renderMarks(report.cleaned, report.afterFindings);
    beforeEl.textContent = report.scoreBefore.toFixed(1);
    afterEl.textContent = report.scoreAfter.toFixed(1);
    detailEl.textContent = report.tellCount + (report.tellCount === 1 ? ' tell in ' : ' tells in ')
      + report.wordCount + (report.wordCount === 1 ? ' word' : ' words')
      + ' → '
      + report.afterTellCount + (report.afterTellCount === 1 ? ' tell in ' : ' tells in ')
      + report.afterWordCount + (report.afterWordCount === 1 ? ' word' : ' words');
    renderAudit(report);
    autosize();
  }

  function hideTip() {
    tooltip.hidden = true;
  }

  function showTip(text, x, y) {
    tooltip.textContent = text;
    tooltip.hidden = false;
    var width = tooltip.offsetWidth;
    var height = tooltip.offsetHeight;
    var left = Math.min(Math.max(12, x - 8), window.innerWidth - width - 12);
    var top = y - height - 10;
    if (top < 8) top = y + 16;
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function markAtPoint(x, y) {
    var roots = [backdrop, cleanedEl];
    for (var r = 0; r < roots.length; r += 1) {
      var marks = roots[r].querySelectorAll('mark');
      for (var i = 0; i < marks.length; i += 1) {
        var rects = marks[i].getClientRects();
        for (var n = 0; n < rects.length; n += 1) {
          var rect = rects[n];
          if (rect.width === 0 || rect.height === 0) continue;
          if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            return marks[i];
          }
        }
      }
    }
    return null;
  }

  document.addEventListener('mousemove', function (event) {
    var mark = markAtPoint(event.clientX, event.clientY);
    if (!mark) {
      hideTip();
      return;
    }
    showTip(mark.getAttribute('data-tip') || '', event.clientX, event.clientY);
  });

  draft.addEventListener('input', render);
  draft.addEventListener('scroll', function () {
    backdrop.scrollTop = draft.scrollTop;
    backdrop.scrollLeft = draft.scrollLeft;
  });

  restoreBtn.addEventListener('click', function () {
    draft.value = api.SAMPLE;
    render();
    draft.focus();
  });

  copyBtn.addEventListener('click', function () {
    var text = latestCleaned;
    function done() {
      copyBtn.textContent = 'Copied';
      window.setTimeout(function () {
        copyBtn.textContent = 'Copy cleaned text';
      }, 1400);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallbackCopy(text);
        done();
      });
      return;
    }
    fallbackCopy(text);
    done();
  });

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      /* clipboard blocked; the cleaned text stays selected in the pane */
    }
    document.body.removeChild(area);
  }

  draft.value = api.SAMPLE;
  render();
}
