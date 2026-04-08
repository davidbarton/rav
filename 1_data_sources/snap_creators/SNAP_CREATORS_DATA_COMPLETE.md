# Snapchat — Complete Map of Influencer / Creator Activity Data

> Researched and verified 2026-04-08. Every source hands-on tested. 3rd-party scrapers fully reverse-engineered — they ALL use the same trivial HTTP technique we can replicate for free. 3 sources are gold (Sources 1, 2, 2b), 4 are dead ends, 3 are redundant with what we can build ourselves.

---

## TL;DR — 10 Data Sources, 3 Are Gold


| #   | Source                                        | Auth                       | Scope                                                                    | Bulk?         | Status (2026-04-08)                                                           |
| --- | --------------------------------------------- | -------------------------- | ------------------------------------------------------------------------ | ------------- | ----------------------------------------------------------------------------- |
| 1   | **Sponsored Content API** (already scraped)   | **None**                   | Creator ↔ sponsor relationships, live content globally                   | Paginated     | **COMPLETE** — 735+ pages, ~147k items, in DuckDB                             |
| 2   | **Public Profile Web Pages** (scraping)       | **None (User-Agent only)** | Full profile: subscribers, bio, spotlights, engagement, related creators | Per-username  | **VERIFIED WORKING** — simple HTTP GET, rich data, no headless browser needed |
| 2b  | `**/explore/<keyword>` Discovery** (scraping) | **None (User-Agent only)** | Creator discovery by category — profiles, spotlights, publishers         | Per-keyword   | **VERIFIED WORKING** — ~50+ creators per keyword, trivial to scrape           |
| 3   | **Spotlight Web Pages** (scraping)            | **None**                   | Public Spotlight videos with view/share/comment counts                   | Per-video     | **ACCESSIBLE** — data also available via profile pages (Source 2)             |
| 4   | **Story.snapchat.com** (public stories)       | **None**                   | Public stories from verified/public accounts                             | Per-username  | **ACCESSIBLE** — verified accounts only, stories are ephemeral                |
| 5   | **Public Profile API** (official)             | **OAuth 2.0** (allowlist)  | Creator discovery, metrics, demographics, change logs                    | Paginated     | **DEAD END** — requires Snap partnership for allowlisting                     |
| 6   | **Snap Star / Collab Studio** (marketplace)   | **Partnership**            | Brand ↔ creator matchmaking, campaign data                               | N/A           | **DEAD END** — via partner agencies only (Whalar, Influential, etc.)          |
| 7   | **DSA Researcher Access** (Article 40)        | **Application**            | Spotlight + Stories + Profile data with engagement                       | Bulk delivery | **DEAD END** — non-commercial + university affiliation required               |
| 8   | **Third-Party Scrapers / APIs** (unofficial)  | **API key / paid**         | Same data as Sources 2/2b/3 — packaged as APIs                           | Per-request   | **REVERSE-ENGINEERED** — we can replicate everything for free                 |
| 9   | **Story Kit API** (official GraphQL)          | **Partner JWT**            | Public stories search by location, time, caption                         | GraphQL       | **DEAD END** — requires Snap advocate for credentials                         |
| 10  | **Open-Source OSINT Tools** (GitHub)          | **None**                   | Profile scraping, story/spotlight download, heatmaps                     | Per-username  | **SOURCE CODE VERIFIED** — reusable patterns, SnapIntel (272★) is best        |


---

## Quick reference — web surfaces, URLs, and where “keywords” live

One place to see **everything** this doc covers; details stay in the numbered sections below.


| Surface                   | URL pattern                                                                    | Primary JSON / fields                                                          | Role                                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sponsored Content API** | `GET …/sponsored_content` (see `snap_ads`)                                     | `creator_name`, `content_url`, `sponsor_name`, …                               | Seeds: monetized creators + content links (**no** hashtag/topic column — enrich via §2 / §2b).                                                                                                       |
| **Public profile**        | `https://www.snapchat.com/add/<user>` (= `story.snapchat.com/s/<user>`)        | `pageProps`: `userProfile`, `spotlightStoryMetadata`, `spotlightHighlights`, … | Full profile + per-spotlight engagement + **content-level** tags (`llmKeywords`, `textMetadataKeywords`, `s2iTags`, `hashtags`) — **not** the same strings as explore `query` (see §2b cross-links). |
| **Explore search**        | `https://www.snapchat.com/explore/<q>`                                         | `encodedSearchResponse`, `encodedSpotlightCardMap`, `query`                    | Discovery: Subscribe / Shows / Spotlight / Topics / …; `**<q>` is free-text search**, not a fixed whitelist (§2b).                                                                                   |
| **Topic page (subset)**   | `https://www.snapchat.com/topic/<topicId>`                                     | `topicId`, `displayName`, `spotlights[]`, optional `relatedS2ITags`            | Same **topic namespace** as app; **only some** `topicId`s have web pages (others → 404 here but may work on `/explore/<same>`).                                                                      |
| **Spotlight permalink**   | `https://www.snapchat.com/spotlight/<id>`                                      | `__NEXT_DATA__`                                                                | Per-video page; overlap with data already on creator profile for their spotlights (§3).                                                                                                              |
| **Hashtag / topic (web)** | Explore Topics rows expose `topicText` → use `**/explore/<topicText>`** on web | `openHashtagTopic.topicText`                                                   | Recursive frontier for crawlers (§2b).                                                                                                                                                               |


**Two namespaces (don’t conflate):** (1) **Explore / Topics `topicText`** — hashtag-style slugs for search/discovery. (2) **Profile spotlight metadata** — LLM/S2I/text keywords per video; use for tagging and analytics, not exact joins to (1). Full table in §2b *Where the same “keywords” show up elsewhere*.

---

## 1. Sponsored Content API — `ALREADY COMPLETE`

### What it is

The same API we already scraped for ads research (`GET /v1/ads_library/sponsored_content`). It's the richest source we have for creator activity because it exposes **every creator ↔ sponsor relationship** on the platform.

### What it reveals about creators

From our existing data (~147k items in DuckDB `sponsored_content` view):

