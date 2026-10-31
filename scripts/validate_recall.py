# -*- coding: utf-8 -*-
"""Validate recall (self-test) data files.

Usage:
    python scripts/validate_recall.py data/recall-pharm.js [more ...]
"""
import json, re, sys
from pathlib import Path

WINDOW_RE = re.compile(r'window\.(\w+)\s*=\s*')
TYPES = {'D': '名词解释', 'F': '填空题', 'S': '简答题', 'T': '判断题'}

def load(path):
    text = Path(path).read_text(encoding='utf-8-sig')
    m = WINDOW_RE.search(text)
    if not m:
        raise SystemExit('[%s] missing window assignment' % path)
    body = text[m.end():].strip().rstrip(';').strip()
    return m.group(1), json.loads(body)

def main():
    paths = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not paths:
        print('usage: python scripts/validate_recall.py data/recall-pharm.js ...')
        return 2
    errors = []
    for path in paths:
        seen_stems = {}
        var, data = load(path)
        chapters = data.get('chapters') or []
        if not chapters:
            errors.append('%s: no chapters' % path); continue
        total = 0
        types = {}
        ids = set()
        print('[%s] global=%s chapters=%d' % (path, var, len(chapters)))
        for ch in chapters:
            qs = ch.get('questions') or []
            if not qs:
                errors.append('%s: chapter %r empty' % (path, ch.get('title')))
                continue
            title = ch.get('title')
            for i, q in enumerate(qs):
                total += 1
                loc = '%s %s q#%d' % (path, title, i + 1)
                qid = q.get('id')
                if not isinstance(qid, str) or not qid:
                    errors.append(loc + ': missing id')
                elif qid in ids:
                    errors.append(loc + ': duplicate id ' + qid)
                else:
                    ids.add(qid)
                t = q.get('type')
                if t not in TYPES:
                    errors.append(loc + ': bad type ' + repr(t)); continue
                types[t] = types.get(t, 0) + 1
                stem = (q.get('stem') or '').strip()
                if len(stem) < (4 if t in ('D', 'F') else 8):
                    errors.append(loc + ': stem too short')
                norm = re.sub(r'\s+', '', stem)
                if norm in seen_stems:
                    errors.append(loc + ': duplicate stem (also %s)' % seen_stems[norm])
                else:
                    seen_stems[norm] = loc
                if t in ('D', 'F', 'S'):
                    if q.get('options'):
                        errors.append(loc + ': D/F/S must not have options')
                    ans = q.get('answer')
                    if not isinstance(ans, str) or not ans.strip():
                        errors.append(loc + ': answer must be non-empty string')
                    elif t == 'S' and len(ans.strip()) < 10:
                        errors.append(loc + ': S answer too short')
                    rat = (q.get('rationale') or '').strip()
                    if len(rat) < 10:
                        errors.append(loc + ': rationale too short')
                    if t == 'F' and '______' not in stem and '（ ）' not in stem and '()' not in stem:
                        errors.append(loc + ': F stem has no blank')
                if t == 'T':
                    opts = q.get('options') or {}
                    if opts.get('A') != '正确' or opts.get('B') != '错误' or len(opts) != 2:
                        errors.append(loc + ': T options must be {A:正确,B:错误}')
                    ans = q.get('answer')
                    if ans not in (['A'], ['B']):
                        errors.append(loc + ': T answer must be [A] or [B]')
                    if len((q.get('rationale') or '').strip()) < 10:
                        errors.append(loc + ': rationale too short')
        print('  questions=%d types=%s' % (total, types))
    print()
    if errors:
        print('ERRORS (%d):' % len(errors))
        for e in errors[:100]:
            print('  -', e)
        print('VALIDATION FAILED')
        return 1
    print('VALIDATION OK')
    return 0

if __name__ == '__main__':
    sys.exit(main())
