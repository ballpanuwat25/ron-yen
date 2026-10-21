// Ron Yen · the film's score, for Strudel (strudel.cc): paste it in and press play.
// An easy afternoon in a Nordic sauna, not a beat: no drum machine. D major, warm and slow. A soft electric
// piano holds the chords, nylon guitar picks through them, a wooden ladle knocking on the bucket keeps time,
// water hisses on the hot stones now and then, and the ice comes in as celesta and meltwater.
// 72 bpm, one cycle a bar of 3.33 s, sixteen bars for the 53-second film, each part as long as its scene:
//   heat    bars 1–2    the title card and the loader climbing to 88°: the piano alone, steam rising
//   wipe    bar 3       the window wiped clear: a hiss on the stones, the first celesta notes and drips
//   plan    bars 4–7    the guests walk the studio: guitar and the ladle, a round bass underneath
//   book    bars 8–11   a time picked, the tag and its QR: the celesta carries a tune, the cello answers
//   find    bars 12–15  the walk from BTS Ari and the footer: lighter, the drips come back
//   close   bar 16      the closing card: one last hiss and the chord rings out

setcpm(72 / 4)

const chords = chord("<D^9 G^7 Bm9 A6>")

// the bench: a warm electric piano, soft and wide
const keys = chords.voicing().s("gm_epiano1")
  .attack(.05).release(2).gain(.45).lpf(2600).room(.6).roomsize(5).pan(sine.range(.4, .6).slow(4))

// nylon guitar picking through each chord
const guitar = chords.voicing().arp("<[0 1 2 3 2 1 2 3] [0 2 1 3 2 1 0 2]>").s("gm_acoustic_guitar_nylon")
  .gain(.38).lpf(3200).room(.4)

// the bass, round and unhurried
const bass = note("<[d2 ~ ~ a1] [g1 ~ ~ d2] [b1 ~ ~ f#2] [a1 ~ e2 ~]>").s("gm_acoustic_bass")
  .gain(.6).lpf(900)

// water on the hot stones: a hiss that falls away, kept low and rare so it marks a turn in the film rather
// than pulling the ear every bar: as the window is wiped, once inside each four-bar part, and at the close
const hiss = s("white").hpf(3200).lpf(8000).attack(.08).decay(1.8).sustain(0).gain(.08).room(.6)
const loyly = hiss.struct("<~ ~ x ~>")

// the heat rising before the doors open: brown noise opening over the two bars of the loader
const rising = s("brown").lpf(saw.range(200, 2200).slow(2)).gain(saw.range(.03, .18).slow(2)).attack(.6).release(1.2)

// the ladle on the bucket: wood, never quite on the grid
const ladle = s("woodblock").struct("x ~ ~ ~ ~ ~ x ~ ~ ~ x ~ ~ ~ ~ ~").gain(.3).lpf(3200).room(.45).nudge(perlin.range(0, .015))
const ladleSoft = s("woodblock").struct("x ~ ~ ~ ~ ~ ~ ~ ~ ~ x ~ ~ ~ ~ ~").gain(.22).lpf(3000).room(.6)

// the ice: celesta, a few notes high and apart
const ice = n("<[~ 4 ~ ~] [2 ~ ~ 4] [~ ~ 5 ~] [4 ~ 2 ~]>").scale("D5:major pentatonic").s("gm_celesta")
  .gain(.4).room(.8).delay(.35).delaytime(.5).delayfeedback(.4)

// the tune for the booking, celesta over the piano, and the cello answering from below
const tune = n("<[0 1 2 ~ 4 ~ 2 ~] [1 2 ~ 4 ~ 2 1 ~] [0 ~ 2 4 5 ~ 4 ~] [2 ~ 1 ~ 0 ~ ~ ~]>").scale("D5:major pentatonic")
  .s("gm_celesta").gain(.4).room(.7).delay(.25).delaytime(.375)
const answer = note("<~ [a3 ~ ~ f#3] ~ [e3 ~ c#3 ~]>").s("gm_cello").attack(.2).release(1.5).gain(.32).room(.7)

// meltwater dripping off the glass
const drip = note("<a6 ~ d7 ~ [~ f#6] ~ e6 ~>").fast(2).s("sine")
  .decay(.06).sustain(0).gain(.16).degradeBy(.4).room(.9).delay(.3)

// the closing chord, held
const last = note("[d3,a3,c#4,e4,f#4]").s("gm_epiano1").release(4).gain(.5).room(.8).roomsize(7)

arrange(
  [2, stack(keys.gain(.35), rising)],
  [1, stack(keys, hiss, ice, drip)],
  [4, stack(keys, guitar, bass, ladle, loyly, ice)],
  [4, stack(keys.gain(.35), guitar, bass, ladle, loyly, tune, answer)],
  [4, stack(keys, guitar.gain(.28), bass.gain(.45), ladleSoft, loyly, drip, ice.gain(.3))],
  [1, stack(last, hiss)],
)
