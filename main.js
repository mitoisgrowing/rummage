const { app, BrowserWindow, ipcMain, dialog, nativeImage, clipboard, shell } = require('electron');
const fs = require('fs'), path = require('path'), { exec } = require('child_process');

app.setName('Rummage');
// carry over data from the pre-rename "sounddeck" profile (db, ui settings, waveform cache)
{
  const ud = path.join(app.getPath('appData'), 'Rummage'), old = path.join(app.getPath('appData'), 'sounddeck');
  if (!fs.existsSync(ud) && fs.existsSync(old)) try { fs.cpSync(old, ud, { recursive: true }); } catch {}
  app.setPath('userData', ud);
}

// a second instance would hold a stale db and overwrite the first one's saves
if (!app.requestSingleInstanceLock()) app.exit(0);
app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });

const home = app.getPath('home'), docs = app.getPath('documents');
const dbFile = () => path.join(app.getPath('userData'), 'db.json');
let db = { favs: {}, cats: {}, hidden: {}, folders: [], v2: [] };
try { db = { ...db, ...JSON.parse(fs.readFileSync(dbFile(), 'utf8')) }; } catch {}
const saveDb = () => fs.writeFile(dbFile(), JSON.stringify(db), () => {});

const AUDIO = /\.(wav|aif|aiff|flac|mp3|ogg|m4a)$/i, PRESET = /\.(adg|adv|als)$/i;

const RULES = [
  ['tune', /tune|pitch|melodyne|antares|correct|harmoniz|whistl/],
  ['comp', /compress|limit|clipper|pro-?[cl](?![a-z])|pro-?mb|\bott\b|1176|la-?2a|gate|expand|multiband|maximi|rider|glue|transient|smasher|kotelnikov|dynamics/],
  ['eq', /\beq\b|pro-?q|equaliz|\bfilter\b|soothe|resonance|linear ?phase/],
  ['space', /reverb|verb|delay|echo|\broom\b|\bhall\b|\bplate\b|shimmer|valhalla|supermassive|timeless|volcano|space/],
  ['sat', /\bsat|saturn|saturat|distort|overdrive|\bdrive|\btube|\btape|fuzz|crush|\bbit|decapitator|waveshap|\bamp|roar|pedal|erosion|redux/],
  ['creative', /chorus|flang|phas|glitch|stutter|gross|shaper|granular|vocod|morph|effectrix|portal|shifter|autopan|tremolo|vibrato|rotor|formant|spectral|freeze|kickstart|duck|sidechain|beat repeat|grain|corpus|resonator/],
  ['util', /meter|analy|\bspan\b|spectrum|scope|\bpan\b|width|imager|stereo|\bmono\b|\bgain\b|trim|utility|loudness|youlean|correlat|mid.?side|tuner/],
  ['synth', /serum|vital|massive|diva|sylenth|omnisphere|nexus|kontakt|spire|pigments|analog ?lab|synth|sampler|piano|keys|battery|wavetable|trilian|keyscape|stylus|instrument/],
];
const guess = s => { s = s.toLowerCase(); for (const [c, r] of RULES) if (r.test(s)) return c; return 'other'; };

const STOCK = {
  comp: ['Compressor', 'Glue Compressor', 'Multiband Dynamics', 'Limiter', 'Gate', 'Drum Buss'],
  eq: ['EQ Eight', 'EQ Three', 'Channel EQ', 'Auto Filter'],
  space: ['Reverb', 'Hybrid Reverb', 'Echo', 'Delay', 'Grain Delay', 'Spectral Time'],
  sat: ['Saturator', 'Pedal', 'Amp', 'Cabinet', 'Dynamic Tube', 'Roar', 'Overdrive', 'Redux', 'Erosion'],
  creative: ['Chorus-Ensemble', 'Phaser-Flanger', 'Shifter', 'Frequency Shifter', 'Vocoder', 'Beat Repeat', 'Auto Pan-Tremolo', 'Corpus', 'Resonators', 'Spectral Resonator'],
  tune: ['Tuner', 'Auto Shift'],
  util: ['Utility', 'Spectrum'],
};

if (!fs.existsSync(path.join(docs, 'Rummage')) && fs.existsSync(path.join(docs, 'SoundDeck'))) try { fs.renameSync(path.join(docs, 'SoundDeck'), path.join(docs, 'Rummage')); } catch {}
const EDITS = path.join(docs, 'Rummage', 'Edits'), LIB = path.join(docs, 'Rummage', 'Library');
for (const d of [EDITS, LIB, path.join(LIB, 'Presets'), path.join(LIB, 'Tracks')]) fs.mkdirSync(d, { recursive: true });
const roots = () => [path.join(docs, 'Splice', 'Samples'), path.join(home, 'Splice'), path.join(docs, 'Ableton', 'User Library'), LIB, EDITS, ...db.folders];