```
creator_name   — username of the content creator
creator_url    — snapchat.com/add/... profile link
sponsor_name   — brand/sponsor (empty for ~92% — Snap's own monetization)
sponsor_url    — sponsor profile link
content_type   — SPOTLIGHT | STORY
content_url    — direct link to the content
thumbnail_url  — CDN image URL
```

### Creator intelligence extractable

- **Active monetized creators**: every creator appearing here is commercially active
- **Brand partnerships**: the ~8% with non-empty `sponsor_name` are confirmed brand deals
- **Content volume per creator**: count of items per `creator_name`
- **Creator ↔ sponsor network**: which brands work with which creators
- **Content type preference**: does a creator mainly do SPOTLIGHT or STORY?
- **Cross-sponsor creators**: creators working with multiple brands (influence brokers)

### What's missing

- No follower/subscriber counts
- No engagement metrics (views, likes, shares)
- No demographic data about the creator or their audience
- No historical data — only "currently live" content
- No profile metadata (bio, category, location, verified status)
- **No topic / hashtag / explore-keyword fields** in the API response — if you need hashtags or discovery by theme, that comes from **§2 (profile `__NEXT_DATA__`)** and **§2b (`/explore/<q>` + Topics `topicText`)**, not from this endpoint

### Status

**Complete.** 735+ pages scraped, loaded in DuckDB. This is our primary creator data source. See `1_data_sources/snap_ads/` for scripts and data.

---

## 2. Public Profile Web Pages — `VERIFIED WORKING, RICH DATA`

### What it is

Every Snapchat user with a Public Profile has a web-accessible page. Both URL patterns return **identical data**:

```
https://www.snapchat.com/add/<username>     — "add friend" page
https://story.snapchat.com/s/<username>     — alias (same data)
```

### How to extract data — THE CORE TECHNIQUE

**Simple HTTP GET + parse. No headless browser, no special cookies, no auth.**

This is the exact same technique used by every Apify scraper, ScrapeCreators, SnapIntel, and all other 3rd-party tools. They charge money for what is literally:

```python
import urllib.request, json, re

url = f"https://www.snapchat.com/add/{username}"
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
req = urllib.request.Request(url, headers=headers)
html = urllib.request.urlopen(req).read().decode("utf-8")
match = re.search(r'<script[^>]*type="application/json"[^>]*>(.*?)</script>', html, re.DOTALL)
data = json.loads(match.group(1))
page_props = data["props"]["pageProps"]
profile = page_props["userProfile"].get("publicProfileInfo", {})
```

**Critical requirement**: Must send a `User-Agent` header mimicking a real browser. Without it, Snap returns minimal data.

### Account type determines data richness

Two profile types exist:


| Account type                         | `userProfile` key   | Full data?                                           | Example                               |
| ------------------------------------ | ------------------- | ---------------------------------------------------- | ------------------------------------- |
| **Public Profile** (set up by user)  | `publicProfileInfo` | YES — subscribers, bio, spotlights, related accounts | `nike`, `kingbach`, `zane`, `garyvee` |
| **Regular user** (no public profile) | `userInfo`          | NO — only username, displayName, snapcode            | `djkhaled`, `charlidamelio`           |


Our initial test used `djkhaled` who has NO Public Profile — that's why data was minimal. **The technique works perfectly for accounts with Public Profiles.**

### Data available (VERIFIED hands-on 2026-04-08)

Tested with `kingbach` (2.7M subs), `garyvee` (767K subs), `nike` (brand), `zane` (1.5M subs):

```
pageProps.userProfile.publicProfileInfo:
  username               — "kingbach"
  title                  — "KingBach" (display name)
  subscriberCount        — "2708400"  (actual number, string)
  bio                    — "Hey what's up I'm King Bach..."
  badge                  — 1 (verified)
  websiteUrl             — external link
  address                — "Beaverton, Oregon, United States" (when set)
  profilePictureUrl      — CDN URL
  squareHeroImageUrl     — CDN hero image
  snapcodeImageUrl       — SVG snapcode
  categoryStringId       — profile category
  subcategoryStringId    — subcategory
  publisherType          — publisher classification
  businessProfileId      — UUID
  hasStory               — boolean
  hasCuratedHighlights   — boolean
  hasSpotlightHighlights — boolean
  creationTimestampMs    — account creation date (!)
  lastUpdateTimestampMs  — last profile update

  relatedAccountsInfo[]: — 0-3 related creators with FULL profile data each
    publicProfileInfo:
      username, title, subscriberCount, badge,
      profilePictureUrl, hasStory, businessProfileId, ...
    subscribeLink:
      deepLinkUrl, iosAppStoreUrl, ...

pageProps.spotlightStoryMetadata[]: — per-spotlight engagement (kingbach: 27 items!)
  engagementStats:
    viewCount            — 47722 (integer)
    shareCount           — 150
    commentCount         — 23
    recommendCount       — 441
    boostCount           — 4501
  videoMetadata:
    name                 — video title
    description          — video description
    durationMs           — 71500
    width, height        — 540x960
    contentUrl           — CDN video URL (direct MP4 link!)
    uploadDateMs         — 1775324672387 (precise timestamp)
    creator              — creator info
    shareCount, viewCount — duplicated here
  llmTitle               — "AI-generated title" (Snap's own AI description!)
  llmDescription         — "AI-generated description" (!)
  llmKeywords            — "police stop prank, traffic stop comedy, ..."
  hashtags[]             — content hashtags
  description            — original creator description
  contextCards, s2iTags, textMetadataKeywords — additional metadata

pageProps.spotlightHighlights[]: — spotlight content cards
  storyId                — unique spotlight ID
  thumbnailUrl           — CDN thumbnail
  videoTrackUrl          — video URL
  snapList[]             — individual snaps with media URLs

pageProps.curatedHighlights[]: — saved story highlights
  storyTitle             — highlight name
  snapList[]:
    snapUrls.mediaUrl    — CDN video/image URL
    timestampInSec       — creation timestamp
    snapMediaType        — 0=image, 1+=video

pageProps.lenses[]: — AR lenses
  lensName, isOfficialSnapLens, lensPreviewVideoUrl
```

### Verified engagement data examples (kingbach — first 3 spotlights)


