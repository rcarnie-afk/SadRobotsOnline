"""Plays the built game in headless Chromium and saves screenshots.

Usage: python3 tools/playtest.py <dist dir> <screenshot dir>
Fails (exit 1) on any page error or console error.
"""
import http.server
import json
import os
import socketserver
import sys
import threading
import time

from playwright.sync_api import sync_playwright

DIST, SHOTS = sys.argv[1], sys.argv[2]
os.makedirs(SHOTS, exist_ok=True)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=DIST, **k)

    def log_message(self, *a):
        pass


srv = socketserver.TCPServer(('127.0.0.1', 0), Quiet)
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
errors = []

SCENE = "window.sro.phaser.scene.getScene('world')"

with sync_playwright() as pw:
    browser = pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
    page = browser.new_page(viewport={'width': 1280, 'height': 720})
    page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    page.on('console', lambda m: m.type == 'error' and errors.append(f'console: {m.text}'))
    page.goto(f'http://127.0.0.1:{port}/index.html')
    page.wait_for_selector('#screen.on button.big', timeout=30000)
    page.wait_for_timeout(500)
    page.screenshot(path=f'{SHOTS}/01-title.png')

    page.click('text=Build your robot')
    page.wait_for_selector('#robot-name')
    page.fill('#robot-name', 'Rusty')
    page.click('button.pick:has-text("Big boots")')
    page.click('button:has-text("copper")')
    page.wait_for_timeout(300)
    page.screenshot(path=f'{SHOTS}/02-workbench.png')
    page.click('text=Power on')
    page.wait_for_timeout(1500)
    page.screenshot(path=f'{SHOTS}/03-town-intro.png')
    for _ in range(3):
        page.keyboard.press('e'); page.wait_for_timeout(200)
    assert page.query_selector('.talk') is None, 'intro dialogue did not close'

    # walk to the east gate
    page.keyboard.down('w'); page.wait_for_timeout(350); page.keyboard.up('w')
    page.keyboard.down('d'); page.wait_for_timeout(600); page.keyboard.up('d')
    page.wait_for_timeout(300)
    page.screenshot(path=f'{SHOTS}/04-town.png')
    page.keyboard.down('d'); page.wait_for_timeout(2500); page.keyboard.up('d')
    page.wait_for_timeout(1200)
    zone = page.evaluate('window.sro.game.zone')
    assert zone == 'wasteland', f'did not reach the wasteland, zone={zone}'
    page.screenshot(path=f'{SHOTS}/05-wasteland.png')

    # fight: stand next to the nearest live mob and swing at it
    before = page.evaluate(SCENE + '.mobs.filter(m=>!m.dead).length')
    killed = 0
    for attempt in range(6):
        info = page.evaluate(SCENE + """ && (() => { const s = """ + SCENE + """;
          const m = s.mobs.filter(m => !m.dead).sort((a,b)=>Math.hypot(a.x-s.player.x,a.y-s.player.y)-Math.hypot(b.x-s.player.x,b.y-s.player.y))[0];
          s.player.x = m.x - 14; s.player.y = m.y; s.open[Math.floor(m.y/16)][Math.floor((m.x-14)/16)] = true;
          window.sro.game.hull = window.sro.game.stats.hull; window.sro.game.charge = window.sro.game.stats.charge;
          const cam = s.cameras.main; return {sx: (m.x - cam.worldView.x) , sy: (m.y - 8 - cam.worldView.y), kind: m.kind}; })()""")
        page.wait_for_timeout(250)
        info = page.evaluate("""(() => { const s = """ + SCENE + """; const p = s.player; const cam = s.cameras.main;
          const m = s.mobs.filter(m => !m.dead).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
          const r = s.game.canvas.getBoundingClientRect();
          return {x: r.left + (m.x - cam.worldView.x) * r.width / 480, y: r.top + (m.y - 8 - cam.worldView.y) * r.height / 270, kind: m.kind}; })()""")
        page.mouse.move(info['x'], info['y'])
        page.mouse.down(); page.wait_for_timeout(1600); page.mouse.up()
        page.wait_for_timeout(200)
        if attempt == 0:
            page.screenshot(path=f'{SHOTS}/06-fight.png')
    after = page.evaluate(SCENE + '.mobs.filter(m=>!m.dead).length')
    picks = page.evaluate(SCENE + '.pickups.length')
    solar = page.evaluate('window.sro.game.save.solar + window.sro.game.save.level * 1000')
    print(f'mobs alive {before} -> {after}, pickups on ground {picks}, solar+level {solar}')
    assert after < before, 'swinging killed nothing'

    # a bolt, a battery, an oil
    page.mouse.click(640, 200, button='right')
    page.evaluate('window.sro.game.charge = 20')
    page.keyboard.press('1'); page.keyboard.press('4')
    page.wait_for_timeout(600)
    page.screenshot(path=f'{SHOTS}/07-items.png')
    gate = page.query_selector('#screen.on')
    if gate:
        page.screenshot(path=f'{SHOTS}/07b-gate.png')
        page.click('text=Keep playing')

    # storm, then run out of charge and get towed home
    page.evaluate(SCENE + '.stormAt = ' + SCENE + '.time.now')
    page.wait_for_timeout(1500)
    page.screenshot(path=f'{SHOTS}/08-storm.png')
    page.evaluate('window.sro.game.charge = 0')
    page.wait_for_timeout(2600)
    page.screenshot(path=f'{SHOTS}/09-tow.png')
    page.wait_for_timeout(3000)
    zone = page.evaluate('window.sro.game.zone')
    assert zone == 'town', f'was not towed home, zone={zone}'
    page.screenshot(path=f'{SHOTS}/10-towed-home.png')

    # workbench through the Worker
    page.evaluate(SCENE + '.player.x = 9*16; ' + SCENE + '.player.y = 8.9*16')
    page.wait_for_timeout(300)
    for _ in range(4):
        if page.query_selector('#screen.on'):
            break
        page.keyboard.press('e'); page.wait_for_timeout(250)
    assert page.query_selector('#screen.on') is not None, 'workbench did not open'
    page.screenshot(path=f'{SHOTS}/11-bench.png')
    page.click('text=Done')
    page.wait_for_timeout(400)

    saved = page.evaluate("localStorage.getItem('sad-robots-online-save-v1')")
    print('save:', json.loads(saved)['name'], json.loads(saved)['level'], json.loads(saved)['build'])
    page.reload()
    page.wait_for_selector('#screen.on button.big', timeout=30000)
    assert 'Continue as Rusty' in page.inner_text('#screen'), 'save did not survive a reload'
    browser.close()

srv.shutdown()
print('errors:', len(errors))
for e in errors:
    print(' -', e)
sys.exit(1 if errors else 0)
