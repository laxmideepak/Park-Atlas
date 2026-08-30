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

| Asset (public/audio/) | Subject | Source page | Credit on page | PD signal verified | Retrieved |
|---|---|---|---|---|---|
| `ambient-yell.mp3` | "Soundscape - Geyser Hill", Yellowstone — stream off the boardwalk with background geyser rumbles and wind (binaural); 60s loop cut of the 63s original, 96 kbps mp3, 1.5s afade at each end of the loop seam | https://www.nps.gov/yell/learn/photosmultimedia/sounds-soundscapes.htm | "Credit / Author: NPS/Peter Comley", date created 03/22/2015; no © symbol / no third-party rights holder anywhere in the element's metadata block | Yes — audio URL extracted from the page's raw HTML (https://www.nps.gov/nps-audiovideo/legacy/mp3/imr/avElement/yell-030401GeyserHillStreamOffBoardwalkBackgroundGeyserRumblesAndWindBinaural0101.mp3), curl-verified HTTP 200 `audio/mpeg` direct from nps.gov | 2026-08-29 |