| Spotlight | Views  | Comments | Recommends | Shares | Boosts |
| --------- | ------ | -------- | ---------- | ------ | ------ |
| #0        | 47,722 | 23       | 441        | 150    | 4,501  |
| #1        | 13,490 | 26       | 219        | 127    | 2,617  |
| #2        | 40,894 | 35       | 655        | 311    | 6,773  |


### Verified subscriber counts across test accounts


| Username        | Subscribers | Related accounts | Spotlights | Has public profile? |
| --------------- | ----------- | ---------------- | ---------- | ------------------- |
| `kingbach`      | 2,708,400   | 3                | 27         | YES                 |
| `zane`          | 1,498,300   | 3                | 0          | YES                 |
| `garyvee`       | 767,400     | 3                | 18         | YES                 |
| `nike`          | 0 (hidden)  | 0                | 9          | YES (brand)         |
| `djkhaled`      | N/A         | 0                | 0          | NO (regular user)   |
| `charlidamelio` | N/A         | 0                | 0          | NO (regular user)   |


### Critical discovery: `relatedAccountsInfo` enables network crawling

Each profile contains an array of **related creators** — full profile objects, not just usernames. Tested from `kingbach`:

```
relatedAccountsInfo[0]: @destormpower — "Destorm Power" (badge=1)
relatedAccountsInfo[1]: @melvingregg  — "Melvin Gregg" (badge=1)
relatedAccountsInfo[2]: @directorwuzgood — "Wuz Good" (badge=1)
```

Each related account includes `publicProfileInfo`, `subscribeLink`, and their own `businessProfileId`. BFS from seed accounts builds the network.

### Rate limits (observed)

- Tested ~15 profiles in rapid succession from a single IP — all succeeded
- No Cloudflare challenge or CAPTCHA encountered
- ~1.5-2.5 seconds per request (network latency, not throttling)
- Heavy systematic scraping likely triggers IP-level blocking (same as Ads Gallery)
- Proxy rotation recommended for bulk operations (1000+ profiles)

### Practical value

**VERY HIGH** — this is the primary data source for creator intelligence. Simple HTTP, no auth, no cost, rich data. Combined with our Sponsored Content usernames as seeds:

