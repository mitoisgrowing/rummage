# name=Rummage
# url=https://github.com/mitoisgrowing/rummage
"""
Rummage's FL Studio controller script.

Rummage and FL talk over one loopMIDI port called "Rummage". In FL, MIDI settings:
  input  "Rummage" -> Controller type "Rummage", Port 52
  output "Rummage" -> Port 52
The script tells Rummage the project tempo and whether FL is playing, so previews follow
the project. Messages are sysex with the non-commercial id 0x7D and Rummage's tag 0x52:

  F0 7D 52 10 t2 t1 t0 pl F7   FL -> Rummage   tempo x100 as three 7-bit bytes, pl = 1 while playing
  F0 7D 52 02 F7               Rummage -> FL   ping: send the state again now
"""
import device
import mixer
import transport

_last = None


def _tempo():
    # getCurrentTempo() is the bpm as a float on recent FL, tempo x1000 on older builds
    v = mixer.getCurrentTempo()
    return v / 1000.0 if v > 1000 else v


def _send(force=False):
    global _last
    t = int(round(_tempo() * 100)) & 0x1FFFFF
    p = 1 if transport.isPlaying() else 0
    if not force and (t, p) == _last:
        return
    _last = (t, p)
    device.midiOutSysex(bytes([0xF0, 0x7D, 0x52, 0x10, (t >> 14) & 0x7F, (t >> 7) & 0x7F, t & 0x7F, p, 0xF7]))


def OnInit():
    _send(True)


def OnIdle():
    _send()


def OnSysEx(event):
    d = event.sysex
    if len(d) >= 5 and d[1] == 0x7D and d[2] == 0x52:
        if d[3] == 0x02:
            _send(True)
        event.handled = True  # our own tempo messages loop back through the port too
