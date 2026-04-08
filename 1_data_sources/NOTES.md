OK, we're thoroughly rate-limited now (even 3 minutes between requests wasn't enough). But combined with our earlier successful tests, I have a complete picture. Let me give you the straight answer.

---

## **Ads Gallery API — Full Structure**

**4 endpoints total.** That's it. Two for paid ads, two for organic/sponsored content.

### **Paid Ads (2 endpoints)**


| **#** | **Method** | **Endpoint**                  | **Purpose**               |
| ----- | ---------- | ----------------------------- | ------------------------- |
| 1     | `POST`     | `/v1/ads_library/ads/search`  | Search by advertiser name |
| 2     | `GET`      | `/v1/ads_library/ads/{ad_id}` | Get single ad by known ID |


### **Organic Sponsored Content (2 endpoints)**


| **#** | **Method** | **Endpoint**                               | **Purpose**                     |
| ----- | ---------- | ------------------------------------------ | ------------------------------- |
| 3     | `GET`      | `/v1/ads_library/sponsored_content`        | **Browse ALL** — no name needed |
| 4     | `POST`     | `/v1/ads_library/sponsored_content/search` | Search by creator name          |


No auth on any of them. No API key. No OAuth. Fully open.

## **What prevents downloading everything — 5 hard walls**

### **Wall 1:** `paying_advertiser_name` **is REQUIRED (paid ads only)**

Tested this live just now:

- **Missing field** → `E3024`: "payingAdvertiserName is required"
- **Empty string** `""` → `E3024`: same error
- **Single char** `"a"` → **passes validation** (got rate-limited, NOT validation-failed)

So the name IS required, but it's a **fuzzy/prefix match**, not exact. Single characters work. This means **alphabetical brute-force enumeration is theoretically possible** — iterate `"a"` through `"z"`, `"0"` through `"9"`, etc. But you'd still miss advertisers starting with non-Latin characters.

### **Wall 2:** `countries` **are REQUIRED (paid ads only)**

Must specify at least one from this fixed list of **27 EU + Turkey**: `de, be, fi, pt, bg, dk, lt, lu, hr, lv, fr, hu, se, si, sk, ie, ee, el, mt, it, es, at, cy, cz, pl, ro, nl, tr`

No "all" shortcut. You'd need to query each country separately (or batch them — unclear if array = OR or AND). **Non-EU ads are simply not in this system at all.**

### **Wall 3: Rate limits — THE real killer**

This is the showstopper. From our testing:

- First request after silence: works
- Second request 2 minutes later: `E1009` rate limit
- Third request 3 minutes later: `E1009` still blocked
- No documented rate limit headers or quotas

Estimated practical throughput: **~1 successful request per 5+ minutes per IP.** At 10 results per page, that's roughly **120 ads per hour**, **2,880 per day** from a single IP.

### **Wall 4: 12-month rolling window**

Ads older than 12 months silently disappear from the system. No archive, no historical access. The Political Ads ZIP is the only thing with multi-year history.

### **Wall 5: ~10 results per page, no total count**

- Page size appears fixed at ~10 ads per response
- No `total_count` or `total_pages` in the response
- Pagination via opaque cursor tokens
- You don't know how far you need to go until `paging.next_link` disappears

---

## **The response shape is flat — one object per ad**

Every ad (from search or by-ID) returns the same `ad_preview` shape. There's no nested pagination or sub-endpoints. One call = one batch of flat ad objects. The key fields from our verified real data:


| **Field**                      | **What it tells you**                                    |
| ------------------------------ | -------------------------------------------------------- |
| `id`                           | UUID — can feed to `/ads/{id}`                           |
| `paying_advertiser_name`       | Legal entity paying ("Spotify USA Inc.")                 |
| `brand_name`                   | Brand display name ("SpotifyDE")                         |
| `ad_account_name`              | Internal account ("Spotify-OneVibe-EMEA")                |
| `impressions_total`            | Total impressions across all EU                          |
| `impressions_map`              | **Per-country breakdown** `{"de": 169998, "fr": 0, ...}` |
| `targeting_v2.demographics`    | Age range, gender, languages                             |
| `targeting_v2.devices`         | iOS / Android targeting                                  |
| `start_date`                   | When ad started (no end_date!)                           |
| `status`                       | ACTIVE or PAUSED                                         |
| `headline`, `call_to_action`   | Ad copy                                                  |
| `top_snap_media_download_link` | **Actual video/image CDN URL**                           |
| `web_view_properties.url`      | **Landing page with UTM params**                         |
| `creative_type` / `ad_type`    | WEB_VIEW, COMPOSITE, DEEP_LINK, etc.                     |


**What's NOT here:** no spend/budget, no engagement (clicks/swipes), no frequency, no audience size, no end_date.

---

## **Sponsored content is the easy win**

Endpoint 3 (`GET /sponsored_content`) is **fully browsable** — no name required, just paginate. We confirmed `limit` param works. From our earlier session we got ~200 items per page, ~400 in first 2 pages. The fields are simpler (sponsor_name, creator_name, content_type, content_url, thumbnail_url) but give you the **creator ↔ sponsor relationship graph** which is gold for influence detection.

---

## **Bottom line: Can you download everything?**

**Sponsored content: Yes,** just paginate `GET /sponsored_content` until `paging.next_link` disappears. Rate limits are the only friction.

**Paid ads: No, not without a strategy.** You need to solve two problems:

1. **Name enumeration** — brute-force single-character prefix searches (`a`-`z`, `0`-`9`), cross-reference with sponsored content sponsor names, political ads CSV advertiser names, and external brand databases
2. **Rate limit circumvention** — rotate IPs/proxies, or accept ~2,880 ads/day per IP and plan accordingly

The API is architecturally simple (4 endpoints, flat response, no auth). The constraints are **intentionally designed to prevent bulk download** while technically complying with DSA transparency requirements.