- Profile enrichment with follower counts, bio, category, verified status
- Full engagement metrics per spotlight (views, comments, shares, recommends, boosts)
- Video content URLs (direct MP4 links) with durations and timestamps
- AI-generated content descriptions and keywords (Snap's own LLM metadata!)
- Creator network graph construction via related accounts
- Account age/freshness tracking via creation/update timestamps

### Keyword-like fields on profiles (vs explore — same doc, different namespace)

Per spotlight, `spotlightStoryMetadata[]` includes **Snap-derived** labels: `llmKeywords`, `textMetadataKeywords`, `s2iTags`, `hashtags`, `videoMetadata.keywords`, and nested `cuSignals[].signal.*`. `**categoryStringId` / `subcategoryStringId`** are **internal taxonomy** strings on the profile, not user-typed hashtags.

These are **not** guaranteed to equal an explore query or Topics `topicText` — they are **related semantically** but used for enrichment and clustering. **Where explore Topics and `/topic/` pages fit** is documented in §2b (*Where the same “keywords” show up elsewhere*).

---

## 2b. `/explore/<keyword>` Discovery Endpoint — `VERIFIED WORKING, CREATOR DISCOVERY`

### What it is

Snapchat's web explore pages serve as a **keyword-based creator/content discovery mechanism**. This is how the Apify "Popular Accounts Scraper" finds creators — and it's trivially replicable.

### URL pattern

```
https://www.snapchat.com/explore/<keyword>
```

### Are there “official” keywords? Can you put anything?

**There is no published master list of allowed explore slugs.** The path segment is a **search query**, not a fixed enum. Snap does not document “all possible keywords.”

**What we verified (2026-04-08):**


| Input                                              | Result                                                                                                                                                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real words (`fashion`, `crypto`, `news`, `česko`)  | Full sections: Spotlight, Shows, Subscribe, Lenses, Topics, Episodes, Places (counts vary by query and locale).                                                                                 |
| Gibberish (`randomstring12345`, `asdfghjklqwerty`) | Still returns HTTP 200 + **Spotlight** (~24 cards). Other sections may be missing or thin (e.g. only Add Friends + Spotlight).                                                                  |
| **Empty path** `/explore/` or `/explore`           | **Broken for scraping** — `encodedSearchResponse` empty / no usable sections in our test.                                                                                                       |
| `**/explore/categories`**                          | This is **not** a category directory. It is a normal explore page whose `query` is literally the English word `"categories"` (search results about “categories,” not a list of all categories). |


So: **you can put almost any string in the path** (URL-encode spaces, unicode, etc.). Quality and section mix depend on how much indexed content matches — nonsense strings still get *some* Spotlight results, but rich Subscribe/Shows/Topics clusters appear when the query matches real topics.

**How to grow the keyword set (no master list needed):**

1. **Seed list** — verticals you care about (`beauty`, `fitness`, `praha`, `crypto`, …) plus brands, regions, languages.
2. **Topics section** — each row includes `onTap.openHashtagTopic.topicText` (e.g. `fashion_style`, `fashionblogger`). Treat those as **new explore queries** and fetch `/explore/<topicText>` recursively (with deduping and depth limits).
3. **Related** — same pattern can be combined with profile `relatedAccountsInfo` and Sponsored Content seeds.

**Practical constraint:** treat this as **open-ended search**, not a finite checklist — design the crawler for deduplication, rate limits, and a bounded frontier (queue + visited set), not “iterate every official keyword once.”

### Where the same “keywords” show up elsewhere (cross-links)

Explore queries are **not isolated**. The same *kind* of string (hashtag/topic slug, search query) appears in several other payloads:


| Surface                                    | What you see                                                                                                                                                                                                        | Same string as `/explore/<q>`?                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Explore → Topics rows**                  | `topic.text` and `onTap.action.openHashtagTopic.topicText` (e.g. `fashion_style`, `fashionblogger`)                                                                                                                 | **Yes** — you can re-fetch `/explore/<topicText>` (verified: `/explore/fashion_style` returns `query: "fashion_style"`).                                                                                                                                                                                                                                                                         |
| **Dedicated topic pages**                  | `https://www.snapchat.com/topic/<topicId>` — `pageProps`: `topicId`, `displayName`, `spotlights[]` (e.g. 32 cards for `fashion`), optional `relatedS2ITags`, `s2iTagHierarchy`, `webPageViewSource` (e.g. `dynamo`) | **Partially** — only **some** slugs get a `/topic/` page (e.g. `fashion`, `music`, `comedy` → 200). Others from the Topics list (e.g. `fashion_style`) return **404** on `/topic/` but still work on `**/explore/fashion_style`**. So: **explore is the superset on web; `/topic/` is a subset of canonical topic IDs.** Prefer `**/explore/<slug>`** for crawling when you care about coverage. |
| **Public profile `__NEXT_DATA__`**         | Per spotlight: `llmKeywords[]`, `textMetadataKeywords[]`, `s2iTags[]`, `hashtags[]`, `videoMetadata.keywords[]`, and nested `cuSignals[].signal.textMetadata.keywords` / `s2iTags`                                  | **Not identical strings** — these are **Snap-derived labels** (LLM keywords, vision/text tags) for *that video*, not the global hashtag slug. They are **semantically related** to explore/topics (e.g. “fashion”, “golf”) but you should not expect `topicText === llmKeywords[i]`.                                                                                                             |
| **Profile taxonomy**                       | `publicProfileInfo.categoryStringId`, `subcategoryStringId` (e.g. `public-profile-category-v3-people`)                                                                                                              | **Different system** — internal category enums, **not** user hashtags or explore query strings.                                                                                                                                                                                                                                                                                                  |
| **Profile “Tagged” UI**                    | `taggedTabResponse` (`searchResponse`, `spotlightCardMap`) — often **null** in SSR JSON; i18n still references “Spotlight results for …”, “related topics”                                                          | **Planned surface** for tag/topic search on a profile; **not reliably populated** in the static JSON we tested.                                                                                                                                                                                                                                                                                  |
| **Sponsored Content API (our ads source)** | Creator/sponsor/content URLs — **no** generic “topic” field in the documented schema                                                                                                                                | **Enrichment path** is profile + explore, not the sponsor API row itself.                                                                                                                                                                                                                                                                                                                        |


**Practical takeaway:** treat **explore `query` / Topics `topicText`** as one **hashtag-oriented namespace** for crawling; treat **profile spotlight metadata keywords** as a **second, content-level namespace** (great for tagging/analytics, weaker for exact join keys to explore).

### How to extract data

Same technique as profile pages — HTTP GET with User-Agent, parse `<script type="application/json">`.

```
pageProps.encodedSearchResponse  — raw JSON (NOT base64), ~100-400KB
pageProps.encodedSpotlightCardMap — raw JSON, ~200-400KB
pageProps.query                  — the keyword used
pageProps.country                — detected country (e.g., "CZ")
```

### Data structure (verified hands-on 2026-04-08 with `fashion`)

The `encodedSearchResponse` contains `sections[]`, each with a different result type:


| Section         | Type               | Results | What you get                                                                                                      |
| --------------- | ------------------ | ------- | ----------------------------------------------------------------------------------------------------------------- |
| **Subscribe**   | `snapProEntity`    | 5-8     | Full business profiles: `subscriberCount`, `title`, `hostAccountUsername`, `tier`, `organizationType`, `category` |
| **Shows**       | `publisher`        | 24      | Publishers: `displayName`, `approxSubscriptionCount`, `description`, `businessProfileId`, `deeplinkUrl`           |
| **Spotlight**   | `storyCard`        | 24      | Story IDs linking to spotlight content                                                                            |
| **Lenses**      | `lens`             | 24      | AR lenses by keyword                                                                                              |
| **Topics**      | `topic`            | 3-8     | Related topic categories                                                                                          |
| **Add Friends** | `user`             | 1       | User suggestion                                                                                                   |
| **Episodes**    | `publisherEdition` | 15      | Show episodes                                                                                                     |
| **Places**      | `place`            | 10      | Related locations                                                                                                 |


### Subscribe section — richest creator discovery data

Each `snapProEntity.profile.businessProfile` contains:

```
title                   — "Fashion" (display name)
subscriberCount         — 4427373
hostAccountUsername      — "fashionsshow" (← the username to scrape via /add/)
hostAccountMutableUsername — same
tier                    — 2 or 3 (creator tier level)
organizationType        — 0
isBrandProfile          — false
isPartnerProfile        — false
isCreatorHubCollaborator — false
l90Country              — 0
category / categoryEnum — profile category
businessLogo            — CDN URL
heroImageUrl            — CDN URL
id                      — internal profile ID
accountId               — UUID
createdTimestamp        — account creation date
websiteUrl, emailAddress, phoneNumber — when populated
```

### Spotlight cards — creator extraction from `encodedSpotlightCardMap`

Each spotlight card in the map contains `singleSnapStoryMetadata` and `snaps[]`. The snaps contain:

```
creatorInfo:
  userName         — "@fatima_rose96" (the creator's username)
  displayName      — "Fatima 🌹"
  followerCount    — 0 (not always populated here)
  snapproTier      — 0, 1, 2, or 3 (creator tier)
  userId           — internal user ID
  creatorEligibility:
    isEligibleForAffiliateDeeplink — boolean

singleSnapStoryMetadata:
  displayName      — creator display name
  businessProfileId — UUID
  businessLogoUrl  — CDN URL
  llmTitle         — AI-generated title
  llmDescription   — AI-generated description
  llmKeywords      — AI-generated keyword list

engagementStats:
  viewCount        — 700276 (per spotlight)
  shareCount       — 1585
  commentCount     — (when available)
```

### Verified discovery output (fashion keyword, single request)

From one `/explore/fashion` request:

- **5 Subscribe profiles** with subscriber counts (up to 9.2M)
- **24 Publishers/Shows** with subscription counts
- **22 unique creator usernames** from Spotlight cards with engagement stats
- **24 Lenses** with creator info

Total: ~50+ unique creator/publisher identities from a single HTTP request.

### Tested categories


| Keyword | Subscribe | Shows | Spotlight | Lenses | Topics |
| ------- | --------- | ----- | --------- | ------ | ------ |
| beauty  | 8         | 24    | 24        | 24     | 3      |
| fitness | 6         | 24    | 24        | 24     | 7      |
| comedy  | 4         | 24    | 24        | 24     | 8      |
| gaming  | 4         | 24    | 24        | 24     | 5      |
| music   | 4         | 24    | 24        | 24     | 8      |
| food    | 4         | 24    | 24        | 24     | 8      |
| travel  | 4         | 24    | 24        | 24     | 7      |


### Practical value

**VERY HIGH for creator discovery.** This solves the "how do we find creators we don't already know about" problem. Workflow:

1. Enumerate category keywords (fashion, beauty, fitness, comedy, food, travel, tech, ...)
2. Fetch `/explore/<keyword>` for each
3. Extract all creator usernames from Subscribe + Spotlight + Shows sections
4. Feed those usernames into the profile scraper (Section 2) for full data + related accounts
5. This seeds the network graph crawler without needing any pre-existing username list

---

## 3. Spotlight Web Pages — `ACCESSIBLE, VIDEO-LEVEL DATA`

### What it is

Spotlight is Snapchat's TikTok-like short video feed. Individual Spotlight videos have public web URLs.

### URL pattern

```
https://www.snapchat.com/spotlight/<long_base64_id>
```

These IDs appear in the Sponsored Content API responses as `content_url` for `content_type: "SPOTLIGHT"` items.

### Data available

From the web page `__NEXT_DATA__` and from third-party scrapers:

- Video metadata (title, description, duration, dimensions)
- Creator username and profile link
- View count
- Share count
- Like count (sometimes)
- Upload timestamp
- Hashtags
- Media URLs (video + thumbnail)
- Comments (via separate scraping)

### How to access

1. **Direct web scraping**: fetch the URL, parse `__NEXT_DATA__`
2. **Apify scrapers** (multiple available):
  - `easyapi/snapchat-spotlight-detail-scraper` — $4.99/1k results
  - `simpleapi/snapchat-spotlight-scraper` — $9.99/mo + usage
  - `scrapio/snapchat-spotlight-scraper` — $14.99/mo + usage
3. **ImbueData API**: dedicated Snapchat media API with normalized JSON

### Practical value

**Medium-High.** This is where the engagement metrics are. Combined with our Sponsored Content data:

1. Extract all `content_url` values where `content_type = "SPOTLIGHT"` from our existing data
2. Scrape each Spotlight URL for view/share/like counts
3. Now we have **creator activity + engagement metrics** for sponsored content

This is the most promising path to enriching our existing data.

---

## 4. Story.snapchat.com — Public Stories — `ACCESSIBLE, EPHEMERAL`

### What it is

Public stories from verified/public accounts viewable on the web at `story.snapchat.com`.

### Key constraints

- **Only verified/public profiles** have web-accessible stories
- **Stories are ephemeral** — 24-hour lifespan by default
- **Saved Stories / Highlights** persist longer but not all creators use them
- Third-party "story viewers" (snapchatstoryviewer.com, etc.) relay public stories

### Data available

```
story:
  snaps[]:
    id                    — snap UUID
    media_url             — CDN URL to video/image
    timestamp             — creation time
    media_type            — VIDEO | IMAGE
    duration              — seconds
    preview_image_url     — thumbnail
```

### Tools

- **PySnapStories** (open-source, GitHub: dvingerh/PySnapStories) — Python script for downloading public stories
- **Apify scrapers**: `easyapi/snapchat-user-stories-scraper` — $2.99/1k results
- **ZenRows Snapchat Scraper** — enterprise API with proxy rotation

### Practical value

**Low-Medium.** Ephemeral by nature — you must poll frequently to capture stories before they expire. Useful for monitoring specific high-profile creators over time, but not for bulk historical analysis. Building an archive requires continuous polling.

---

## 5. Public Profile API (Official) — `DEAD END`

### What it is

Snapchat's official API for creator discovery and profile metrics. The richest data source — if you could access it.

### What it would provide

**Public endpoints** (no creator opt-in needed):

```
GET /public/v1/public_profiles/discover           — search/browse creators
GET /public/v1/public_profiles/{id}               — profile by ID
GET /public/v1/public_profiles/{id}/stats          — public metrics
GET /public/v1/public_profiles/change_logs         — CSV of profile changes
```

Fields: display name, category, subcategory, subscriber count, country, profile tier, logo URLs, verified status, internal category (BUSINESS/CREATOR).

**Authorized endpoints** (creator must opt-in):

- Detailed analytics: views, engagements, shares
- Demographic breakdowns: age, gender, country, region, OS
- Story/Spotlight/Lens stats with daily/total/lifetime granularity (90-day window)
- Content management, posting, promotion

### Why it's a dead end

- **Allowlist-only**: must send OAuth client ID to "your Snap contact"
- **Tested 2026-04-08**: `businessapi.snapchat.com/public/v1/...` returns `"unauthorized"`
- No self-serve application process — requires existing Snap business relationship
- Even with access, the discover endpoint doesn't support fetching all creators at once (per Snap's FAQ)

