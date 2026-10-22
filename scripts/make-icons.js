// Renders assets/logo.png (if present) or assets/icon.svg into assets/icon.png and build/icon.ico.
// Run with: npm run icons
const { app, BrowserWindow, nativeImage } = require('electron');
const fs = require('fs'), path = require('path');

const root = path.join(__dirname, '..');
const SIZES = [16, 24, 32, 48, 64, 128, 256];

// ICO container holding PNG-compressed images (supported since Windows Vista)
function ico(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let off = head.length;
  pngs.forEach(([s, buf], i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(s >= 256 ? 0 : s, e); head.writeUInt8(s >= 256 ? 0 : s, e + 1);
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(buf.length, e + 8); head.writeUInt32LE(off, e + 12);
    off += buf.length;
  });
  return Buffer.concat([head, ...pngs.map(p => p[1])]);
}

async function renderSvg() {
  const svg = fs.readFileSync(path.join(root, 'assets', 'icon.svg')).toString('base64');
  const w = new BrowserWindow({ show: false, width: 512, height: 512, frame: false, transparent: true, backgroundColor: '#00000000', webPreferences: { offscreen: true } });
  w.webContents.setFrameRate(1);
  await w.loadURL('data:text/html,' + encodeURIComponent(`<html><body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${svg}" style="width:512px;height:512px;display:block"></body></html>`));
  await new Promise(r => setTimeout(r, 400));
  return w.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 });
}

app.whenReady().then(async () => {
  const logo = path.join(root, 'assets', 'logo.png');
  const big = fs.existsSync(logo) ? nativeImage.createFromPath(logo).resize({ width: 512, height: 512, quality: 'best' }) : await renderSvg();
  const pngs = SIZES.map(s => [s, big.resize({ width: s, height: s, quality: 'best' }).toPNG()]);
  fs.mkdirSync(path.join(root, 'build'), { recursive: true });
  fs.writeFileSync(path.join(root, 'assets', 'icon.png'), big.resize({ width: 256, height: 256, quality: 'best' }).toPNG());
  fs.writeFileSync(path.join(root, 'build', 'icon.png'), big.resize({ width: 512, height: 512, quality: 'best' }).toPNG());
  fs.writeFileSync(path.join(root, 'build', 'icon.ico'), ico(pngs));
  console.log('icons written:', SIZES.join(', '));
  app.quit();
});
