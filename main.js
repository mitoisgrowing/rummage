const { app, BrowserWindow, ipcMain, dialog, nativeImage, clipboard, shell } = require('electron');
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto'), { exec, execFile } = require('child_process');
const shots = require('./shots');

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

const AUDIO = /\.(wav|aif|aiff|flac|mp3|ogg|m4a)$/i, PRESET = /\.(adg|adv|als|flp|fst)$/i;

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
// well-known models whose names don't say what they do (checked before the generic rules)
const KNOWN = [
  ['util', /360|immersive|wrapper|\blfe\b|manager|monitor|\bconnect\b|reference|analy[sz]|rebalance|measure|feedback hunter|\bmute\b|key mapper|sequencer|\btract\b|\bwlm\b|\bhaas\b|\bps22\b|x-?noise|x-?click|\bwns\b|clarity vx|\brx \d|edison|\bnx\b|mixroom/],
  ['comp', /\bvcomp|\brcomp|\bc[46]\b|cla-?(76|2a|3a)|api-?2500|ssl.?(comp|g\b|e-?channel)|smack attack|\bl[123]\b|l3.?(multi|ll)|maxx.?volume|kramerpie|korvpressor|compactor|oklouder|\blinmb\b|\bmv2\b|puigchild|\bdbx|\bapi-?5\d\d\b/],
  ['eq', /\bq10\b|\bq\d\b|\breq\b|renaissance eq|\bssleq|pultec|curves|de-?ess|fabfilter (micro|simplon)|bass boost|low lifter/],
  ['space', /\bir-?1\b|supertap|h-?delay|rverb|trueverb|doppler|abbey road (chambers|plates)|okwetter|cla epic|pure.?plate/],
  ['sat', /aphex|maserati|magma|stressbox|sausage|radiator|kramer.?(ba|vc|tape)|eddiekramer|j37|scheps parallel|rs124|\bnls\b|610/],
  ['creative', /doubler|alterboy|vocal bender|snap heap|gtrstomp|guitar rig|vfx|transmitter|texture|jjp|butch vig|greg wells|\bagl\b/],
  ['synth', /mpc beats|sampler|\bmaster\b(?=.*synth)/],
];
const guess = s => { s = s.toLowerCase(); for (const [c, r] of KNOWN) if (r.test(s)) return c; for (const [c, r] of RULES) if (r.test(s)) return c; return 'other'; };

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
// every scanned location is user-editable; these are only the defaults
const LAD = process.env.LOCALAPPDATA || '';
const DEFAULT_PATHS = () => ({
  samples: [path.join(docs, 'Splice', 'Samples'), path.join(docs, 'Ableton', 'User Library'), path.join(docs, 'Image-Line', 'FL Studio', 'Audio')],
  vst3: ['C:\\Program Files\\Common Files\\VST3', path.join(LAD, 'Programs', 'Common', 'VST3')],
  vst2: ['C:\\Program Files\\VSTPlugins', 'C:\\Program Files\\Steinberg\\VSTPlugins', 'C:\\Program Files\\Common Files\\VST2'],
  clap: ['C:\\Program Files\\Common Files\\CLAP', path.join(LAD, 'Programs', 'Common', 'CLAP')],
  waves: ['C:\\Program Files (x86)\\Waves', 'C:\\Program Files\\Waves'],
  fl: [path.join(docs, 'Image-Line', 'FL Studio')],
});
if (!db.paths) { // first run after the update: fold the old "extra folders" lists in
  const d = DEFAULT_PATHS(); d.samples.push(...(db.folders || [])); d.vst2.push(...(db.v2 || [])); db.paths = d; saveDb();
}
const paths = () => ({ ...DEFAULT_PATHS(), ...db.paths });
const uniqPaths = a => [...new Map(a.map(p => [p.toLowerCase(), p])).values()];
// FL's own saved plugin presets live next to (not inside) its plugin database
const roots = () => uniqPaths([...paths().samples, ...paths().fl.flatMap(f => [path.join(f, 'Projects'), path.join(f, 'Presets', 'Plugin presets')]), LIB, EDITS]);

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

// ---------- plugin detection ----------
// one key per product, so "Pro-Q 4 (x64)", "Pro-Q 4 Stereo" and "pro-q 4" collapse together
const pkey = n => n.toLowerCase().replace(/\.(vst3|dll|clap|bundle|fst)$/, '').replace(/\((x64|vst3?|clap|64.?bit)\)|[_ -]x64$|\s(mono|stereo|mono[-/]stereo|m\/s)$/g, '').replace(/[^a-z0-9]/g, '');
// stable artwork key: derived from the product, not the install path, so a moved
// plugin keeps its picture and two copies of the same product share one
const shotKey = n => 'p' + crypto.createHash('sha1').update(pkey(n)).digest('hex').slice(0, 12);