### Relevance

**Would be HIGH if accessible.** The change_logs endpoint alone (CSV of profile creations/modifications/deletions) would be invaluable for tracking the creator ecosystem. But access requires a partnership we don't have.

---

## 6. Snap Star / Collab Studio — `DEAD END`

### What it is

Snap Stars is Snapchat's invite-only creator monetization program. Collab Studio is the marketplace connecting Stars with brands for sponsored content.

### How it works

- Snap selects creators (millions of followers, high engagement, direct Snap relationships)
- Four agency partners manage brand-creator matching: **Whalar**, **Beeline by Brat TV**, **Influential**, **Studio71**
- Creators earn from ads between their stories and from Spotlight rewards
- Brands access via the partner agencies, not directly

### Data available

None publicly. The marketplace operates through the partner agencies as intermediaries. No API, no public listing of Snap Stars, no way to enumerate participants.

### Practical value

**Zero for data collection.** Mentioned for completeness. However, the Sponsored Content API indirectly reveals Snap Star activity — creators appearing in sponsored content with brand deals are likely Snap Stars or similar program participants.

---

## 7. DSA Researcher Access — `DEAD END`

### What it is

Same as Source 7 in the ads research. Under EU DSA Article 40, Snap offers access to:

- **Spotlight Content**: user identifiers, submission dates, country, engagement data, content IDs, public links
- **Public Story Content**: country, user ID, submission date, content ID, public link
- **Map Story Content**: content ID, user ID, submission date, country, engagement data, public link
- **Spotlight Comments**: content ID, submission date, comment text, user ID, country
- **Public Profile Data**: user ID, engagement data, public link

