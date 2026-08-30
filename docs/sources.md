# Media sources registry

Every hand-curated media asset (Living Hero video clips, and any future
hand-placed media outside the automated NPS-API photo pipeline) gets a row
here: what it is, exactly where it came from, and the public-domain evidence
observed at retrieval time. The automated photo pipeline's provenance lives in
code instead (`src/lib/nps.ts` rights filter + `src/lib/data/hero-manifest.ts`
`sourceUrl` fields).

**Public-domain signal (NPS usage terms):** the source page credits "NPS"
(optionally with a ranger's name) and shows **no copyright symbol / no
third-party rights holder**. Anything credited otherwise is excluded.

## Living Hero video clips

| Asset (public/video/) | Subject | Source page | Credit on page | PD signal verified | Retrieved |
|---|---|---|---|---|---|
| `yell-bison-lamar-*` (1080/540/poster) | Bison grazing, Lamar Valley, Yellowstone — 12s window of the 20s "Bison in Summer" clip 1 | https://www.nps.gov/yell/learn/photosmultimedia/vl_bisonsummer.htm | Yellowstone Video Library; page metadata states "Copyright Info: Public domain", Audio: none | Yes — curl-verified HTTP 200 video/mp4 direct from nps.gov; page shows no © / no third-party rights holder (independently re-verified by a second reviewer pass) | 2026-08-29 |

## Ambient audio

`ambient-dawn-chorus.mp3` is the live track (`src/components/AmbientSound.tsx`);
the other two are committed alternates cut to the same loop spec (60–75s loop,
1.5s afade at each end of the loop seam, 96 kbps mp3, loudness matched to
≈ −36 LUFS integrated). The earlier `ambient-yell.mp3` (Geyser Hill
stream/rumble) was retired 2026-08-29 and its file deleted.

| Asset (public/audio/) | Subject | Source page | Credit on page | License | PD/CC0 signal verified | Retrieved |
|---|---|---|---|---|---|---|
| `ambient-dawn-chorus.mp3` | "Dawn Chorus", Yellowstone — many kinds of songbirds singing with woodpeckers drumming softly (per the page's audio transcript); 60s loop cut of the 62s original | https://www.nps.gov/yell/learn/photosmultimedia/sounds-dawnchorus.htm | "Credit / Author: NPS/Jennifer Jerrett", date created 06/28/2014; no © symbol / no third-party rights holder anywhere in the element's metadata block | Public domain (NPS) | Yes — audio URL extracted from the page's raw HTML (https://www.nps.gov/nps-audiovideo/legacy/mp3/imr/avElement/yell-YELLDawnChorus.mp3), curl-verified HTTP 200 `audio/mpeg` direct from nps.gov | 2026-08-29 |
| `ambient-creek.mp3` | Small flowing creek, soft steady water (recorded as a seamless loop by the author); 75s cut of the 139s original | https://freesound.org/people/Hano_van_Dalen/sounds/767320/ | Uploaded by Hano_van_Dalen; sound page shows license "Creative Commons 0" | CC0 | Yes — license "Creative Commons 0" confirmed on the sound page at retrieval; preview mp3 (https://cdn.freesound.org/previews/767/767320_15758192-hq.mp3) curl-verified HTTP 200 `audio/mpeg`. CC0 requires no attribution; provenance logged anyway | 2026-08-29 |
| `ambient-forest-birds.mp3` | Distant songbirds in a quiet forest (Skephult, Sweden), very sparse and serene; 75s cut of the 182s original, gentle 4:1 compression above −40 dB to tame two close bird calls that spiked ~38 dB over the bed | https://freesound.org/people/forestfjord/sounds/816111/ | Uploaded by forestfjord; sound page shows license "Creative Commons 0" | CC0 | Yes — license "Creative Commons 0" confirmed on the sound page at retrieval; preview mp3 (https://cdn.freesound.org/previews/816/816111_9361706-hq.mp3) curl-verified HTTP 200 `audio/mpeg`. CC0 requires no attribution; provenance logged anyway | 2026-08-29 |

## Premium park photography (Wikimedia Commons)

Hero-tier photos for 61/63 parks (28 Commons **Featured**, 19 Quality, 1 Valued),
each license-verified twice (sweep + independent adversarial re-check) against
the allowlist: Public domain / CC0 / CC BY / CC BY-SA only — no NC/ND. Per-file
provenance (author, license, license URL, Commons file page, assessment badge,
source resolution) lives in `src/lib/data/premium-photos.json` (the registry of
record for these; 61 rows), validated on every build by
`scripts/validate-datasets.mjs`. Attribution is rendered on-site: the hero
credit chip shows "Photo: {author} · {license}" and links the Commons file
page. glac + thro had no qualifying pick and fall back to the NPS pipeline.