// VST3 bundles ship a moduleinfo.json with the plugin's official category and vendor
function vst3Info(p) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(p, 'Contents', 'Resources', 'moduleinfo.json'), 'utf8').replace(/,(\s*[}\]])/g, '$1'));
    const c = (j.Classes || []).find(c => c.Category === 'Audio Module Class') || {};
    return { vendor: c.Vendor || (j['Factory Info'] || {}).Vendor || '', sub: (c['Sub Categories'] || []).join('|') };
  } catch { return null; }
}
const subCat = s => {
  s = (s || '').toLowerCase();
  if (/instrument|synth|sampler|drum|generator/.test(s) && !/^fx/.test(s)) return 'synth';
  if (/dynamics|compress|limit/.test(s)) return 'comp';
  if (/\beq\b|filter/.test(s)) return 'eq';
  if (/reverb|delay/.test(s)) return 'space';
  if (/distortion/.test(s)) return 'sat';
  if (/pitch/.test(s)) return 'tune';
  if (/modulation|flanger|chorus/.test(s)) return 'creative';
  if (/analy[sz]er|tools|spatial|restoration|mastering|visual|controller|surround/.test(s)) return 'util';
  return '';
};

// a .dll is only a VST2 plugin if it exports VSTPluginMain (or the legacy "main"): filters helper DLLs out
function isVst2(p) {
  let fd;
  try {
    fd = fs.openSync(p, 'r');
    const read = (pos, len) => { const b = Buffer.alloc(len); fs.readSync(fd, b, 0, len, pos); return b; };
    const mz = read(0, 64); if (mz.readUInt16LE(0) !== 0x5a4d) return false;
    const pe = mz.readUInt32LE(60), hdr = read(pe, 24); if (hdr.readUInt32LE(0) !== 0x4550) return false;
    const nsec = hdr.readUInt16LE(6), optSize = hdr.readUInt16LE(20), opt = pe + 24, magic = read(opt, 2).readUInt16LE(0);
    const expRva = read(opt + (magic === 0x20b ? 112 : 96), 4).readUInt32LE(0); if (!expRva) return false;
    const secs = read(opt + optSize, nsec * 40);
    const off = r => { for (let i = 0; i < nsec; i++) { const va = secs.readUInt32LE(i * 40 + 12), sz = Math.max(secs.readUInt32LE(i * 40 + 8), secs.readUInt32LE(i * 40 + 16)); if (r >= va && r < va + sz) return r - va + secs.readUInt32LE(i * 40 + 20); } return -1; };
    const ed = read(off(expRva), 40), n = Math.min(ed.readUInt32LE(24), 400), names = read(off(ed.readUInt32LE(32)), n * 4);
    for (let i = 0; i < n; i++) { const s = read(off(names.readUInt32LE(i * 4)), 24).toString('latin1').split('\0')[0]; if (s === 'VSTPluginMain' || s === 'main' || s === 'MAIN') return true; }
    return false;
  } catch { return false; } finally { if (fd !== undefined) try { fs.closeSync(fd); } catch {} }
}

// FL Studio's plugin database: every plugin FL knows (wherever it is installed), its FL category, and a .fst you can drag into FL
const FLCAT = { 'delay reverb': 'space', distortion: 'sat', dynamics: 'comp', filter: 'eq', flanger: 'creative', controller: 'util', visual: 'util', misc: '', effect: '' };
async function flDatabase() {
  const byKey = new Map(), list = [];
  for (const flDir of paths().fl) {
    const base = path.join(flDir, 'Presets', 'Plugin database');
    for (const kind of ['Effects', 'Generators']) {
      let fmts; try { fmts = await fs.promises.readdir(path.join(base, 'Installed', kind)); } catch { continue; }
      for (const fmt of fmts) {
        let fs2; try { fs2 = await fs.promises.readdir(path.join(base, 'Installed', kind, fmt)); } catch { continue; }
        for (const f of fs2.filter(x => /\.fst$/i.test(x))) {
          const e = { name: f.replace(/\.fst$/i, ''), fst: path.join(base, 'Installed', kind, fmt, f), fmt, gen: kind === 'Generators', flcat: '' };
          list.push(e); if (!byKey.has(pkey(e.name))) byKey.set(pkey(e.name), e);
        }
      }
      // FL's own categorised view: Plugin database\Effects\Dynamics\*.fst, ...
      let cats; try { cats = await fs.promises.readdir(path.join(base, kind), { withFileTypes: true }); } catch { continue; }
      for (const c of cats.filter(c => c.isDirectory())) {
        let fs3; try { fs3 = await fs.promises.readdir(path.join(base, kind, c.name)); } catch { continue; }
        const cat = FLCAT[c.name.toLowerCase()] ?? subCat(c.name.replace(/^fx-/i, ''));
        for (const f of fs3.filter(x => /\.fst$/i.test(x))) { const e = byKey.get(pkey(f)); if (e && cat) e.flcat = cat; }
      }
    }
  }
  return { byKey, list };
}

