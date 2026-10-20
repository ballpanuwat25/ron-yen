# Ron Yen

Portfolio piece 2: a fictional social sauna and ice bath studio on Soi Ari 7, Bangkok. Built the same way as Saeng House (Next.js 15, React 19, Tailwind 4).

- Sauna 88°, ten on the bench; two ice baths at 3°; 75-minute sessions, ten a slot, every 90 minutes from 06:30.
- Hero: the sauna printed in ember under thin rules; one wide fogged window you wipe to see the ice bath, printed in cold blue. The reading follows how much ice shows. Steam trails the pointer outside the glass; drips run down the glass on their own.
- Copy and demo data live in `src/content/site.ts`. The hero's canvas work is `src/lib/glass.ts`.
- Photos are Unsplash, cropped by `npm run photos` from `design/photos-src` (not in git).
- `design/mockup` holds the static sketches that led to the hero (serve with the `ron-yen-mockup` launch config).

Decisions, pricing and the system plan are in Notion: Fastwork Content › ไอเดียชิ้นที่ 2: Ron Yen.

```bash
npm run dev -- -p 3012
```
