# US Government Open Data Audit & Integration Roadmap for ParkAtlas

**Status:** Research complete — live-verified August 2026
**Scope:** Every government-data claim currently shipped in ParkAtlas UI/code, plus a catalog of verified and candidate federal sources for all 63 National Parks.
**Method:** Every claim below was tested against the live API/file with `curl` (evidence dates 2026-08-28/29), then adversarially re-verified — including deliberate spot-checks on the three hardest parks (American Samoa `npsa`, Gates of the Arctic `gaar`, Virgin Islands `viis`) and the code-mapping traps (`seki`/`sequ`/`kica`, `jeff`). Sources that failed those checks are flagged, not hidden. `verified: true` means a real data payload was retrieved in-session; endpoints that only proved their auth wall are marked unverified.

---

## 1. Executive summary

- **The provenance labeling is inverted.** Non-cohort parks are labeled honestly ("Regional estimate — no station identified yet"), but the four cohort parks display authoritative attributions — "NOAA 1991–2020 Normals", "5-yr medians · NPS IRMA", "USGS GNIS + hydrography intersected with NPS boundary" — for data that `park-month-scores.ts` itself documents as hand-authored. No code in the repo reads any of those products. This is the single biggest correctness/trust issue and is fixable with label changes today.
- **Three hard factual errors ship today:** Death Valley's `medianAnnualVisits` (1,190,000 vs the official "more than 1.32 million" for 2025); Acadia's climate-station elevation (144 ft is actually 143.3 **meters** ≈ 470 ft, a units bug); and the entry-fee stat, which renders `entranceFees[0]` — for Acadia that is the $6.00 Cadillac Summit timed-entry reservation, not the $35.00 vehicle fee.
- **The NPS API rate limit is an active operational risk, not a "non-issue".** `fetchParkProfile` and `fetchParkImages` fetch the identical full `/parks` payload twice per park (the `fields` param is ignored by the API), and `npsFetch` silently returns `null` on `OVER_RATE_LIMIT` — so a few rebuilds in an hour bake missing images/fees/alerts into static pages with no warning. The project key was actually exhausted during this audit.
- **The two biggest wins are keyless and small.** NPS IRMA Stats v1 returns real monthly visitation for all 63 parks in **one unauthenticated request** (756 records verified), and the NCEI Access Data Service serves 1991–2020 climate normals with **no token** (63-station batch verified). Together they replace the two largest hand-authored datasets and make the existing UI labels true instead of aspirational.
- **Coverage honesty requires explicit fallbacks, not silence.** Adversarial testing found real edge cases every pipeline must handle: no NWS forecast product for American Samoa, no NPSpecies data for Gateway Arch, no AirNow monitor within 100 mi for 8–9 parks, `SEKI`/`SEQU`/`KICA` split differently across NPS's own systems, and GAAR reporting true zero visitation October–April.

---

## 2. Audit of current sources — claims vs reality

Verdicts: **incorrect** (ships wrong data), **misleading** (true product, false provenance), **improvable** (works, but fragile/wasteful), **correct** (verified end-to-end).