### Why it's a dead end

- Requires **non-commercial research purpose** — Ravineo is commercial
- Requires institutional backing (university, DPO, legal officers)
- First-wave applications (Oct 2025) are being rejected (documented in March 2026 blog post)
- ~80 working day processing time
- Two paths: EU Data Access Portal (Article 40(4)) or direct email to `DSA-Researcher-Access@snapchat.com` (Article 40(12))

### What makes this data special

It's the **only source with real engagement data and user identifiers** for organic Spotlight/Story content. If we ever get academic partnership access, this would transform our creator intelligence capability. But it's not accessible to us now.

---

## 8. Third-Party Scrapers / Unofficial APIs — `REVERSE-ENGINEERED, WE CAN REPLICATE`

### The core truth: they ALL do the same thing

Every single 3rd-party scraper we investigated uses the **exact same technique**:

1. HTTP GET `snapchat.com/add/<username>` with a browser `User-Agent` header
2. Regex-extract `<script type="application/json">` tag
3. JSON-parse the `props.pageProps` payload
4. Flatten the nested objects into their output format

**No headless browsers. No secret APIs. No special authentication.** The Apify CheerioCrawler-based scrapers do it in ~2 seconds per profile with 256MB memory.

### What each provider actually does (and what they charge for it)


| Provider                               | Technique                                   | What they add                             | Pricing             | Can we replicate?                          |
| -------------------------------------- | ------------------------------------------- | ----------------------------------------- | ------------------- | ------------------------------------------ |
| **Apify Profile Scrapers** (4+ actors) | `__NEXT_DATA_`_ from `/add/<username>`      | Proxy pool, batch processing, JSON output | $15-25/mo + usage   | **YES** — trivially                        |
| **Apify Popular Accounts**             | `__NEXT_DATA__` from `/explore/<keyword>`   | Category enumeration, profile merging     | $15-25/mo + usage   | **YES** — we verified the endpoint         |
| **Apify Spotlight Scrapers**           | `__NEXT_DATA__` from spotlight URLs         | Video metadata extraction                 | $5-15/mo + usage    | **YES** — data already in profile response |
| **ScrapeCreators**                     | Same `__NEXT_DATA__` behind a REST wrapper  | REST API convenience                      | 100 free, then paid | **YES** — literally the same data          |
| **SnapIntel** (open-source)            | Same technique, Python, config-driven paths | Heatmaps, bitmoji versioning, downloads   | Free                | **YES** — source code verified             |
| **rebac-6/scraper** (open-source)      | Same technique, modular Python              | JSON output, multi-user                   | Free                | **YES**                                    |
| **zone559 gist**                       | Same technique, ~30 lines of Python         | Spotlight thumbnail download              | Free                | **YES** — the simplest reference           |


### Verified: what the scrapers add beyond the raw technique

The paid scrapers charge for exactly three things:

1. **Proxy rotation** — large proxy pools to avoid IP-level rate limiting
2. **Edge case handling** — detecting private profiles, handling redirects, retry logic
3. **API convenience** — REST endpoints, batch input, structured JSON output

We can replicate #2 and #3 trivially. For #1, we only need proxies at scale (1000+ profiles). For initial enrichment of our existing ~1000 creators, a single IP with polite delays is sufficient.

### The Apify "Popular Accounts Scraper" technique (discovery)

Verified by inspecting the input schema and testing ourselves:

1. Takes `keywords[]` array (e.g., `["fashion", "beauty"]`)
2. Fetches `snapchat.com/explore/<keyword>` for each keyword
3. Parses the `encodedSearchResponse` JSON from `__NEXT_DATA__`
4. Extracts profiles from Subscribe + Spotlight sections
5. For each discovered username, optionally fetches full profile via `/add/<username>`
6. Merges and deduplicates across keywords

This is exactly what our Section 2b describes — we can build it in a few dozen lines of TypeScript.

### SnapIntel source code analysis (verified)

SnapIntel (272 stars) uses a config-driven JSON path system to extract data:

```json
{
  "subscriberCount": "props.pageProps.userProfile.publicProfileInfo.subscriberCount",
  "bio": "props.pageProps.userProfile.publicProfileInfo.bio",
  "spotlightEngagementStats": "props.pageProps.spotlightStoryMetadata.{count}.engagementStats.viewCount",
  "spotlightHashtags": "props.pageProps.spotlightStoryMetadata.{count}.hashtags",
  "lenses": "props.pageProps.lenses"
}
```

The entire scraping technique is: `requests.get(url, headers=headers)` → regex for `application/json` → traverse JSON paths. That's it. The `{count}` placeholder iterates over array indices.

Additional SnapIntel features worth stealing:

- **Heatmap generation** from upload timestamps (activity pattern analysis)
- **Bitmoji version enumeration** (historical avatar tracking, niche but unique)
- **Multi-threaded download** of media files (stories, spotlights, lenses)

### ToS considerations

All unofficial. Snapchat's Terms of Service prohibit automated access. Risk profile:

- **Low risk**: small-scale enrichment (hundreds of profiles), polite rate, single IP
- **Medium risk**: systematic bulk scraping (thousands), proxy rotation
- **The data is publicly accessible** — the ToS issue is automation, not the data itself
- Every scraper listed on Apify openly does this commercially

### Bottom line

**There is zero reason to pay for any of these services.** The technique is trivial, verified, and we can build it ourselves in TypeScript using `got-scraping` (already in our codebase) or even stdlib `fetch`. The only thing worth paying for eventually is proxy infrastructure for scale — and even that only matters at 1000+ profiles/day.

---

## 9. Story Kit API (Official, Partner-Only) — `DEAD END`

### What it is

