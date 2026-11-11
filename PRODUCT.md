# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Music producers on Windows (the author is a trap producer) who work in Ableton Live or FL Studio with large Splice sample libraries and hundreds of plugins. They keep Rummage open beside their DAW while producing and need to find, audition and drag a sound or plugin in seconds without leaving the flow.

## Product Purpose

Rummage scans the PC (samples, VST3/VST2/CLAP/Waves plugins, racks, presets, projects) and shows everything in one narrow window docked next to the DAW, so any sample or plugin can be found, previewed and dragged in quickly. Success: the producer stops digging through folders.

## Positioning

Free and open source (MIT), vibecoded, works with both Ableton Live and FL Studio, and docks itself next to the DAW automatically.

## Operating Context

- Lives as a narrow panel on one side of the screen, the DAW filling the rest. The user wants it to work on the left or the right, chosen or detected automatically.
- Used mid-session: fast keyboard browsing, auditioning, dragging into the DAW.
- Host-specific behaviour: Ableton (Live search, .adv/.adg/.als) and FL Studio (plugin database .fst, .flp projects).

## Capabilities and Constraints

- Electron app: main.js (scanning, Windows integration), preload.js, index.html (whole UI). Windows only.
- Must stay performant with thousands of samples (virtualised list, cached waveforms).
- All copy must reflect the current host (say "DAW" or the active host's name; never show FL text while in Ableton or vice versa).
- Requested next: direct preset saving into the library.
- Open decision: the replacement visual direction (see new-work).

## Brand Commitments

- Name: Rummage. Logo: grey folder with a blue melody-like waveform (assets/icon.svg).
- The user asked for an Apple-grade, smooth, clear, professional feel with smooth but cheap animations, guided by the Impeccable and Emil Kowalski design skills.

## Evidence on Hand

Real library counts from the author's PC (2,552 samples, 644+ plugins), product screenshots in docs/, promo videos in promo-out/. No testimonials or user counts exist; do not invent any.

## Product Principles

1. Speed in the flow: anything findable and draggable in seconds.
2. Host-aware, never host-confused.
3. Quiet tool next to a loud DAW: precise, compact, calm.
4. Customisable without clutter.
