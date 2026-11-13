"""Build the self-contained sprite review page.

Usage: python3 tools/preview/build.py <out.html>
Needs art/sprites (from tools/sprites/build.py) and art/source (from sources.py).
"""
import base64
import io
import json
import os
import sys

from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')


def uri(data, mime):
    return f'data:{mime};base64,' + base64.b64encode(data).decode()


def main(out):
    man = json.load(open(os.path.join(ROOT, 'art', 'sprites', 'manifest.json')))
    sheets = {}
    for slot in man['slots'].values():
        for p in slot:
            sheets[p['id']] = uri(open(os.path.join(ROOT, 'art', 'sprites', p['sheet']), 'rb').read(), 'image/png')
    sources = []
    for s in json.load(open(os.path.join(ROOT, 'art', 'source', 'sources.json'))):
        im = Image.open(os.path.join(ROOT, 'art', 'source', s['id'] + '.png')).convert('RGB')
        buf = io.BytesIO()
        im.save(buf, 'JPEG', quality=88)
        sources.append(dict(id=s['id'], title=s['title'], usedFor=s['usedFor'], data=uri(buf.getvalue(), 'image/jpeg')))
    html = open(os.path.join(os.path.dirname(__file__), 'template.html')).read()
    html = html.replace('/*MANIFEST*/', json.dumps(man)).replace('/*SHEETS*/', json.dumps(sheets)).replace('/*SOURCES*/', json.dumps(sources))
    open(out, 'w').write(html)
    print(out, round(len(html) / 1024), 'KB')


if __name__ == '__main__':
    main(sys.argv[1])