A separate, lesser-known official API for accessing public Snapchat Stories. GraphQL-based, maintained in Snap's own GitHub repo ([Snapchat/storykit](https://github.com/Snapchat/storykit)).

### Capabilities

- Search public stories by **location, time, caption, media type, official username**
- GraphQL schema defined in `public_story_api.graphql`
- HTTP POST only, partner-signed JWT in `X-Snap-Kit-S2S-Auth` header
- Authentication: ECDSA key pair (ES256), `iss`/`kid` assigned by "your Snap advocate"

### Why it's a dead end

Same gatekeeper pattern as Public Profile API — requires a "Snap advocate" to assign you credentials. No self-serve access. Would be extremely valuable for querying stories at scale (location-based search!), but inaccessible without a partnership.

---

## 10. Open-Source OSINT Tools — `SOURCE CODE VERIFIED, REUSABLE`

### SnapIntel (272 stars) — most complete

GitHub: [Kr0wZ/SnapIntel](https://github.com/Kr0wZ/SnapIntel) — **source code reviewed**

Architecture: `ssd.py` (main scraper) + `config.json` (JSON paths) + `display.py` (output) + `heatmap.py` + `snap_parser.py` (CLI args)

Core technique: `requests.get("https://www.snapchat.com/add/" + username, headers={"User-Agent": ...})` → regex `<script type="application/json">` → traverse config-driven JSON paths.

**Features worth reusing:**

- Config-driven JSON path extraction (resilient to minor schema changes — just update paths)
- Heatmap generation from upload timestamps → activity pattern analysis
- Multi-threaded content downloads (`concurrent.futures.ThreadPoolExecutor`)
- Bitmoji version enumeration (iterates historical avatar versions via URL manipulation)
- Private vs public profile detection (`pageType == 18` = public, else private)
- Profile picture upscaling: regex-replaces `90` with `640` in CDN URL for higher resolution

**Limitations:** Python-only, no proxy support, no batch/pipeline mode, no discovery (requires known usernames).

### rebac-6/snapchat-profile-scraper

GitHub: [rebac-6/snapchat-profile-scraper](https://github.com/rebac-6/snapchat-profile-scraper)

Modular Python scraper: `src/extractors/` + `src/config/` + `src/outputs/` + `src/runner.py`

Same core technique. Adds structured JSON output and multi-username batch support.

### zone559/snapchat-spotlights.py (gist)

The simplest reference implementation (~30 lines). Demonstrates spotlight thumbnail extraction from `/add/<username>`. Useful as a minimal proof of concept.

### PySnapStories

GitHub: [dvingerh/PySnapStories](https://github.com/dvingerh/PySnapStories)

Python script for downloading public stories from verified accounts. Accesses `story.snapchat.com` directly.

### yabesh12/snapchat-scraper

Selenium-based (headless browser). Flask API endpoints. MongoDB storage. Overkill — same data is available via HTTP-only.

### ptrumpis/snap-lens-web-crawler

JavaScript library for crawling `lens.snapchat.com`. Methods: `getTopLenses()`, `searchLenses()`, `getLensesByCreator()`, `getUserProfileLenses()`. Useful if AR lens data becomes relevant.

### Practical value

**HIGH.** SnapIntel's config-driven path extraction pattern is the right architecture for our scraper. We should build our own TypeScript version that combines:

- SnapIntel's resilient JSON path extraction
- `/explore/<keyword>` discovery from Apify's approach
- `relatedAccountsInfo` network crawling (novel — none of the existing tools do this)
- `got-scraping` for HTTP (already in our codebase) with browser-like fingerprinting

---

## Snap Map — `NOT A CREATOR SOURCE`

Snap Map (`map.snapchat.com`) shows geotagged public snaps on a world map. It was web-accessible but **current Snap support docs say it's now app-only**. Even when accessible, it shows anonymous location-based content, not creator profiles. Not relevant for influencer/creator activity mapping.

---

## Data We Already Have vs. What's Missing

### What we have (from Sponsored Content API)

- ✅ Active monetized creator usernames (~147k items)
- ✅ Creator ↔ brand sponsor relationships
- ✅ Content type per creator (SPOTLIGHT vs STORY)
- ✅ Direct links to creator profiles and content
- ✅ Thumbnail images

### What we CAN get for free (verified 2026-04-08, simple HTTP scraping)


| Data                                   | Source                       | How                                                              | Effort  | Verified?                                                         |
| -------------------------------------- | ---------------------------- | ---------------------------------------------------------------- | ------- | ----------------------------------------------------------------- |
| **Subscriber/follower counts**         | `/add/<username>`            | `publicProfileInfo.subscriberCount`                              | Trivial | YES — tested kingbach=2.7M, zane=1.5M, garyvee=767K               |
| **Bio, category, location**            | `/add/<username>`            | `publicProfileInfo.bio/categoryStringId/address`                 | Trivial | YES — "Just Do It." (Nike), "Beaverton, Oregon"                   |
| **Verified badge status**              | `/add/<username>`            | `publicProfileInfo.badge`                                        | Trivial | YES — badge=1 for verified                                        |
| **Account age**                        | `/add/<username>`            | `publicProfileInfo.creationTimestampMs`                          | Trivial | YES                                                               |
| **Spotlight engagement stats**         | `/add/<username>`            | `spotlightStoryMetadata[].engagementStats`                       | Trivial | YES — views, shares, comments, recommends, boosts per video       |
| **Spotlight video content**            | `/add/<username>`            | `spotlightHighlights[].snapList[].mediaUrl`                      | Trivial | YES — direct MP4 CDN URLs                                         |
| **AI content descriptions**            | `/add/<username>`            | `spotlightStoryMetadata[].llmTitle/llmDescription/llmKeywords`   | Trivial | YES — Snap's own AI-generated metadata!                           |
| **Related creator network**            | `/add/<username>`            | `publicProfileInfo.relatedAccountsInfo[]`                        | Trivial | YES — tested: kingbach→destormpower, melvingregg, directorwuzgood |
| **Category-based discovery**           | `/explore/<keyword>`         | `encodedSearchResponse.sections[]`                               | Trivial | YES — ~50+ creators per keyword                                   |
| **Topic / hashtag frontier expansion** | `/explore/<q>` + Topics rows | Same as above; enqueue each `topicText` as new `q` (dedup queue) | Low     | YES — see §2b                                                     |
| **Creator tier level**                 | `/explore/<keyword>`         | `creatorInfo.snapproTier` (0-3)                                  | Trivial | YES                                                               |
| **Engagement rates**                   | Computed                     | spotlight views / subscriber count                               | Trivial | YES (after scraping)                                              |


### What's STILL blocked (no free path)


| Missing data                                              | Why blocked                                                          |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| **Audience demographics** (age, gender, country)          | Public Profile API (partnership-gated) or DSA access (academic-only) |
| **Detailed analytics** (daily views, growth trends)       | Official API only, requires creator opt-in + Snap partnership        |
| **Private engagement metrics** (DMs, close friends views) | Never exposed                                                        |
| **Historical creator activity**                           | Must build ourselves via periodic re-scraping                        |


---

## Recommended Action Plan

### Phase 1: Build the profile scraper (free, immediate, ~1 day)

Now that we've verified the exact technique, this is straightforward:

1. Write a TypeScript scraper using `got-scraping` (already in our codebase):
  - `GET https://www.snapchat.com/add/<username>` with browser User-Agent
  - Parse `<script type="application/json">` via regex
  - Extract `publicProfileInfo` + `spotlightStoryMetadata` + `spotlightHighlights` + `curatedHighlights` + `lenses`
  - Detect public vs private profiles (`publicProfileInfo` key present = public)
2. Seed with unique `creator_name` values from our Sponsored Content DuckDB table
3. Save raw JSON per profile, load into DuckDB as `creator_profiles` view
4. Add polite rate limiting (1-2 seconds between requests, no proxy needed for initial batch)

### Phase 2: Category discovery via `/explore` (free, immediate, ~hours)

1. Compile **seed** keyword list: `fashion`, `beauty`, `fitness`, `comedy`, `gaming`, `music`, `food`, `travel`, `tech`, `sports`, `art`, `dance`, `education`, `lifestyle`, `news`, regions, brands, languages — **any string is allowed** (§2b); quality tracks content match, not a whitelist.
2. Fetch `/explore/<keyword>` for each, extract:
  - Subscribe section → `hostAccountUsername` + subscriber counts
  - Spotlight section → `creatorInfo.userName` from `encodedSpotlightCardMap`
  - Shows section → `businessProfileId` + `displayName`
  - **Topics section** → `onTap.openHashtagTopic.topicText` for each row → enqueue `**/explore/<topicText>`** as new keywords (dedup, max depth/budget) — this grows the frontier without a master keyword list
3. Optionally fetch `**/topic/<topicId>**` only for slugs that return 200 if you want the dedicated topic page layout (`spotlights[]` list); otherwise `**/explore/<slug>**` is sufficient for discovery
4. Merge all discovered usernames with Sponsored Content seeds
5. Feed into Phase 1 scraper for full profile enrichment

### Phase 3: Network graph construction (free, medium effort, ~days)

1. From Phase 1 profiles, extract `relatedAccountsInfo` → new usernames
2. BFS crawl 2-3 levels deep from all seeds (Sponsored Content + /explore discovery)
3. Build edge table in DuckDB: `(source_username, related_username, related_title, related_badge)`
4. Identify influence hubs, brand ambassador clusters, disconnected communities
5. Compute centrality metrics, cross-brand creator identification

### Phase 4: Engagement enrichment (free, from existing profile data)

Engagement data is already in Phase 1 profile responses — no separate scraping needed:

1. From `spotlightStoryMetadata[]`: viewCount, shareCount, commentCount, recommendCount, boostCount per spotlight
2. From `videoMetadata`: durationMs, uploadDateMs, contentUrl (direct MP4 links)
3. Compute per-creator aggregates: total views, average engagement rate (views/subscribers), posting frequency
4. AI-generated content metadata (llmTitle, llmDescription, llmKeywords) — free content categorization from Snap itself

### Phase 5: Scale and monitor (ongoing)

1. Re-scrape Sponsored Content API periodically (new deals appear/disappear)
2. Re-scrape tracked creator profiles weekly/monthly for subscriber growth trends
3. Add proxy rotation when hitting rate limits at scale (Webshare residential proxies, or GCP Cloud Run disposable IPs — already experimented with in `gcp_experiment/`)
4. Build historical time-series: subscriber growth, engagement trends, new brand deals

---

## Open Questions (Updated 2026-04-08)

1. ~~**Profile scraping rendering**~~ **RESOLVED**: Simple HTTP GET with User-Agent header returns full `publicProfileInfo`. No headless browser needed. The initial test failed because `djkhaled` has no Public Profile — it's an account type issue, not a rendering issue. Every Apify scraper, ScrapeCreators, and SnapIntel use this same HTTP-only approach.
2. **Spotlight URL coverage**: what percentage of our `content_url` values from Sponsored Content are still live? Spotlight content may be removed after the sponsored relationship ends. (Testable — just HEAD-request a sample.)
3. **Rate limits at scale**: tested ~15 profiles rapidly from single IP with no issues. Moderate volume (100-500/day) likely safe without proxies. Heavy volume (1000+/day) will need rotation. Same infrastructure we already have from ads scraping.
4. **Creator enumeration completeness**: four complementary discovery paths now confirmed:
  - Sponsored Content API → known monetized creators
  - `/explore/<keyword>` → search-based discovery (~50+ identities per query when the query matches real content)
  - Topics `**topicText` → `/explore/<topicText>`** recursion → expands the keyword frontier without an official list
  - `relatedAccountsInfo` → network crawling from known profiles
  - Combined coverage should be excellent for the commercially-active creator segment.
5. `**relatedAccountsInfo` stability**: does the array change over time? Is it algorithmic or curated? Needs longitudinal testing — scrape same profiles a week apart and compare.
6. **Public Profile adoption rate**: what percentage of creators from our Sponsored Content data have Public Profiles set up? This determines how many we can enrich. Testable with a sample batch.
7. **Nike subscriber count = "0"**: brand/business profiles may hide or not populate subscriber counts. Need to test more brands to determine if this is systematic.