let watchers = [], timer;
function watch(win) {
  watchers.forEach(w => w.close()); watchers = [];
  for (const r of roots()) {
    try {
      watchers.push(fs.watch(r, { recursive: true }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => win.webContents.send('changed'), 3000);
      }));
    } catch {}
  }
}

async function walk(dir, out, depth = 0) {
  if (depth > 14) return;
  let es; try { es = await fs.promises.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of es) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out, depth + 1);
    else if (AUDIO.test(e.name) || PRESET.test(e.name)) out.push(p);
  }
}

async function scanPlugins() {
  const out = [], names = new Set();
  const v3 = ['C:\\Program Files\\Common Files\\VST3', path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Common', 'VST3')];
  async function w3(d, vendor, depth) {
    let es; try { es = await fs.promises.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      const p = path.join(d, e.name);
      if (/\.vst3$/i.test(e.name)) { const n = e.name.replace(/\.vst3$/i, ''); names.add(n.toLowerCase()); out.push({ id: p, kind: 'plugin', fmt: 'VST3', name: n, vendor, path: p }); }
      else if (e.isDirectory() && depth < 2) await w3(p, e.name, depth + 1);
    }
  }
  for (const d of v3) await w3(d, '', 0);
  const v2 = ['C:\\Program Files\\VSTPlugins', 'C:\\Program Files\\Steinberg\\VSTPlugins', 'C:\\Program Files\\Common Files\\VST2', ...db.v2];
  async function w2(d, vendor, depth) {
    let es; try { es = await fs.promises.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      const p = path.join(d, e.name);
      if (e.isDirectory() && depth < 3) await w2(p, depth ? vendor : e.name, depth + 1);
      else if (/\.dll$/i.test(e.name)) { const n = e.name.replace(/\.dll$/i, ''); if (!names.has(n.toLowerCase())) out.push({ id: p, kind: 'plugin', fmt: 'VST2', name: n, vendor, path: p }); }
    }
  }
  for (const d of v2) await w2(d, '', 0);
  for (const base of ['C:\\Program Files (x86)\\Waves', 'C:\\Program Files\\Waves']) {
    let ds; try { ds = await fs.promises.readdir(base); } catch { continue; }
    for (const d of ds.filter(x => /^Plug-Ins V\d+/i.test(x))) {
      let bs; try { bs = await fs.promises.readdir(path.join(base, d)); } catch { continue; }
      for (const b of bs.filter(x => /\.bundle$/i.test(x))) {
        const n = b.replace(/\.bundle$/i, '');
        if (!names.has(n.toLowerCase())) { names.add(n.toLowerCase()); out.push({ id: path.join(base, d, b), kind: 'plugin', fmt: 'Waves', name: n, vendor: 'Waves', path: path.join(base, d, b) }); }
      }
    }
  }
  for (const [c, list] of Object.entries(STOCK)) for (const n of list) out.push({ id: 'stock:' + n, kind: 'plugin', fmt: 'Live', name: n, vendor: 'Ableton', path: '', stockCat: c });
  return out;
}

async function scanAll() {
  const items = await scanPlugins();
  const files = [];
  for (const r of roots()) await walk(r, files);
  for (const p of files) {
    const base = path.basename(p), name = base.replace(/\.[^.]+$/, ''), full = p.toLowerCase();
    if (PRESET.test(p)) {
      items.push({ id: p, kind: /\.adg$/i.test(p) ? 'chain' : /\.als$/i.test(p) ? 'track' : 'preset', name, path: p, vendor: path.basename(path.dirname(p)) });
    } else {
      const bpm = (name.match(/(\d{2,3})\s?bpm/i) || name.match(/[_\- ](\d{2,3})[_\- ]/) || [])[1];
      const key = (name.match(/[_\- ]([A-G][#b]?(?:maj|min|m)?)(?=[_\- .]|$)/) || [])[1];
      items.push({ id: p, kind: 'sample', name, path: p, vendor: path.basename(path.dirname(p)), bpm: bpm && +bpm >= 60 && +bpm <= 220 ? +bpm : 0, key: key || '', loop: /loop/.test(full) ? 1 : /one.?shot|oneshot/.test(full) ? 0 : /bpm|_\d{2,3}_/i.test(name) ? 1 : 0 });
    }
  }
  const seen = db.lastSeen || 0;
  const samplesRoot = path.join(docs, 'Splice', 'Samples');
  await Promise.all(items.filter(i => i.path).map(async i => {
    try { const s = await fs.promises.stat(i.path); i.added = s.birthtimeMs || s.mtimeMs; i.isNew = i.kind !== 'plugin' && s.mtimeMs > seen; } catch {}
    if (i.kind !== 'plugin') {
      const rel = path.relative(samplesRoot, i.path).split(path.sep);
      if (!rel[0].startsWith('..') && !path.isAbsolute(rel[0])) { if (/^organized$/i.test(rel[0])) rel.shift(); i.grp = rel.length > 1 ? rel[0] : '(sueltos)'; }
      else i.grp = path.basename(path.dirname(i.path));
    }
  }));
  if (!db.lastSeen) { db.lastSeen = Date.now(); saveDb(); items.forEach(i => i.isNew = false); }
  return items.filter(i => !db.hidden[i.id]).map(i => ({
    ...i, fav: !!db.favs[i.id],
    cat: i.kind === 'sample' ? '' : db.cats[i.id] || i.stockCat || guess(i.name + ' ' + (i.kind === 'plugin' ? '' : i.path)),
  }));
}

const dragIcon = nativeImage.createFromBitmap(Buffer.alloc(32 * 32 * 4, 180), { width: 32, height: 32 });

function sendToLive(name) {
  clipboard.writeText(name);
  const ps = `Add-Type -AssemblyName Microsoft.VisualBasic,System.Windows.Forms
$p = Get-Process | ? { $_.MainWindowTitle -like '*Ableton Live*' } | select -First 1
if ($p) { [Microsoft.VisualBasic.Interaction]::AppActivate($p.Id); Start-Sleep -m 350
[System.Windows.Forms.SendKeys]::SendWait('^f'); Start-Sleep -m 200; [System.Windows.Forms.SendKeys]::SendWait('^v') }`;
  exec('powershell -NoProfile -EncodedCommand ' + Buffer.from(ps, 'utf16le').toString('base64'));
}

ipcMain.handle('scan', scanAll);
ipcMain.handle('db', () => db);
ipcMain.handle('patch', (_, { type, id, val }) => {
  if (type === 'fav') val ? db.favs[id] = 1 : delete db.favs[id];
  else if (type === 'cat') db.cats[id] = val;
  else if (type === 'hide') db.hidden[id] = 1;
  else if (type === 'seen') db.lastSeen = Date.now();
  saveDb();
});
ipcMain.handle('import', async (_, files) => {
  for (const f of files) {
    const sub = /\.als$/i.test(f) ? 'Tracks' : PRESET.test(f) ? 'Presets' : '';
    const dst = path.join(LIB, sub, path.basename(f));
    try { if ((await fs.promises.stat(f)).isDirectory()) await fs.promises.cp(f, path.join(LIB, path.basename(f)), { recursive: true }); else await fs.promises.copyFile(f, dst); } catch {}
  }
  return files.length;
});
ipcMain.handle('roots',() => roots().filter(r => fs.existsSync(r)));
ipcMain.handle('pickBg', async () => {
  const r = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }] });
  return r.canceled ? null : require('url').pathToFileURL(r.filePaths[0]).href;
});
ipcMain.handle('saveWav', async (_, name, data) => {
  await fs.promises.mkdir(EDITS, { recursive: true });
  const p = path.join(EDITS, name.replace(/[<>:"/\\|?*]/g, '_'));
  await fs.promises.writeFile(p, Buffer.from(data));
  return p;
});
ipcMain.handle('set',(_, k, v) => { db[k] = v; saveDb(); });
ipcMain.handle('addFolder', async () => {
  const r = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (r.canceled) return null;
  if (!db.folders.includes(r.filePaths[0])) db.folders.push(r.filePaths[0]);
  saveDb(); return db.folders;
});
ipcMain.handle('rmFolder', (_, f) => { db.folders = db.folders.filter(x => x !== f); saveDb(); return db.folders; });
ipcMain.handle('read', (_, p) => fs.promises.readFile(p));
ipcMain.on('drag', (e, p) => e.sender.startDrag({ file: p, icon: dragIcon }));
ipcMain.on('live', (_, n) => sendToLive(n));
ipcMain.on('reveal', (_, p) => shell.showItemInFolder(p));
ipcMain.on('openRepo', () => shell.openExternal('https://github.com/mitoisgrowing/rummage'));
ipcMain.on('zoom',(e, s) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  e.sender.setZoomFactor(s);
  w.setTitleBarOverlay({ color: '#2a2a2a', symbolColor: '#bdbdbd', height: Math.round(32 * s) });
});
ipcMain.on('top',(e, v) => BrowserWindow.fromWebContents(e.sender).setAlwaysOnTop(v));

app.whenReady().then(async () => {
  const wa = require('electron').screen.getPrimaryDisplay().workArea;
  const w = new BrowserWindow({
    x: wa.x, y: wa.y, width: 480, height: wa.height, minWidth: 300, alwaysOnTop: true,
    backgroundColor: '#1e1e1e', autoHideMenuBar: true, title: 'Rummage', icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'hidden', titleBarOverlay: { color: '#2a2a2a', symbolColor: '#bdbdbd', height: 32 },
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  w.loadFile('index.html');
  setInterval(() => exec('tasklist /fo csv /nh', (e, out) => { if (!e && !w.isDestroyed()) w.webContents.send('ableton', /Ableton Live/i.test(out)); }), 4000);
  watch(w);
  ipcMain.on('rewatch', () => watch(w));
});
app.on('window-all-closed', () => app.quit());