async function scanPlugins() {
  const P = paths(), out = [], have = new Map();
  const add = it => { const k = pkey(it.name); if (have.has(k)) return have.get(k); it.key = shotKey(it.name); have.set(k, it); out.push(it); return it; };
  async function w3(d, vendor, depth) {
    let es; try { es = await fs.promises.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      const p = path.join(d, e.name);
      if (/^waveshell/i.test(e.name)) continue; // Waves' container, its plugins come from the Waves folder
      if (/\.vst3$/i.test(e.name)) { const inf = e.isDirectory() ? vst3Info(p) : null; add({ id: p, kind: 'plugin', fmt: 'VST3', name: e.name.replace(/\.vst3$/i, ''), vendor: (inf && inf.vendor) || vendor, path: p, metaCat: inf ? subCat(inf.sub) : '' }); }
      else if (e.isDirectory() && depth < 3) await w3(p, depth ? vendor : e.name, depth + 1);
    }
  }
  for (const d of P.vst3) await w3(d, '', 0);
  async function wc(d, vendor, depth) {
    let es; try { es = await fs.promises.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      const p = path.join(d, e.name);
      if (/\.clap$/i.test(e.name)) add({ id: p, kind: 'plugin', fmt: 'CLAP', name: e.name.replace(/\.clap$/i, ''), vendor, path: p });
      else if (e.isDirectory() && depth < 3) await wc(p, depth ? vendor : e.name, depth + 1);
    }
  }
  for (const d of P.clap) await wc(d, '', 0);
  async function w2(d, vendor, depth) {
    let es; try { es = await fs.promises.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      const p = path.join(d, e.name);
      if (e.isDirectory() && depth < 4) await w2(p, depth ? vendor : e.name, depth + 1);
      else if (/\.dll$/i.test(e.name) && !have.has(pkey(e.name)) && isVst2(p)) add({ id: p, kind: 'plugin', fmt: 'VST2', name: e.name.replace(/\.dll$/i, ''), vendor, path: p });
    }
  }
  for (const d of P.vst2) await w2(d, '', 0);
  for (const base of P.waves) {
    let ds; try { ds = await fs.promises.readdir(base); } catch { continue; }
    for (const d of ds.filter(x => /^Plug-Ins V\d+/i.test(x))) {
      let bs; try { bs = await fs.promises.readdir(path.join(base, d)); } catch { continue; }
      for (const b of bs.filter(x => /\.bundle$/i.test(x))) add({ id: path.join(base, d, b), kind: 'plugin', fmt: 'Waves', name: b.replace(/\.bundle$/i, ''), vendor: 'Waves', path: path.join(base, d, b) });
    }
  }
  // merge FL's database: attach .fst + category, and add what FL knows but we didn't find (custom folders, FL's own plugins)
  const fl = await flDatabase();
  for (const e of fl.list) {
    if (/^waveshell/i.test(e.name)) continue; // the Waves container itself, not a plugin
    const k = pkey(e.name), hit = have.get(k);
    // channel variants (Mono / Stereo / Mono-Stereo) stay one plugin, but each keeps its own .fst
    const vm = e.name.match(/\s(mono[-/]stereo|mono|stereo|m\/s)$/i), variant = { label: vm ? vm[1].replace(/-/, '/').replace(/^m\/s$/i, 'Mono/Stereo').replace(/\b\w/g, c => c.toUpperCase()) : 'default', fst: e.fst };
    if (hit) {
      (hit.variants || (hit.variants = [])).push(variant);
      if (!hit.fst || /^stereo$/i.test(variant.label)) hit.fst = e.fst;
      if (!hit.flCat) hit.flCat = e.flcat; if (e.gen) hit.gen = true; continue;
    }
    const native = /^(fruity|new)$/i.test(e.fmt), base = vm ? e.name.slice(0, vm.index) : e.name;
    add({ id: 'fl:' + e.fst, kind: 'plugin', fmt: native ? 'FL' : e.fmt.toUpperCase().replace('VST', 'VST2').replace('VST23', 'VST3'), name: base, vendor: native ? 'Image-Line' : '', path: '', fst: e.fst, variants: [variant], flCat: e.flcat, gen: e.gen, daw: native ? 'fl' : '' });
  }
  for (const [c, list] of Object.entries(STOCK)) for (const n of list) out.push({ id: 'stock:' + n, key: shotKey(n), kind: 'plugin', fmt: 'Live', name: n, vendor: 'Ableton', path: '', stockCat: c, daw: 'live' });
  return out;
}

async function scanAll() {
  const items = await scanPlugins();
  const files = [];
  for (const r of roots()) await walk(r, files);
  // FL project folders only contribute .flp files (not the audio saved inside them), and never FL's backups
  const flProj = paths().fl.map(f => path.join(f, 'Projects').toLowerCase() + path.sep);
  for (const p of files) {
    const lp = p.toLowerCase();
    if (/[\\/]backup[\\/]/.test(lp) || (AUDIO.test(p) && flProj.some(f => lp.startsWith(f)))) continue;
    const base = path.basename(p), name = base.replace(/\.[^.]+$/, ''), full = p.toLowerCase();
    if (PRESET.test(p)) {
      items.push({ id: p, kind: /\.adg$/i.test(p) ? 'chain' : /\.als$/i.test(p) ? 'track' : /\.flp$/i.test(p) ? 'project' : 'preset', name, path: p, vendor: path.basename(path.dirname(p)) });
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
    cat: i.kind === 'sample' ? '' : db.cats[i.id] || i.stockCat || i.metaCat || i.flCat || (i.gen ? 'synth' : '') || guess(i.name + ' ' + (i.kind === 'plugin' ? '' : i.path)),
  }));
}

