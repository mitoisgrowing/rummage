# Rummage's Ableton Live remote script.
# Live > Settings > Link, Tempo & MIDI: Control Surface "Rummage", Input "Rummage", Output "Rummage".
# It tells Rummage the set's tempo and whether Live is playing, with the same sysex FL uses:
#   F0 7D 52 10 t2 t1 t0 pl F7   tempo x100 as three 7-bit bytes, pl = 1 while playing
#   F0 7D 52 02 F7               (from Rummage) ping: send the state again now
from _Framework.ControlSurface import ControlSurface


class Rummage(ControlSurface):
    def __init__(self, c_instance):
        ControlSurface.__init__(self, c_instance)
        self._last = None
        with self.component_guard():
            self.song().add_tempo_listener(self._send)
            self.song().add_is_playing_listener(self._send)
        self._send(True)

    def _send(self, force=False):
        t = int(round(self.song().tempo * 100)) & 0x1FFFFF
        p = 1 if self.song().is_playing else 0
        if not force and (t, p) == self._last:
            return
        self._last = (t, p)
        self._send_midi((0xF0, 0x7D, 0x52, 0x10, (t >> 14) & 0x7F, (t >> 7) & 0x7F, t & 0x7F, p, 0xF7))

    def handle_sysex(self, midi_bytes):
        if len(midi_bytes) >= 5 and midi_bytes[1] == 0x7D and midi_bytes[2] == 0x52 and midi_bytes[3] == 0x02:
            self._send(True)
        else:
            ControlSurface.handle_sysex(self, midi_bytes)

    def disconnect(self):
        self.song().remove_tempo_listener(self._send)
        self.song().remove_is_playing_listener(self._send)
        ControlSurface.disconnect(self)


def create_instance(c_instance):
    return Rummage(c_instance)
