# Ron Yen mockup (piece 2, signature test)

Static mockup, not a project yet. Serve with `python -m http.server 3011 --directory <this folder>`.

- `index.html`: hero + three sections.
  - Hero: pointer x (desktop hover, phone sideways drag) sets 88° → 3°; left edge hot. Idle 4 s and it breathes between the ends, resting at each. Warm steam rises off the stones; at the cold end a cool mist spills off the ice and sinks (replaced the edge frost, which read as scribbles).
  - One round: sticky section, a 75-minute temperature line (sauna 12, ice 2, deck 10, ×3) drawn as you scroll, with the drop riding it. Squarer chart on phones.
  - The rooms: warm half / cool half with room photos.
  - Sessions this week + packs: slot rows with 10 drops per slot for seats, waitlist on full slots, packs as a dotted ledger.
- `grade.py`: shared base grade then warm or cool curve. Sources in `src/` (Unsplash ids in names).

Photos (Unsplash):
- hero hot 1749561532113-80b8e0f918bd (steam over heater stones)
- hero cold 1681980016810-454f1c0c8fcc (wooden barrel of crushed ice; B&W original, cut below bystanders' legs)
- room sauna 1743286159555-ea765c1bc5e6, room bath 1724406040547-ec56fe9f1958 (has a plank across the tub)
- rejected: heaped-ice macro (did not read as a bath), 1770625467983 (HUUM logo)

Known issues: hero hot photo shows the HUUM basket logo at the bottom of the phone crop; room-bath plank looks odd; the scroll-drawn chart is close to Saeng House's scroll clock in spirit.

## Hero sketches (heroes/)
After "the mist animation isn't pretty": three alternatives, same photos and type, `heroes/index.html` lists them.
- A water line (WebGL): pointer y sets the water level; sauna above, ice barrel seen through water below, a sprung 1D surface that the pointer splashes. Phones: the water rises with scroll (sticky hero, 220svh).
- B thaw (WebGL): fbm melt edge biased from the left, heat haze on the hot side, still cold side, a wet bright rim. Reads a bit like camouflage at mid.
- C glass door (2D canvas): blurred sauna + milky haze + condensation beads as fog; wiping clears it (hover on desktop), fog creeps back, sparse drips run down. Reading drops 88 → 3 with the cleared share.

Picked: C. Panuwat wanted the plain soft wipe (no finger streaks), just clear for longer: each mask cell (float grid, 4 px) stays clear 4 s after its last wipe, then fogs back over ~5 s at a slightly noisy rate. Drips fog back the same way.

D (heroes/d-grid.html), after Panuwat asked for crossing lines like a reference and the wipe on part of the page only: the sauna photo printed in one ember colour (grayscale + multiply) under a ruled 3-column grid; the arched fogged pane in the centre is the only cold, wipeable place (fog = the slice of the photo behind it, blurred, same ember, beads, a sheen); left 88° reading follows the cleared share; right: today's next sessions with drops, and 3°. Phones: pane on top, 88°|3° side by side, sessions below.

E (heroes/e-door.html), after 'D copies the reference grid; wiping gives 3° twice; the photo in the glass does not match; rethink the glass': lines are isotherms at 88/31/3 labelled bench/deck/tubs with a 5° tick scale on the left; one big reading rides the scale (number + drop marker move down as the glass clears); the door is a tall pane with a wooden pull, off-centre; the ice is printed in a cold ink (grayscale + blue multiply) to match the ember print. Phones: door right, scale strip left, headline and sessions below.

F (heroes/f-window.html), after 'E's door looks odd, go back to the reference layout but merge the right two cells into one landscape window (rounded rectangle, the earlier offset outline), text at the bottom, and find another ice photo': two columns (sessions + one reading | wide fogged window), headline band at the bottom. Window photos: 1771508784012-60d2b3b0cc92 ice floes on dark water (default, rhymes with the sauna stones) and 1758001969632-c67b15c89f1f heaped ice, switchable in the mockup.
Window photo chosen: ice floes on dark water (1771508784012-60d2b3b0cc92); the photo switch is removed.
F update: the fog mask stores a peak and a wipe time per cell and eases back with smoothstep (hold 4 s, return 5 s); a stamp only restarts a cell where it makes it clearer, so later wipes leave no seams; the mask is drawn with a 3 px blur. Added warm steam puffs and a faint glow that trail the pointer outside the window (canvas under the grid, so the window covers it), thinning out fast while the pointer is on the glass.
F idle life: faint steam always rises from the foot of the hero (ambient puffs, alpha .22, not thinned by the glass), and every 8-12 s a drop runs down the window on its own with a bead at its head, clearing a thin line to the ice that fogs over 4 s after the drop stops.
Drips (idle and from wipes) are only washed-clear glass: a soft blurred streak, thin at the top and fuller near the bottom, ending in a slightly wider soft patch; no outline, no highlight. They run straight down and kink at most ~1 px around their start x. Tried and dropped: round beads, a cartoon teardrop with rim and highlight, dark beads left behind (read as dirt), and a wander that accumulated per frame (drips curved off sideways).