const dragIcon = nativeImage.createFromBitmap(Buffer.alloc(32 * 32 * 4, 180), { width: 32, height: 32 });

// ---------- plugin artwork (own capture engine) ----------
const SHOTS = path.join(app.getPath('userData'), 'shots');
try { fs.mkdirSync(SHOTS, { recursive: true }); } catch {}
const shotSafe = k => /^p[0-9a-f]{12}$/i.test(String(k));
const shotFile = k => path.join(SHOTS, String(k) + '.jpg');
// key -> mtime, so the renderer can cache-bust an artwork that was replaced
function shotIndex() {
  const o = {};
  try {
    for (const f of fs.readdirSync(SHOTS)) {
      const m = f.match(/^(p[0-9a-f]{12})\.jpg$/i);
      if (!m) continue;
      try { o[m[1]] = fs.statSync(path.join(SHOTS, f)).mtimeMs; } catch {}
    }
  } catch {}
  return o;
}
const dimCache = new Map();
function jpegSize(f) {
  try {
    const fd = fs.openSync(f, 'r'), b = Buffer.alloc(65536), n = fs.readSync(fd, b, 0, b.length, 0); fs.closeSync(fd);
    for (let i = 2; i + 9 < n;) {
      if (b[i] !== 0xFF) return null;
      const mk = b[i + 1], len = b.readUInt16BE(i + 2);
      if (mk >= 0xC0 && mk <= 0xC3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + len;
    }
  } catch {}
  return null;
}
// key -> [width, height], cached by file time so a replaced picture is measured again
function shotDims(files) {
  const o = {};
  for (const [k, t] of Object.entries(files)) {
    const c = dimCache.get(k);
    if (c && c.t === t) { o[k] = c.d; continue; }
    const d = jpegSize(shotFile(k)); if (d) { dimCache.set(k, { t, d }); o[k] = d; }
  }
  return o;
}
function writeShot(key, img) {
  const { width, height } = img.getSize();
  if (!width || !height) throw new Error('the image is empty');
  const out = width > 900 ? img.resize({ width: 900, quality: 'best' }) : img;
  const buf = out.toJPEG(82);
  if (!buf || buf.length < 512) throw new Error('the image could not be encoded');
  fs.writeFileSync(shotFile(key), buf);
  return buf.length;
}
// Plugindex keeps its captures in ~/.plugindex/images as "vendor~product-name.png";
// the product part maps onto our own key, so those pictures show up here too.
// Only files newer than the last import are read, so a picture the user deleted stays deleted.
const PIDX = path.join(os.homedir(), '.plugindex', 'images'), PIDX_MARK = path.join(SHOTS, '.plugindex-import');
async function importPlugindex() {
  let since = 0, files = [];
  try { since = +fs.readFileSync(PIDX_MARK, 'utf8') || 0; } catch {}
  try { files = fs.readdirSync(PIDX).filter(f => /~.+\.(png|jpe?g|webp)$/i.test(f)); } catch { return 0; }
  let n = 0;
  for (const f of files) {
    const p = path.join(PIDX, f);
    try {
      if (fs.statSync(p).mtimeMs <= since) continue;
      const key = shotKey(f.split('~').slice(1).join('~').replace(/\.[^.]+$/, '').replace(/-/g, ' '));
      if (fs.existsSync(shotFile(key))) continue;
      const img = nativeImage.createFromPath(p);
      if (!img.isEmpty()) { writeShot(key, img); n++; }
    } catch {}
    await new Promise(r => setImmediate(r)); // keep the window responsive on the first big import
  }
  try { fs.writeFileSync(PIDX_MARK, String(Date.now())); } catch {}
  return n;
}
let pidxDone = null;
ipcMain.handle('shots', async () => { await (pidxDone = pidxDone || importPlugindex()); const files = shotIndex(); return { dir: SHOTS, files, dims: shotDims(files) }; });
ipcMain.handle('shotSave', (_, key, dataUrl) => {
  if (!shotSafe(key)) throw new Error('bad artwork key');
  return { bytes: writeShot(key, nativeImage.createFromDataURL(dataUrl)), files: shotIndex() };
});
ipcMain.handle('shotPick', async (_, key) => {
  if (!shotSafe(key)) return null;
  const r = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  const img = nativeImage.createFromPath(r.filePaths[0]);
  if (!img || img.isEmpty()) return { error: 'that file is not an image Rummage can read' };
  return { bytes: writeShot(key, img), files: shotIndex() };
});
ipcMain.handle('shotDelete', (_, key) => {
  if (shotSafe(key)) try { fs.unlinkSync(shotFile(key)); } catch {}
  return shotIndex();
});

// ---------- batch artwork: every VST3 opened on its own, unseen, and photographed ----------
const SNAP = app.isPackaged ? path.join(process.resourcesPath, 'vst3snap.exe') : path.join(__dirname, 'native', 'vst3snap.exe');
const SNAP_FAILED = path.join(SHOTS, '.failed.json');
const snapRun = (args, ms) => new Promise(r => execFile(SNAP, args, { timeout: ms, windowsHide: true, maxBuffer: 1 << 20 }, (e, out) => r({ ok: !e, out: String(out || '') })));
let snapStop = false, snapBusy = false;
ipcMain.on('shotStop', () => { snapStop = true; });
// list: [{ key, name, path, fmt }] of plugins with no artwork yet
ipcMain.handle('shotScan', async (e, list, retry) => {
  if (snapBusy || !fs.existsSync(SNAP)) return { error: snapBusy ? 'already capturing' : 'the capture helper is missing' };
  snapBusy = true; snapStop = false;
  try { // an unexpected error must not leave capture locked until restart
  let failed = {}; try { failed = retry ? {} : JSON.parse(fs.readFileSync(SNAP_FAILED, 'utf8')); } catch {}
  // Waves plugins live inside WaveShells, and each shell version holds a different set: ask them all
  const shells = paths().vst3.flatMap(d => { try { return fs.readdirSync(d).filter(f => /^waveshell\d?-vst3 [\d.]+_x64\.vst3$/i.test(f)).map(f => path.join(d, f)); } catch { return []; } }).sort().reverse();
  const wavesClass = new Map(), rank = n => /mono\/stereo$/i.test(n) ? 1 : /stereo$/i.test(n) ? 2 : 0;
  if (list.some(i => i.fmt === 'Waves')) for (const sh of shells) {
    const r = await snapRun([sh, '--list'], 60000);
    for (const n of r.out.split(/\r?\n/).map(x => x.trim()).filter(Boolean)) { const k = pkey(n), o = wavesClass.get(k); if (!o || rank(n) > rank(o.name)) wavesClass.set(k, { shell: sh, name: n }); }
  }
  const jobs = list.filter(i => shotSafe(i.key) && !failed[i.key] && !fs.existsSync(shotFile(i.key))).map(i => {
    const k = pkey(i.name);
    // a Waves bundle like "API-550" holds "API-550A" and "API-550B": take the first that starts with its name
    const w = wavesClass.get(k) || (i.fmt === 'Waves' && k.length > 3 ? [...wavesClass].find(([c]) => c.startsWith(k))?.[1] : null);
    return i.fmt === 'VST3' && i.path ? { ...i, args: [i.path] } : w ? { ...i, args: [w.shell, null, w.name] } : null;
  }).filter(Boolean);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rummage-snap-'));
  let done = 0, got = 0;
  const total = jobs.length;
  const send = (it, ok) => { try { e.sender.send('shotProgress', { done, total, got, name: it && it.name, key: ok ? it.key : '', dim: ok ? jpegSize(shotFile(it.key)) : null }); } catch {} };
  send(null, false);
  const worker = async () => {
    while (jobs.length && !snapStop) {
      const it = jobs.shift(), out = path.join(tmp, it.key + '.png'), args = it.args.slice();
      args[1] = out;
      const r = await snapRun(args, it.fmt === 'Waves' ? 45000 : 25000);
      let ok = false;
      try { if (r.ok && fs.existsSync(out)) { writeShot(it.key, nativeImage.createFromPath(out)); ok = true; got++; } } catch {}
      if (!ok) failed[it.key] = 1;
      try { fs.unlinkSync(out); } catch {}
      done++; send(it, ok);
    }
  };
  // shortcut: 3 plug-ins at once keeps CPU sane; heavy samplers can still take ~20 s each
  await Promise.all([worker(), worker(), worker()]);
  try { fs.writeFileSync(SNAP_FAILED, JSON.stringify(failed)); } catch {}
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  return { total, got, stopped: snapStop, files: shotIndex() };
  } finally { snapBusy = false; }
});

// the running host's processes and its main window, so plugin editors can be told apart
const HOSTPROC = { fl: ['FL64', 'FL'], live: ['Ableton Live*'] };
async function hostScope(host) {
  const pids = await shots.pidsFor(HOSTPROC[host] || HOSTPROC.fl);
  if (!pids.length) return null;
  const ws = await shots.listWindows();
  const mine = ws.filter(w => pids.includes(Number(w.pid)));
  const main = mine.slice().sort((a, b) => (b.w * b.hh) - (a.w * a.hh))[0];
  return { pids, mainHandle: main ? main.h : 0 };
}

// One capture job at a time; every step reports back so the UI can show progress.
const cap = { running: false, stop: false, done: 0, total: 0, current: '', error: '', failed: [] };
const capSend = (win, extra = {}) => {
  if (win && !win.isDestroyed()) win.webContents.send('cap', {
    running: cap.running, done: cap.done, total: cap.total, current: cap.current,
    error: cap.error, failed: cap.failed.length, ...extra,
  });
};

// grabs one editor window into shots/<key>.jpg, returns false when there is nothing usable
async function grab(handle, key) {
  const png = path.join(os.tmpdir(), 'rummage-shot-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) + '.png');
  try {
    const r = await shots.captureWindow(handle, png);
    if (!r || !r.ok) return false;
    const img = nativeImage.createFromPath(png);
    if (!img || img.isEmpty()) return false;
    writeShot(key, img);
    return true;
  } finally { try { fs.unlinkSync(png); } catch {} }
}

ipcMain.handle('capStart', async (e, host, list, opts = {}) => {
  if (cap.running) return { ok: false, error: 'a capture is already running' };
  const win = BrowserWindow.fromWebContents(e.sender);
  const scope = await hostScope(host);
  if (!scope) return { ok: false, error: host === 'fl' ? 'FL Studio is not running' : 'Ableton Live is not running' };
  cap.running = true; cap.stop = false; cap.done = 0; cap.total = list.length; cap.current = ''; cap.error = ''; cap.failed = [];
  capSend(win);
  (async () => {
    for (const it of list) {
      if (cap.stop) break;
      cap.current = it.name || '';
      capSend(win);
      let editor = null;
      try {
        const before = await shots.listWindows();
        const known = new Set(before.map(w => w.h));
        // ask the host to open this plugin
        if (host === 'fl' && it.fst) shell.openPath(it.fst);
        else if (host === 'live') { sendToLive(it.name || '', true); }
        else throw new Error('no way to open this plugin');
        await shots.sleep(opts.settle || 900);
        editor = await shots.waitForPluginWindow({
          pids: scope.pids, exclude: [...known, scope.mainHandle],
          minW: 200, minH: 120, timeout: opts.timeout || 12000, match: it.name || '',
        });
        if (!editor) throw new Error('the plugin window did not appear');
        if (!(await grab(editor.h, it.key))) throw new Error('the window could not be captured');
        cap.done++;
      } catch (err) {
        cap.error = (it.name || '') + ': ' + (err && err.message || err);
        cap.failed.push({ id: it.id, key: it.key, error: String(err && err.message || err) });
      } finally {
        if (opts.cleanup !== false) {
          try {
            if (editor) { await shots.closeWindow(editor.h); await shots.sleep(350); }
            await shots.sendKeys('^z'); // undo the channel/track the scan just added
          } catch {}
        }
      }
      capSend(win);
    }
    cap.running = false; cap.current = '';
    capSend(win, { state: 'done' });
  })().catch(err => { cap.running = false; cap.error = String(err && err.message || err); capSend(win, { state: 'done' }); });
  return { ok: true, total: list.length };
});

ipcMain.handle('capStop', () => { cap.stop = true; return { ok: true }; });

// manual: capture whichever plugin editor is in front right now
ipcMain.handle('capSnap', async (e, host, key, name) => {
  if (!shotSafe(key)) return { ok: false, error: 'bad key' };
  const scope = await hostScope(host);
  if (!scope) return { ok: false, error: host === 'fl' ? 'FL Studio is not running' : 'Ableton Live is not running' };
  const w = await shots.newestPluginWindow({ pids: scope.pids, exclude: [scope.mainHandle], match: name || '', minW: 200, minH: 120 });
  if (!w) return { ok: false, error: 'no plugin window found — open the plugin first' };
  const ok = await grab(w.h, key);
  return ok ? { ok: true, files: shotIndex() } : { ok: false, error: 'the window could not be captured' };
});

function sendToLive(name, enter) {
  clipboard.writeText(name);
  const ps = `Add-Type -AssemblyName Microsoft.VisualBasic,System.Windows.Forms
$p = Get-Process | ? { $_.MainWindowTitle -like '*Ableton Live*' } | select -First 1
if ($p) { [Microsoft.VisualBasic.Interaction]::AppActivate($p.Id); Start-Sleep -m 350
[System.Windows.Forms.SendKeys]::SendWait('^f'); Start-Sleep -m 200; [System.Windows.Forms.SendKeys]::SendWait('^v')${enter ? "; Start-Sleep -m 500; [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')" : ''} }`;
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
// editable scan locations: samples, vst3, vst2, clap, waves, fl
ipcMain.handle('paths', () => ({ paths: paths(), defaults: DEFAULT_PATHS() }));
ipcMain.handle('pathAdd', async (_, key, replace) => {
  const r = await dialog.showOpenDialog({ properties: ['openDirectory'], defaultPath: replace || undefined });
  if (r.canceled) return null;
  const P = paths(), list = P[key].filter(x => x !== replace);
  if (!list.some(x => x.toLowerCase() === r.filePaths[0].toLowerCase())) list.push(r.filePaths[0]);
  db.paths = { ...P, [key]: list }; saveDb(); return paths();
});
ipcMain.handle('pathRm', (_, key, p) => { const P = paths(); db.paths = { ...P, [key]: P[key].filter(x => x !== p) }; saveDb(); return paths(); });
ipcMain.handle('pathReset', (_, key) => { db.paths = { ...paths(), [key]: DEFAULT_PATHS()[key] }; saveDb(); return paths(); });
// kept for the "add folder" shortcuts: they edit the sample locations
ipcMain.handle('addFolder', async () => { const r =await dialog.showOpenDialog({ properties: ['openDirectory'] }); if (r.canceled) return null; const s = paths().samples; if (!s.includes(r.filePaths[0])) db.paths = { ...paths(), samples: [...s, r.filePaths[0]] }; saveDb(); return paths().samples; });
ipcMain.handle('rmFolder', (_, f) => { db.paths = { ...paths(), samples: paths().samples.filter(x => x !== f) }; saveDb(); return paths().samples; });
// which screen edge Rummage sits on: the half of the display its centre is in
function sideOf(w) {
  const { screen } = require('electron');
  const b = w.getBounds(), wa = screen.getDisplayMatching(b).workArea;
  return b.x + b.width / 2 > wa.x + wa.width / 2 ? 'right' : 'left';
}
// Windows 11 draws a 1px light border and rounded corners round every window; both leave a visible
// seam when Rummage is flush against the screen edge or the DAW, so turn them off for this window
function flushChrome(w) {
  const hwnd = w.getNativeWindowHandle().readBigUInt64LE(0).toString();
  const ps = 'Add-Type @"\nusing System;using System.Runtime.InteropServices;\npublic class M{[DllImport("dwmapi.dll")]public static extern int DwmSetWindowAttribute(IntPtr h,int a,ref int v,int s);}\n"@\n'
    + `$h=[IntPtr]${hwnd};$none=-2;$sq=1;[M]::DwmSetWindowAttribute($h,34,[ref]$none,4)|Out-Null;[M]::DwmSetWindowAttribute($h,33,[ref]$sq,4)|Out-Null`;
  exec('powershell -NoProfile -EncodedCommand ' + Buffer.from(ps, 'utf16le').toString('base64'), () => {});
}
// dock: Rummage on one edge of the screen, the host DAW's window filling the rest
function dockHost(host, w, side = sideOf(w)) {
  const { screen } = require('electron');
  const disp = screen.getDisplayMatching(w.getBounds()), wa = disp.workArea, sf = disp.scaleFactor;
  const width = Math.min(w.getBounds().width, Math.round(wa.width * .4)), right = side === 'right';
  if (w.isMaximized()) w.unmaximize();
  w.setBounds({ x: right ? wa.x + wa.width - width : wa.x, y: wa.y, width, height: wa.height });
  // physical pixels; Windows windows have ~7px invisible borders on the sides and bottom
  const X = Math.round((right ? wa.x : wa.x + width) * sf) - 7, Y = Math.round(wa.y * sf), W = Math.round((wa.width - width) * sf) + 14, H = Math.round(wa.height * sf) + 7;
  const find = host === 'fl' ? 'Get-Process -Name FL64,FL -ErrorAction SilentlyContinue' : "Get-Process | ? { $_.ProcessName -like 'Ableton Live*' }";
  const ps = 'Add-Type @"\nusing System;using System.Runtime.InteropServices;\npublic class D{[DllImport("user32.dll")]public static extern bool ShowWindow(IntPtr h,int c);[DllImport("user32.dll")]public static extern bool SetWindowPos(IntPtr h,IntPtr a,int x,int y,int w,int ht,uint f);}\n"@\n'
    + `$p = ${find} | ? { $_.MainWindowHandle -ne 0 } | select -First 1\n`
    + `if ($p) { [D]::ShowWindow($p.MainWindowHandle, 9) | Out-Null; [D]::SetWindowPos($p.MainWindowHandle, [IntPtr]::Zero, ${X}, ${Y}, ${W}, ${H}, 0x0044) | Out-Null; 'docked' } else { 'none' }`;
  exec('powershell -NoProfile -EncodedCommand ' + Buffer.from(ps, 'utf16le').toString('base64'), (e, out) => { if (!w.isDestroyed()) w.webContents.send('docked', String(out || '').trim()); });
}
ipcMain.on('dock', (e, host, side) => dockHost(host, BrowserWindow.fromWebContents(e.sender), side === 'left' || side === 'right' ? side : undefined));
// FL Studio opens a plugin's .fst into the running project
ipcMain.on('openFst', (_, p) => { if (/\.fst$/i.test(p)) shell.openPath(p); });
ipcMain.handle('read', (_, p) => fs.promises.readFile(p));
ipcMain.on('drag', (e, p) => e.sender.startDrag({ file: p, icon: dragIcon }));
ipcMain.on('live', (_, n) => sendToLive(n));
ipcMain.on('reveal', (_, p) => shell.showItemInFolder(p));
ipcMain.on('openRepo', () => shell.openExternal('https://github.com/mitoisgrowing/rummage'));
ipcMain.on('openLoopMidi', () => shell.openExternal('https://www.tobias-erichsen.de/software/loopmidi.html'));
// the native min/max/close buttons follow the theme's header colour and the interface size
let tbColor = '#2a2a2a', tbScale = 1;
const paintTitlebar = w => w.setTitleBarOverlay({ color: tbColor, symbolColor: '#bdbdbd', height: Math.round(32 * tbScale) });
ipcMain.on('zoom', (e, s) => { tbScale = s; e.sender.setZoomFactor(s); paintTitlebar(BrowserWindow.fromWebContents(e.sender)); });
ipcMain.on('titlebar', (e, c) => { tbColor = c; paintTitlebar(BrowserWindow.fromWebContents(e.sender)); });
ipcMain.on('top',(e, v) => BrowserWindow.fromWebContents(e.sender).setAlwaysOnTop(v));

// ---------- project previews: a few seconds of how each project sounds ----------
const SNIPS = path.join(app.getPath('userData'), 'snips'), SNIPIDX = path.join(SNIPS, 'index.json');
try { fs.mkdirSync(SNIPS, { recursive: true }); } catch {}
const snipIdx = () => { try { return JSON.parse(fs.readFileSync(SNIPIDX, 'utf8')); } catch { return {}; } };
// project path -> { f: file name, t: time recorded }
ipcMain.handle('snips', () => ({ dir: SNIPS, map: snipIdx() }));
ipcMain.handle('snipSave', (_, id, buf) => {
  if (typeof id !== 'string' || !buf || buf.byteLength < 200 || buf.byteLength > 3e6) throw new Error('bad clip');
  const idx = snipIdx(), f = crypto.createHash('sha1').update(id.toLowerCase()).digest('hex').slice(0, 16) + '.webm';
  fs.writeFileSync(path.join(SNIPS, f), Buffer.from(buf));
  idx[id] = { f, t: Date.now() }; fs.writeFileSync(SNIPIDX, JSON.stringify(idx));
  return idx;
});
ipcMain.handle('snipDelete', (_, id) => { const idx = snipIdx(); if (idx[id]) { try { fs.unlinkSync(path.join(SNIPS, idx[id].f)); } catch {} delete idx[id]; fs.writeFileSync(SNIPIDX, JSON.stringify(idx)); } return idx; });
// the open project's name is in the DAW's window title
ipcMain.handle('dawTitle', (_, host) => new Promise(r => exec(`tasklist /v /fo csv /nh /fi "imagename eq ${host === 'live' ? 'Ableton*' : 'FL*'}"`, { windowsHide: true }, (e, out) => {
  if (e) return r('');
  const titles = String(out).split(/\r?\n/).map(l => (l.match(/"([^"]*)"\s*$/) || [])[1]).filter(t => t && t !== 'N/A' && /FL Studio|Ableton/i.test(t));
  r(titles[0] || '');
})));

// the DAW link runs on Web MIDI (sysex over a loopMIDI port), which needs these two permissions
const MIDI_OK = new Set(['midi', 'midiSysex']);
// copies the DAW-side script where FL (Settings/Hardware) or Live (User Library/Remote Scripts) looks for it
ipcMain.handle('dawScript', (_, host) => {
  const base = app.isPackaged ? path.join(process.resourcesPath, 'daw') : path.join(__dirname, 'daw');
  const live = host === 'live';
  const src = live ? path.join(base, 'live', 'Rummage') : path.join(base, 'fl');
  const dir = live ? path.join(docs, 'Ableton', 'User Library', 'Remote Scripts', 'Rummage') : path.join(paths().fl[0] || path.join(docs, 'Image-Line', 'FL Studio'), 'Settings', 'Hardware', 'Rummage');
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(src)) fs.copyFileSync(path.join(src, f), path.join(dir, f));
  return dir;
});
app.whenReady().then(async () => {
  const { session } = require('electron');
  session.defaultSession.setPermissionRequestHandler((wc, p, cb) => cb(MIDI_OK.has(p) || p === 'media'));
  session.defaultSession.setPermissionCheckHandler((wc, p) => MIDI_OK.has(p) || p === 'media');
  // project previews record what the computer is playing (Windows loopback), never the screen
  session.defaultSession.setDisplayMediaRequestHandler((req, cb) => {
    require('electron').desktopCapturer.getSources({ types: ['screen'] }).then(s => cb({ video: s[0], audio: 'loopback' })).catch(() => cb({}));
  });
  const wa = require('electron').screen.getPrimaryDisplay().workArea;
  const w = new BrowserWindow({
    x: wa.x, y: wa.y, width: 480, height: wa.height, minWidth: 300, alwaysOnTop: true,
    backgroundColor: '#1e1e1e', autoHideMenuBar: true, title: 'Rummage', icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'hidden', titleBarOverlay: { color: '#2a2a2a', symbolColor: '#bdbdbd', height: 32 },
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  w.loadFile('index.html');
  w.once('ready-to-show', () => flushChrome(w));
  w.webContents.on('did-finish-load', () => { flushChrome(w); w.webContents.send('side', sideOf(w)); });
  w.on('moved', () => w.webContents.send('side', sideOf(w)));
  setInterval(() => exec('tasklist /fo csv /nh', (e, out) => { if (!e && !w.isDestroyed()) w.webContents.send('daws', { live: /Ableton Live/i.test(out), fl: /"FL(64)?\.exe"/i.test(out) }); }), 4000);
  watch(w);
  ipcMain.on('rewatch', () => watch(w));
});
app.on('window-all-closed', () => app.quit());
