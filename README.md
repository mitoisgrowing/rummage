<p align="center"><img src="build/icon.png" width="96" alt="Rummage logo"></p>

<h1 align="center">Rummage</h1>

<p align="center">A compact sample, plugin and preset browser that docks next to Ableton Live 12.<br>
Dig through your Splice samples, plugins, racks and saved channels from one narrow window.</p>

<p align="center"><img src="docs/screenshot.png" width="360" alt="Rummage screenshot"></p>

## Features

- **One library for everything.** Splice samples, your Ableton User Library, extra folders, VST2/VST3 plugins, Waves plugins and Live's own devices.
- **Folder tree with colour waveforms.** Every sample gets a small waveform tinted by timbre (warm for lows, cool for highs).
- **Preview panel.** Click to play from any point. Right-click and hold to audition. Scroll to zoom and drag the waveform straight into Ableton.
- **Pitch and tempo are independent.** Pitch, fine and octave change the key without changing speed. Tempo changes speed (shown in BPM) without changing the key.
- **Quick edits.** Trim, normalize, swap L/R, polarity, reverse and gain, with *save* to write a new WAV into `Documents\Rummage\Edits`.
- **Organise your way.**
  - Favourites, tags, colour labels and custom icons per folder.
  - Crates (collections) and pinned folders in the sidebar.
  - Saved searches. Searches can also use `bpm:140` and `key:Am`.
- **Plugins sorted by job.** Compressors, EQ, tuners, reverb/delay, saturation, creative effects, utilities and synths. Change any category with one click.
- **Live sync.** The library rescans by itself when you download new Splice sounds. Racks or channels you save from Live into `Documents\Rummage\Library` show up instantly.
- **Make it yours.** Background image, interface size (80–160 %), row height, always-on-top.

## Screenshots

| Library | Plugins by job | Search |
| --- | --- | --- |
| <img src="docs/screenshot.png" width="240" alt="Folder tree with colour waveforms"> | <img src="docs/plugins.png" width="240" alt="Plugins grouped by category"> | <img src="docs/search.png" width="240" alt="Search results"> |

**Preview panel:** waveform, gain, pitch / fine / octave, tempo in BPM and quick edits.

<img src="docs/preview-panel.png" width="428" alt="Preview panel">

## Install

Download `Rummage Setup x.y.z.exe` from the [Releases](https://github.com/mitoisgrowing/rummage/releases/latest) page and run it.

> The installer is not code-signed yet, so Windows SmartScreen may warn you. Click *More info → Run anyway*.

## Save racks and channels from Live

1. In Live's browser, click **Add Folder** under *Places* and pick `Documents\Rummage\Library`.
2. Drag any device, rack or whole track into that folder. Live saves it as `.adv`, `.adg` or `.als`.
3. It appears in Rummage under **My Library**, ready to drag back into any set.

## Run from source

```bash
git clone https://github.com/mitoisgrowing/rummage.git
cd rummage
npm install
npm start
```

| Script | What it does |
| --- | --- |
| `npm start` | Run the app |
| `npm run icons` | Re-render `assets/icon.png` and `build/icon.ico` from `assets/icon.svg` |
| `npm run dist` | Build the Windows installer into `dist/` |

## Keyboard

| Key | Action |
| --- | --- |
| ↑ / ↓ | Move through the list (samples play automatically) |
| ← / → | Collapse / expand a folder |
| Space | Play / stop |
| Enter | Open a folder, or find the selected plugin in Live |
| F | Favourite |
| Ctrl + / Ctrl − / Ctrl 0 | Interface size |
| Esc | Clear search |

## Limitations

- Windows only for now. The scanning paths are Windows paths.
- "Load into Ableton" for plugins focuses Live's own search with the plugin name. You still press Enter in Live. Samples, racks and presets load by drag and drop.
- Plugin categories are guessed from names. Fix any of them from the preview panel.

## Contributing

[Issues](https://github.com/mitoisgrowing/rummage/issues) and pull requests are welcome. The app is plain Electron with no framework:

- `main.js` scans the disk and talks to Windows.
- `preload.js` exposes a small API.
- `index.html` holds the whole UI.

## License

[MIT](LICENSE)
