# -*- coding: utf-8 -*-
"""Build recall (self-test) data: 名词解释/填空 from handbook + 简答/填空/判断 from recall parts.

Usage:
    python scripts/build_recall.py --subject pharm --out data/recall-pharm.js --global RECALL_PHARM --id-prefix rph
"""
import argparse, json, re
from pathlib import Path

SHORT = re.compile(r'^第[一二三四五六七八九十百]+单元\s*')

def short(t):
    return SHORT.sub('', t or '')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--subject', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--global', dest='global_name', required=True)
    ap.add_argument('--id-prefix', required=True)
    args = ap.parse_args()
    root = Path('data/_parts')
    subj = args.subject
    chap_parts = sorted((root / subj).glob('*.json'))
    hb_parts = sorted((root / 'handbook' / subj).glob('*.json'))
    rec_parts = sorted((root / ('recall-' + subj)).glob('*.json')) if (root / ('recall-' + subj)).exists() else []
    chapters = []
    types = {}
    authored_used = 0
    seen_stems = set()
    for i, cp in enumerate(chap_parts):
        title = json.loads(cp.read_text(encoding='utf-8-sig')).get('title')
        qs = []
        # D + auto F from handbook unit (same index)
        if i < len(hb_parts):
            unit = json.loads(hb_parts[i].read_text(encoding='utf-8-sig'))
            ut = short(unit.get('title'))
            defs = []
            for b in unit.get('blocks') or []:
                if b.get('t') == 'defs':
                    defs.extend(b.get('items') or [])
            for it in defs:
                k = (it.get('k') or '').strip()
                v = (it.get('v') or '').strip()
                if not k or not v:
                    continue
                qs.append({'type': 'D', 'stem': '名词解释：' + k, 'answer': v,
                           'rationale': '出自概念手册「' + ut + '」核心概念；背完后可对照该单元的可背诵版核对。'})
                if k in v and len(k) >= 2:
                    blank = v.replace(k, '______', 1)
                    qs.append({'type': 'F', 'stem': '填空题：' + blank, 'answer': k,
                               'rationale': '出自概念手册「' + ut + '」核心概念：' + k + '。'})
        # authored S/F/T
        if i < len(rec_parts):
            rp = rec_parts[i]
            try:
                rd = json.loads(rp.read_text(encoding='utf-8-sig'))
            except Exception:
                rd = {}
            for q in rd.get('questions') or []:
                qs.append(q)
            authored_used += 1
        # normalize ids/order
        out_qs = []
        for j, q in enumerate(qs):
            q = dict(q)
            import re as _re
            norm = _re.sub(r'\s+', '', str(q.get('stem') or ''))
            if norm in seen_stems:
                continue
            seen_stems.add(norm)
            q['id'] = '%s%02d_q%03d' % (args.id_prefix, i + 1, j + 1)
            q['chapter'] = title
            q['chapterIdx'] = i
            q['num'] = j + 1
            types[q.get('type')] = types.get(q.get('type'), 0) + 1
            out_qs.append(q)
        chapters.append({'title': title, 'questions': out_qs})
    payload = {'chapters': chapters}
    text = 'window.%s = %s;\n' % (args.global_name, json.dumps(payload, ensure_ascii=False, separators=(',', ':')))
    Path(args.out).write_text(text, encoding='utf-8')
    total = sum(len(c['questions']) for c in chapters)
    print('wrote %s: %d chapters, %d questions, %d bytes' % (args.out, len(chapters), total, len(text.encode('utf-8'))))
    print('types:', types, '| authored chapter files:', authored_used, '/', len(chap_parts))

if __name__ == '__main__':
    main()