| # | Claim (location) | Verdict | Reality (live-verified) | Fix |
|---|---|---|---|---|
| 1 | `entranceFees[0]` is the park's entry fee (`src/lib/nps.ts` 71–78 → `src/app/parks/[parkCode]/page.tsx` 117) | **incorrect** | Live NPS API: Acadia's `entranceFees[0]` is "Timed Entry Reservation – Location" at $6.00; "Entrance – Private Vehicle" $35.00 is element `[1]`. The park page would show "$6.00" as Acadia's entry fee. yell/deva/zion happen to order the vehicle fee first and grsm has an empty array, but the API guarantees no ordering. | Select the fee titled `Entrance - Private Vehicle` (fallback: lowest-cost `Entrance - *`), or use the `/feespasses` endpoint in the NPS swagger spec. |
| 2 | Death Valley `medianAnnualVisits: 1,190,000` is the "2025 official figure" (`src/lib/data/parks.ts` 43) | **incorrect** | The official NPS release (nps.gov/deva/learn/news/2025-visitation.htm) says DEVA "welcomed more than 1.32 million visitors" in 2025. 1,190,000 is ~10% low and matches no published figure. The other three cohort figures match the official release exactly. | Replace with the exact DEVA 2025 recreation-visits count from IRMA Stats (source #1 below). |
| 3 | Acadia climate station "McFarland Hill" at 144 ft (`src/lib/data/park-month-scores.ts` 28) | **incorrect** | NCEI reports station USC00170100 at elevation **143.3 meters** (~470 ft), confirmed with both `units=standard` and `units=metric`. The "144 ft" is the meters value mislabeled as feet. The other three cohort stations check out. | Set `climateStationElevFt: 470`, or store meters and convert. Add a units sanity check to the future ETL (§5). |
| 4 | WhyDrawer cohort sources: "NOAA 1991–2020 Normals · <station>" and "NPS operating seasons · road status" (`src/components/WhyDrawer.tsx` 107, 114) | **misleading** | The NOAA Normals product is real, but nothing in the repo reads it. The curves are "illustrative, hand-authored" per `park-month-scores.ts` 7–12, shown with default confidence "High". Non-cohort parks are labeled honestly; the overclaim applies only to the cohort. | Relabel "Hand-authored from <station> climatology (pending NOAA Normals pipeline)" / "Hand-authored from published NPS seasonal closure patterns" — or land the real pipeline (source #7) first. |
| 5 | CrowdCalendar cohort label: "5-yr medians · NPS IRMA" (`src/components/CrowdCalendar.tsx` 30) | **misleading** | irma.nps.gov/Stats is real and reachable, but `percentOfAnnual` shares are hand-authored and `parks.ts` stores single-year 2025 totals with comments "5-yr median pending Phase 1". No 5-yr median exists anywhere in the codebase. | Relabel "Hand-authored monthly shares · totals from NPS 2025 release" until the IRMA Stats pull (source #1) exists. |
| 6 | Park-page water section: "USGS GNIS naming + hydrography intersected with NPS boundary" (`page.tsx` 293; `park-detail.ts`) | **misleading** | GNIS is real (USGS, effectively public domain), but no GNIS/NHD data or spatial intersection exists in the repo — the lists are 3 hand-picked features per cohort park; "Fjard" isn't even a GNIS feature class. The label describes an unimplemented method as provenance. | Relabel "Hand-curated — GNIS/NHD boundary intersection planned." |
| 7 | Cohort fixture alerts render under a "No alerts reported" tag (`page.tsx` 211–239) | **misleading** | When `liveAlerts` is empty the header says "No alerts reported", then renders hand-written `detail.alerts` with hardcoded 2026-08-27 timestamps, styled identically to live NPS alerts. | Drop the fixtures, or label "Editorial notes — not live NPS alerts" and remove the fake timestamps. |
| 8 | Footer sources column lists "NOAA 1991–2020 Normals" (`src/components/Footer.tsx` 32–46) | **misleading** | NPS Data API and NWS are genuinely used (verified live); the NOAA line is purely aspirational. Mitigating: the footer's own fine print admits "no live NOAA/NPS accessibility pipeline exists yet". | Mark "(planned)" or drop until the pipeline lands. |
| 9 | `nps.ts` header: "the ~1,000 req/hr limit is a non-issue" (lines 1–7, 40–54) | **misleading** | The limit is real (`x-ratelimit-limit: 1000`, confirmed in docs and headers) but during this audit the key hit `OVER_RATE_LIMIT`. Each build makes ~4 NPS calls × 63 parks; profile+images hit `/parks` twice per park under different cache keys; `npsFetch` returns `null` silently on any `!res.ok`, so builds bake in missing data with no warning. | One `/parks` call per park (or bulk — `parkCode` accepts a comma list); fail the build or log loudly on `OVER_RATE_LIMIT`. |
| 10 | `live-context.ts`: NWS "confirmed against American Samoa & USVI coordinates" (lines 1–7, 12–18, 54) | **misleading** | USVI fully works (SJU gridpoint, verified). American Samoa returns 200 from `/points` but `properties.forecast` is **null** — no gridpoint forecast product exists there. The code survives by accident (`fetch` on URL `"null"` throws, catch returns null). Real coverage: forecasts 62/63; timezone/nearest-city 63/63. `PointsResponse` wrongly types `forecast` as non-nullable. | Type `forecast: string \| null`, skip explicitly when null, soften the comment to "forecasts unavailable for American Samoa (npsa)". |
| 11 | Image rights gate: credit containing "NPS" ⇒ public-domain proxy (`nps.ts` 88–111) | **improvable** | Directionally sound per NPS's own disclaimer; behaves conservatively on Acadia (3/12 pass; "courtesy of" credits correctly excluded). Caveats: bare `includes('nps')` false-positives on mixed credits ("Friends of Acadia / NPS", nps.gov URLs); NPS doesn't guarantee rights metadata; **63-park coverage under this filter is unverified** (the census sweep was blocked by the exhausted rate limit) — partner-heavy parks may render zero images. | Word-boundary match on "NPS Photo"/"NPS/"/"National Park Service"; exclude credits with "courtesy"/"permission"/"©" even when NPS co-occurs; run the 63-park credit census when the rate window resets. |
| 12 | `fields` query param on `/parks` (`nps.ts` 65–68, 105) | **improvable** | Not in the official swagger spec (only `parkCode, stateCode, limit, start, q, sort`); live test confirms the API ignores it and returns the full ~25-key object regardless. Harmless except it doubles `/parks` traffic (see #9). | Drop `fields`; fetch `/parks` once per park and derive profile + images from one response. |
| 13 | "NOAA normals need a separate NCEI token plus per-park station research" (`park-month-scores.ts` 155–165) | **improvable** | Half right. CDO v2 needs a token, but a **keyless** path exists and was verified live: the NCEI Access Data Service returned all 12 monthly TAVG normals for the Acadia station, no token. The genuinely hard half is station-to-park mapping (and the one mapping attempted so far has bug #3). Companion claim that NPS publishes no %-roads-open-by-month dataset is consistent with the API surface. | Note the keyless service in the comment; the Phase 1 blocker is station selection, not tokens. |
| 14 | `official-rankings.ts`: 2025 visitation release figures | **correct** | Fully verified against the official March 13, 2026 release: all 10 park names/ranks/exact counts (GRSM 11,527,939 → Glacier 3,136,557), total 323,014,305, 406 reporting parks, 26 records, 43-day shutdown context. | None. This file is the model for how sourced data should look. |
| 15 | NPS API mechanics: base URL, `/parks` + `/alerts` + `/thingstodo`, `X-Api-Key` header, server-side-only key | **correct** | All live-tested 200 with expected shapes; `/thingstodo` has data even for remote parks (gaar 2, kova 3, wrst 10, isro 41, npsa 9). Nits: `lastIndexedDate` is non-ISO (`2025-01-27 12:37:06.0`, V8 happens to parse it); alert `url` can be `""`. | Defensive date parsing + empty-URL guard. |
| 16 | NWS mechanics: User-Agent only, no key, points→forecast flow, 30-min cache, "Live · National Weather Service" | **correct** | Matches official docs; live tested end-to-end for Acadia. 30-min revalidate is compatible with observed `Cache-Control` (points ~1 day; forecast ~22 min) — points could be cached longer. Sole caveat is #10. | Optional: longer cache for `/points`. |

---

## 3. Catalog of available sources

Grouped by agency. **Verified** = a real data payload was retrieved and adversarially re-tested in-session. Coverage statements include the tricky-park spot-checks (npsa/gaar/viis) and code-mapping traps.

### 3.1 National Park Service

#### NPS Visitor Use Statistics REST API (IRMA Stats v1) — VERIFIED, primary recommendation
- **Access:** `https://irmaservices.nps.gov/Stats/v1/visitation?unitCodes={CODES}&startMonth={M}&startYear={Y}&endMonth={M}&endYear={Y}` · docs at `/stats/v1/help`
- **Auth:** None. No key, no signup.
- **Verified:** Yes, twice (initial + adversarial). One keyless GET with all 63 unit codes for 2024 → HTTP 200, 756 records = 63 units × 12 months, zero missing. YELL 2024-06 `RecreationVisitors=914612` exact-matched on re-test. Systemwide totals (`/Stats/v1/total/2024`) and alias route (`/v3/rest/stats/visitation`) also live. Series runs **1979-01 through the last complete calendar year** (2025-12 present; 2026 returns `[]`).
- **63-park coverage:** All 63, with mapping work: uppercase codes; **SEKI returns `[]`** — Stats splits it into SEQU + KICA (map `seki→SEQU`; ParkAtlas already carries `kica`); JEFF = Gateway Arch. Adversarial checks passed: NPSA (12 records), GAAR (12), VIIS (12). Note GAAR reports **true zeros Oct–Apr** (summer-only reporting) — correct data; the CrowdCalendar UI must not treat 0% as missing.
- **License:** US Government work, public domain per 17 U.S.C. 105 (quote verified verbatim on nps.gov/aboutus/disclaimer.htm); citation appreciated.
- **Gotchas:** XML by default — send `Accept: application/json`. Complete calendar years only, so "last 12 months" queries silently return `[]`. Undocumented rate limits — fetch at build time. The 63 codes live in `src/lib/data/all-parks-mini.ts` (not `parks.ts`, which holds only the 4-park cohort).
- **Powers:** Replaces estimated `percentOfAnnualVisits` (`src/lib/types.ts:45`; consumed by `CrowdCalendar.tsx`, `ParkCard.tsx`, `WhyDrawer.tsx`) with real monthly shares for all 63 parks, and upgrades `medianAnnualVisits` to true 5-yr medians (1979–2025 series available). Fixes audit items #2 and #5 with real data.
- **Effort:** S — one endpoint, one call for all 63 parks.

#### NPSpecies REST API v3 — VERIFIED
- **Access:** `https://irmaservices.nps.gov/NPSpecies/v3/rest/checklist/{UNITCODE}/{CATEGORIES}` (also `/detaillist/`, `/fulllist/`) · docs at `/v3/rest/help`
- **Auth:** None.
- **Verified:** Yes. `checklist/YELL/Mammal` → 68 records; `detaillist/ACAD/Bird` → 364 records with Abundance/Nativeness/TEStatus; comma categories work (`ZION/Mammal,Bird` → 334). `All` is not a valid category (400).
- **63-park coverage:** **62 of 63.** Full 63-code sweep run for Mammal: only JEFF and KICA return 0. Quirks are the **inverse of the Stats API**: SEKI holds the shared Sequoia/Kings Canyon list (74 mammals) while SEQU and KICA return 0 — map both `kica` and `seki` → SEKI. **JEFF (Gateway Arch) has no coverage** (0 for Mammal, Bird, and Vascular Plant) — needs a hand-written fallback. Tricky parks pass: NPSA 11 mammals, GAAR 38, VIIS 16, WRST 47.
- **License:** Public domain per NPS disclaimer; occurrence values are certified park lists; some sensitive-species records withheld by NPS policy.
- **Gotchas:** XML default (data endpoints honor JSON `Accept`; `urlOptions/categories` is **XML-only**). Filter `Occurrence == 'Present'` on **all** endpoints — checklist includes "Probably Present", detaillist includes "Not In Park"/"Unconfirmed" (ACAD: 33 + 116). JSON responses are BOM-free (only XML/error responses carry a BOM); `utf-8-sig` parsing is harmless insurance. No bulk endpoint: ~62 requests per category set.
- **Powers:** Replaces the one-species-per-park placeholder in `src/lib/data/park-wildlife.ts` with certified wildlife lists on 62/63 park pages.
- **Effort:** M — ~62 fetches per category at build time + occurrence filtering + display-species curation.

#### NPS Land Resources Division quarterly acreage report (xlsx) — VERIFIED
- **Access:** `https://www.nps.gov/subjects/lwcf/upload/NPS-Acreage-06-30-2026.xlsx`; index at `nps.gov/subjects/lwcf/acreagereports.htm`
- **Auth:** None.
- **Verified:** Yes (200, valid xlsx, 3 sheets, 447 rows, headers as expected). Yellowstone gross in the 06-30-2026 file: **2,219,790.71 acres**.
- **63-park coverage:** All 63 present after name normalization — but keyed by **abbreviated Area Name, not unit code**. Name traps confirmed: "BLACK CANYON OF GUNNISON" (no NP suffix), "MT RAINIER NP", "T ROOSEVELT NP", "GREAT SMOKY MTS NP", "ROCKY MT NP"; "VIRGIN ISLANDS CORAL REEF" is a separate row (don't substring-match VIIS). Seven AK/CO parks split into park + preserve rows — DENA, GLBA, KATM, LACL, WRST, GRSA, **and GAAR** ("GATES OF ARCTIC N PRES" drops "THE"). NERI is one combined "NP & PRES" row. Tricky parks present: NPSA 8,256.67 gross ac, GAAR 7,523,897.45, VIIS 15,041.03.
- **License:** Public domain per NPS disclaimer.
- **Gotchas:** Filename pattern inconsistent across quarters — scrape the index page, and handle links wrapped in `javascript:HandleLink(...)` (about half of recent quarters). Header labels for columns B/C ("Region"/"State") are swapped relative to the data. "Gross Area Acres" is the headline figure.
- **Powers:** Official acreage for all 63 parks in `parks.ts` (currently cohort-only), quarterly refresh.
- **Effort:** M — parse is trivial; the one-time 63-row name→code map plus an explicit park+preserve summing policy is the real work.

#### IRMA Unit Service v2 (park unit registry) — VERIFIED, with one refuted sub-claim
- **Access:** `https://irmaservices.nps.gov/Unit/v2/api/{unitCode}` · Swagger docs at `/Unit/v2/documentation/unit-api.html`
- **Auth:** None.
- **Verified:** Yes — YELL, NPSA, GAAR, VIIS, NERI all resolve by direct code lookup with FullName/Designation/Region/StateCodes.
- **Coverage honesty — flagged:** Direct per-code lookup covers all 63. But **`/designations/NP` does NOT enumerate the 63-park set**: it returns 62 records, misses New River Gorge entirely (NERI has `UnitDesignationCode: null` and empty `/linked`), and uses IRMA subunit codes (DENG, GAAG, GLBG, GRDG, KATG, LACG, WRSG) instead of park codes for the 7 park-and-preserve combos. Validate ParkAtlas's list by looking up each of the 63 codes directly; use `/{unitcode}/linked` to map logical parks to subunits, special-casing NERI. Bonus: `/states/{state}` returns county-FIPS→unit-code mappings usable for future county-to-park joins.
- **License:** Public domain per NPS disclaimer.
- **Gotchas:** Base path is `/Unit/v2/api` (the landing page's `/v2/rest/unit/...` path returns an HTML shell). XML default.
- **Powers:** Supporting/join source only — authoritative code→name→designation→states mapping to wire Stats, NPSpecies, and acreage to ParkAtlas codes without hand-maintained name tables.
- **Effort:** S — a handful of GETs, cached as a static mapping file.

#### NPS DataStore REST API v8 — VERIFIED, not the acreage fix
- **Access:** `https://irmaservices.nps.gov/datastore/v8/rest/` (QuickSearch, Profile, AdvancedSearch, DownloadFile) · Swagger at `/datastore/v8/documentation/`
- **Auth:** None for public references.
- **Verified:** Yes — ServiceVersion, QuickSearch, Profile→FileDownload (270 KB PDF) all reproduced; per-unit AdvancedSearch is genuinely filtered (NPSA 1,281 refs, GAAR 1,756, VIIS 707; bogus code → 0).
- **Coverage honesty — flagged for the acreage use-case:** The "Listing of Acreage" reference series **stops at CY2017** and holdings are PDFs — superseded by the LWCF xlsx above. Real value is provenance: resolving the `DataStoreReferences` ids that NPSpecies returns into citable documents, and "sources & further reading" links.
- **License:** Public-visibility references public domain; per-reference licenses exist (CC-BY, CC0, "Unlicensed - not for public dissemination") — check `/AccessConstraints`.
- **Gotchas:** Only the OpenAPI spec file carries a UTF-8 BOM; REST responses are BOM-free. `DigitalFiles` can be `[]` with files exposed via Profile `filesAndLinks` instead. Counts live in `pageDetail.totalCount`. v4 routes are dead; use v7/v8.
- **Effort:** S for citation lookups; do not build the acreage pipeline on it.

#### IRMA Stats web app JSON + SSRS reports — VERIFIED, integrate with caution
- **Access:** `https://irma.nps.gov/Stats/Reports/ParkReportItems?id={UNITCODE}` (catalog JSON) + SSRS report viewer.
- **Auth:** None.
- **Verified:** Yes — all 63 unit codes return park-specific catalogs (11–15 reports each; bogus code → 404). This is the **only public surface** with in-year provisional monthly numbers (YELL July 2026: 958,705 provisional recreation visits, rendered live) and pre-1979 annual history.
- **Coverage honesty — flagged:** "Back to 1904" is park-dependent (YELL 1904, VIIS 1957, GAAR 1982, NPSA 2002). "Monthly Public Use" appears under that exact name for 61/63 parks (ARCH names it "Monthly Public Use Report"; GRSM doesn't list it, though it has other current-year reports).
- **Scriptability (corrected by adversarial pass):** The original "not scriptable / headless-only" assessment was refuted — a 3-request curl flow with a cookie jar (report URL → `MvcReportViewer.aspx` iframe → `ExportUrlBase` CSV export) yields clean CSV including July 2026. Still fragile: per-session tokens, generic `Field1..Field37` CSV headers, undocumented. Effort ~S/M scripting, not L.
- **Recommendation:** Finalized numbers should come from Stats v1. Use this only if ParkAtlas later wants current-year provisional visitation, and treat the scraper as best-effort with a validation gate.

### 3.2 NOAA / NCEI

#### NCEI Access Data Service — U.S. Monthly Climate Normals 1991–2020 — VERIFIED, primary recommendation
- **Access:** `https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations={IDS}&dataTypes=MLY-TMAX-NORMAL,MLY-TMIN-NORMAL,MLY-TAVG-NORMAL,MLY-PRCP-NORMAL,MLY-SNOW-NORMAL&format=json&units=standard`
- **Auth:** **None** — no token, contradicting the repo comment (audit #13).
- **Verified:** Yes, twice. 12 monthly rows exact-matched on re-test (Yellowstone Mammoth: Jan TMAX 31.4 °F, Jul TMAX 80.8 °F); multi-station batching verified up to **63 stations in one request** (63/63 returned).
- **63-park coverage (station join, run end-to-end in-session):** All 63 reachable, but 12 parks' *nearest* stations are precip/snow-only (CoCoRaHS/SNOTEL/VI) — nearest-station-**with-TMAX** fallback resolves all 12 (badl, cong, cuva, gaar, glac, grba, kova, lacl, olym, romo, viis, wrst). Median park-station distance 8.8 km; AK outliers kova 156 km, gaar 123 km (Bettles AP, at the park's southern edge — interior Brooks Range values are extrapolation), wrst 71 km, lacl 63 km. Tricky parks: NPSA served by Pago Pago AP (~5 km from the Tutuila unit; the Ta'u/Ofu units ~100 km east have **no** normals station — the only temperature station in the territory); VIIS's four nearest stations are all precip-only, fallback is Charlotte Amalie AP (~25 km, St. Thomas). NCEI's own metadata warns applicability degrades with distance from station — carry that caveat into confidence levels.
- **License:** US Government work; cite as Palecki et al. (2021), doi:10.25921/wck8-er13; no-warranty liability (record gov.noaa.ncdc:C01620, verified).
- **Gotchas:** JSON values are whitespace-padded strings (`"    21.7"`) — trim before `parseFloat`. Some fallback stations lack `MLY-SNOW-NORMAL` and missing values arrive as **empty fields, not "0.00"** — the ETL needs an explicit missing-SNOW rule (imputing 0 is defensible for tropical parks but must be deliberate). `units=standard` = °F/inches. Static decadal product (v1.0.1, corrected Apr 2023; next normals ~2031).
- **Powers:** Replaces the hand-authored 12-month `climate` arrays and `climateStation`/`climateStationElevFt` in `park-month-scores.ts` with real normals for all 63 parks; makes `types.ts:41` ("NOAA normals derived") and the WhyDrawer/footer NOAA labels true.
- **Effort:** S for the ETL (~2 HTTP requests for all 63 parks). **The station-to-park mapping is the real task — see roadmap.**

#### NCEI Monthly Normals bulk files (per-station CSVs + tar + inventory) — VERIFIED alternative
- **Access:** `https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/{STATION}.csv`; inventory at `doc/inventory_30yr.txt` (15,615 stations incl. AS/PR/VI/AK/HI); 30 MB multivariate tar available.
- **Auth:** None. **Verified:** Yes, including tricky-park station CSVs.
- **Key correction from adversarial pass:** Column count **varies per station (81–413 observed)**; 413 is the full-variable layout only. Parse each CSV by its own header — and a header check for `MLY-TAVG-NORMAL` is a cheap precip-only-station detector. The fixed-width inventory does not say which variables a station carries (the "temp trap": a naive nearest join silently returns precip-only data for VIIS).
- **Powers:** Offline path for the same climate ETL, plus richer fields (percentiles, std devs, completeness flags) that could drive ParkAtlas confidence levels (`ParkCurve.confidenceOverride`).
- **Effort:** S/M.

#### NOAA Climate Data Online (CDO) API v2 — UNVERIFIED, not recommended
- **Auth:** Free token required (`token` header); none exists in `.env.local`. Endpoint confirmed live only to its auth wall (400 "Token parameter is required").
- **Why skip:** Adds a key, 5 req/sec + 10,000 req/day limits, 1,000-record pagination — and per its own docs serves the **older 1981–2010** normals generation. The keyless Access Data Service is strictly better for this project.

*(The NWS API, already integrated, is audited in §2 items #10/#16: verified, keyless, forecasts 62/63 — no forecast product for American Samoa.)*

### 3.3 EPA

#### AirNow API — UNVERIFIED (auth wall only), **fails the tricky-parks test**
- **Access:** `https://www.airnowapi.org/aq/observation/latLong/current/?...&API_KEY=...` · docs at docs.airnowapi.org/webservices
- **Auth:** Free self-serve key; none in `.env.local`. Live endpoint returned 401 with a placeholder key — behavior confirmed, **no real data retrieved**.
- **Coverage — flagged:** NOT 63/63. Computed empirically against AirNow's own reporting-area file vs the repo's 63 centroids: within 50 mi for **49/63**, within 100 mi for **54/63**. No realistic coverage for npsa (nearest 2,520 mi), kova (368), katm (258), gaar (255), wrst (236), drto (120), lacl (119), dena (129). The `distance` param finds the nearest *reporting area*, which can be a town 90 mi away — display the ReportingArea name for honesty.
- **License/caveats:** US government work; data explicitly "preliminary and subject to change", intended for AQI reporting. Hourly per-key rate limits, non-raisable. Observations hourly; forecasts daily — cache accordingly.
- **Would power:** Live AQI chip in the live-conditions area (`live-context.ts`) on ~54 park pages + smoke-season input to Month Fit — **only with an explicit "no monitor nearby" state for the other parks.** Effort S once keyed.

### 3.4 NASA

#### FIRMS area API — UNVERIFIED (auth wall only)
- **Access:** `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/{bbox}/{days}` · free instant email key, 5,000 transactions/10 min.
- **Auth wall confirmed** (400 "Invalid MAP_KEY."); no key in `.env.local`, so no data retrieved.
- **Coverage:** Global — the **only satellite fire feed in this family that covers American Samoa**; the two public keyless region CSVs cover the other 62. NRT ~3 h latency. Larger date ranges count as multiple transactions.
- **Would power:** Per-park bbox active-fire detections for a fire-conditions module. Effort S once keyed.

### 3.5 USDA Forest Service / Recreation.gov

#### RIDB REST API v1 — UNVERIFIED (auth wall only); underlying database verified via export
- **Access:** `https://ridb.recreation.gov/api/v1/{facilities,recareas,campsites,permitentrances,tours,...}` · docs at ridb.recreation.gov/docs
- **Auth:** Free key via Recreation.gov account ("Enable Developer Access"), sent as `apikey` header. **The NPS api.nps.gov key does not work (tested: 401).** All 10 real routes return 401 vs 404 for fake paths — routes exist behind auth; no payload retrieved, hence unverified.
- **Coverage:** The full RIDB export (which *was* verified) contains all 63 parks as RecAreas, with mapping quirks: Sequoia + Kings Canyon share RecArea 2931; Redwood = 2901 ("National and State Parks"); American Samoa = 2847. Needs a hand-built 63-row parkCode→RecAreaID map.
- **License:** CC-BY 4.0 per the data.gov catalog record (note: attribution required — different from the public-domain NPS/NOAA sources; the developer agreement's confidentiality clause covers the key itself).
- **Would power:** Campgrounds, permit entrances, tours, addresses, media per park. Prefer the keyless nightly bulk export for bulk needs; the API is for incremental queries. Effort S once keyed.

---

## 4. Integration roadmap

Prioritized by (impact on the honesty of claims ParkAtlas already makes) × (effort). P0 items make existing claims true or stop them being false; P1 items replace hand-authored data with the real datasets the UI already cites; P2 items are new capabilities.

### P0 — Correctness and honesty fixes (no new data sources; hours, not days)

| Item | Files | Why P0 |
|---|---|---|
| Fix entry-fee selection (title-match `Entrance - Private Vehicle`, fallback lowest `Entrance - *`) | `src/lib/nps.ts` | Ships a wrong price today (audit #1) |
| Correct DEVA visits (exact 2025 figure from IRMA) and Acadia station elevation (470 ft) | `parks.ts`, `park-month-scores.ts` | Hard factual errors (#2, #3) |
| Relabel all overclaiming provenance strings: WhyDrawer cohort sources, CrowdCalendar "5-yr medians · NPS IRMA", water-section GNIS/NHD, footer NOAA line → "hand-authored / planned" phrasing | `WhyDrawer.tsx`, `CrowdCalendar.tsx`, `page.tsx`, `Footer.tsx` | Biggest trust issue (#4–#6, #8); pure string changes |
| Fixture alerts: drop or relabel "Editorial notes — not live NPS alerts", remove fake timestamps | `page.tsx`, `park-detail.ts` | #7 |
| NPS API hygiene: drop `fields` param, one `/parks` call per park (or bulk comma-list), fail loudly on `OVER_RATE_LIMIT` | `nps.ts` | Halves quota use; ends silent data loss (#9, #12) |
| NWS: type `forecast: string \| null`, explicit skip for npsa, fix the coverage comment | `live-context.ts` | #10 |
| Tighten image-rights matcher (word boundaries; exclude courtesy/permission/©) | `nps.ts` | #11 |

### P1 — Replace hand-authored data with the verified keyless sources (makes the P0 relabels upgradeable back to real attributions)

1. **IRMA Stats v1 visitation ETL (effort S).** Build-time script: one request, all 63 codes (sourced from `all-parks-mini.ts`, uppercased, `seki→SEQU`), pull 2021–2025, emit committed JSON with per-park monthly shares + 5-yr median annual visits. Handle GAAR's true winter zeros as data, not gaps. Then — and only then — restore the "5-yr medians · NPS IRMA" label.
2. **NCEI normals ETL (effort S for fetch; the mapping is the work).**
   **Explicit data-engineering task: station-to-park mapping.** Deliverable: a committed `park-stations.json` (parkCode → station id, name, distance km, elevation m, variables present), built by: nearest-station join on the inventory → header/API check for `MLY-TAVG-NORMAL` → fall back to nearest-with-temp for the 12 known precip-only cases → distance and elevation sanity gates → small manual override table (AK outliers, NPSA Tutuila-only caveat, VIIS Charlotte Amalie). This mapping is where the 144-ft bug class lives; it gets its own review.
   Then a 1–2-request batch fetch emits normals JSON; per-park confidence derived from station distance + completeness flags feeds `confidenceOverride`.
3. **LWCF acreage ETL (effort M).** **Explicit data-engineering task: name→parkCode mapping (~63 rows)** with the abbreviation traps and a written park+preserve summing policy covering all seven split parks including GAAR. Scrape the index page (handle `HandleLink` wrappers) rather than constructing filenames.
4. **Unit Service v2 mapping file (effort S).** Fetch all 63 codes directly (not `/designations/NP` — it misses NERI and uses subunit codes); commit as the canonical crosswalk that the Stats/NPSpecies/acreage ETLs consume.

### P2 — New capabilities (keyed sources, new features, honest gaps)

- **NPSpecies wildlife lists (M):** 62/63 parks; hand-written Gateway Arch fallback required; `Occurrence == 'Present'` filter everywhere.
- **AirNow AQI (S once keyed):** ship only with the "no monitor within N mi" state for the ~9 uncovered parks and the ReportingArea name displayed. Verify with a real key before wiring UI — currently unverified.
- **NASA FIRMS (S once keyed):** public CSVs for 62 parks; keyed area API solely to cover npsa. Unverified until a key exists.
- **RIDB campgrounds/permits (S once keyed):** prefer the keyless nightly export; note CC-BY attribution requirement. Build the 63-row RecAreaID map as a one-time task.
- **DataStore citations (S, optional):** resolve NPSpecies `DataStoreReferences` into "further reading" links.
- **Deprioritized/skip:** CDO v2 (worse vintage, keyed, superseded); SSRS current-year scraping (the curl flow works but is session-token fragile — only if provisional in-year visitation becomes a product requirement, and behind a validation gate); DataStore as an acreage source (series dead since 2017).

---

## 5. Data-engineering practices

**Pipeline shape: build-time probe scripts → committed JSON, not live fetch — for every P1 source.** ParkAtlas already has the right pattern (`image-dims.json`): a script hits the source, validates, and commits derived JSON that the app imports. IRMA Stats, NCEI normals, acreage, NPSpecies, and the Unit crosswalk are all static-or-slow datasets with undocumented rate limits; committing snapshots makes builds deterministic, reviewable in diffs, and immune to upstream outages. Reserve live fetch (with `revalidate`) for genuinely live data: NWS forecasts, NPS alerts, and later AirNow/FIRMS — each with an explicit cached-fallback and a rendered "as of" timestamp.

**Versioning and provenance.** Keep the "Month Fit v1.0 · calculated <date>" convention and extend it to every committed dataset: each JSON snapshot carries `{ sourceUrl, datasetVersion, fetchedAt, script, recordCount }` in a header block, and UI source labels are derived from that metadata — a label like "NOAA 1991–2020 Normals" should be *impossible to render* unless the normals snapshot file exists. Normals are decadal (pin v1.0.1, doi:10.25921/wck8-er13, next refresh ~2031); acreage is quarterly; IRMA Stats is annual (complete calendar years only); NPSpecies is snapshot-on-demand.

**Validation checks per dataset (run in the probe script; fail the build on violation):**
- **Row counts vs 63.** IRMA Stats: exactly 63 units × 12 months after the `seki→SEQU` merge. Acreage: all 63 names resolve, zero unmatched. Normals: 63 stations return, each with 12 months of TMAX. NPSpecies: expect exactly JEFF (and KICA pre-merge) empty — any *new* empty park is an error, not a silent gap.
- **Unit sanity.** Elevations cross-checked against the inventory in meters and converted once, in one place (the 144-ft bug is the canonical test case). Temperatures within physical bounds; monthly visitation shares sum to 100% ± 0.5 per park; fees parsed as positive dollars; whitespace-padded NCEI strings trimmed before parse; empty-string vs zero distinguished (missing SNOW ≠ 0.00 unless the tropical-park rule applies deliberately).
- **Tricky-park regression suite.** Every dataset's validator asserts known edge behavior: npsa (one temp station, no NWS forecast, no AirNow), gaar (true winter zeros, 123 km station distance flagged low-confidence), viis (precip-only nearest stations), jeff (no NPSpecies), seki/sequ/kica (opposite splits in Stats vs NPSpecies), NERI (null designation in Unit Service). A source that fails these tests ships with an honest per-park fallback state, never a silently blank or fabricated value.
- **Missing-park handling.** Every consumer type carries an explicit `null`/absent state, and the UI renders the honest label ("No monitor within 100 mi", "Forecast unavailable for this park") — the pattern the non-cohort labels already get right today.
- **Rate-limit discipline.** NPS Data API calls budgeted per build (~63 with the P0 dedupe), logged with remaining-quota headers, and `OVER_RATE_LIMIT` fails the build loudly. Keyless IRMA/NCEI endpoints get polite single-batch requests and never per-page-request fetches.

**The governing rule, learned from this audit:** a source label describes an implemented pipeline, verified against the three hardest parks — or it says "planned".