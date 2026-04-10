# Concept — Snapchat Brand Intelligence Report

## What we're building

A single-page scrolling narrative report for one brand. Not a dashboard —
a pre-built story that shows a head of marketing what they need to know
about their Snapchat presence and competitive landscape in Europe.

Linear scroll, no navigation choices. The viewer reads top to bottom.
Medium length (~6-7 sections, ~4 min read).

## Why this format

- **Honest about the data.** We have a fixed snapshot, not a live feed.
  A report says "here's what we found." A dashboard implies real-time
  interactivity we can't deliver.
- **Nobody does this.** Competitors (Pathmatics, AdClarity) give you a
  sandbox. We give you the answer. Closer to a McKinsey deliverable
  than a SaaS tool. Something Ravineo could upsell as premium.
- **Fastest to build.** No state management, filters, empty states.
  Sections with data, in order, top to bottom.

## Audience

Marketing manager / head of marketing. Busy, strategic, not technical.
They want: "what do I need to know?" — not "here's a tool, go explore."

## Content balance

- ~60% competitive intelligence (what others are doing)
- ~40% brand's own position (where they stand)
- Every data point gets competitive context

## Tone

Editorial with teeth. Sharp, direct, confident.
Not warm storytelling. Not dry data dump.
"Your top competitor launched 512 ads while you launched 30."

## Visual approach

Creatives (ad thumbnails) appear as supporting evidence next to insights,
not as hero galleries. The text and numbers are the product. Visuals
prove the claims.

Toned-down influence from Spotify Wrapped: the narrative arc structure
(setup → highlights → surprises → competitive context → takeaways),
not the celebratory aesthetic.

## Interactivity

The scroll is the backbone. Interactivity is layered on top — it
rewards curiosity without requiring it. Think NYT interactive longform:
the story drives, but when something catches your eye, you can poke at it.

### Use (enhances the story)

- **Scroll-triggered animations.** Counters tick up, bars grow, sections
  fade in as you reach them. Makes the page feel alive.
- **Hover tooltips.** Data points reveal detail on hover — exact numbers,
  brand names, dates. The chart stays clean, detail is on demand.
- **Comparison sliders.** "Your brand vs. competitor" — drag to compare
  spend, impressions, creative volume side by side.
- **Expandable "dig deeper" cards.** The insight headline is always
  visible. Click to expand and see the supporting data table underneath.
  Story stays linear; depth is opt-in.
- **Thumbnail lightbox.** Click an ad creative to see it larger with
  metadata (impressions, CTA, format, country).
- **Subtle motion.** Section transitions (fade up, parallax hints).
  Not flashy — just enough to signal "this is not a PDF."

### Avoid (breaks the story)

- Global filters that change the whole page.
- Tab navigation between views.
- Dropdown selectors that swap datasets.
- Anything that requires a decision before showing content.

### Rule of thumb

If removing the interactive element makes the section unreadable,
the interactivity is doing too much. Every section must work as a
static snapshot first. Interaction adds depth, never replaces content.

## Guiding principles

1. **Every section answers one question.** If we can't phrase it as a
   question a marketing head would ask, cut it.

2. **Never show the brand alone.** Every number gets competitive context.
   "You ran 30 ads" is nothing. "You ran 30 — your competitor ran 512"
   is everything.

3. **Data picks the story.** We look at what's interesting in the data
   for the chosen brand, and that becomes the narrative. We don't write
   a story and hunt for data to fit it.

4. **Insights over numbers.** Charts show "what." Text says "so what"
   and "now what." The text between sections is the product.

5. **Honest about proxies.** Estimated spend is marked as estimated.
   Impression data is real. We never blur the line.

6. **Scroll drives, interaction rewards.** The viewer scrolls and the
   story unfolds without any clicks. But if they're curious, hovering,
   clicking, and dragging reveal deeper layers. The story works without
   interaction; interaction makes it better.

7. **Exit emotion: "I need this for my brand."** Not "pretty" or
   "interesting." The viewer should feel a gap — they saw what's
   possible and they want it for themselves.

## Content spotlights

Embed 2-3 specific creatives inline as "success stories." We have live
CDN URLs for ~4,000 ad creatives (images + videos) and ~107 spotlight
thumbnails. The URLs are served by Snap's CDN and remain accessible.

What we can call a "success story" with our data:
- **Reach** — "This ad reached 82M impressions, the #1 in EU fashion"
- **Investment signal** — "This AR Lens at €25-40 CPM = ~€500K single placement"
- **Content strategy** — "266K views on this spotlight with 19K boosts"

What we cannot claim:
- Conversions, clicks, ROAS, sales impact.

The metric is visibility and investment — exactly what awareness-stage
marketing leadership cares about. We show the actual creative alongside
the numbers. The thumbnail makes the data tangible.

## Brand: Dior

### Why Dior

- **Not dominant — behind enough to feel the gap.** Cartier has 2.3x
  Dior's impressions. CHANEL covers 3 more countries. Gucci achieves
  similar reach from 8.5x fewer ads. A brand that's winning doesn't
  need an intelligence tool. A brand that's #4 and doesn't know why
  opens their wallet.
- **Richest competitive set in the data.** Six luxury rivals all present:
  Cartier (108M impr), Gucci (48M), CHANEL (44M), CELINE (32M),
  Burberry (17M), Louis Vuitton (12M). Each with a distinct strategy.
- **Recognizable.** Everyone knows Dior. No explanation needed.
- **Good data spread.** 59 ads, 8 countries, 12 months, 47 creatives
  with live CDN URLs, 16 spotlight videos (200K views), 16 identifiable
  campaigns (J'adore, MISS DIOR, SAUVAGE, DIOR ADDICT, etc.).

### Competitive set

| Brand          | Ads | Countries | Impressions | Per-ad efficiency | Strategy signal            |
|----------------|----:|----------:|------------:|------------------:|----------------------------|
| Cartier        |  53 |         6 |       108M  |            2.04M  | Heavy AR Lens (49% of impr)|
| Gucci          |   7 |         1 |        48M  |            6.84M  | Few mega-campaigns         |
| **Dior**       |  59 |         8 |        47M  |            794K   | Diversified, mid-efficiency|
| CHANEL         |  75 |        11 |        44M  |            588K   | Pan-European, always-on    |
| CELINE         |  10 |         1 |        32M  |            3.19M  | France-only, concentrated  |
| Burberry       |  10 |         1 |        17M  |            1.68M  | France-only                |
| Givenchy Beauty|   8 |         1 |        15M  |            1.89M  | Beauty vertical            |
| Louis Vuitton  |  14 |         3 |        12M  |            886K   | Modest Snap presence       |

### Data inventory for Dior

| Source              | Volume             | Expandable? |
|---------------------|--------------------|-------------|
| Ads (Gallery API)   | 59 ads, 47 creatives | No — rate-limited, tapped out |
| Profile             | 1 profile          | Already complete |
| Spotlights          | 16 videos, 200K views | Yes — more via explore |
| Sponsored content   | 230K rows (all brands) | No — cursor expired |
| Competitor ads      | 7–75 per rival     | No — same constraint |

## Sections (draft outline)

The story arc, mapped to actual data:

### 1. The Landscape
*"How big is luxury fashion on Snapchat in Europe?"*

- Total luxury ad volume, impressions, estimated spend range
- How many brands compete, how many countries
- Sets the stage — Snapchat is a real channel for luxury

Data: aggregate across competitive set.

### 2. Where Dior Stands
*"Are you being outspent?"*

- Dior's share of voice: #4 in luxury by impressions
- Per-ad efficiency ranking: 794K vs Gucci's 6.8M
- Estimated spend range with honest proxy disclaimer
- Animated bar chart: Dior vs all 7 competitors

Data: competitive impressions, ad counts, CPM estimates.

### 3. The Geographic Gap
*"Where are you — and where aren't you?"*

- Dior's 8 countries vs CHANEL's 11
- Concentration: Dior puts 28% in Belgium, 28% in Germany — only
  11% in France despite being a French house
- Competitor map comparison
- "Markets where your competitors are active and you're not"

Data: per-country impression breakdowns.

### 4. Creative Strategy
*"What formats are your competitors investing in?"*

- Cartier: 49% of impressions from AR Lenses (premium format, €15-40 CPM)
- CHANEL: 52% AR Lenses
- Dior: 7% AR Lenses — significantly underweight
- Show actual Dior ad creatives alongside competitor format breakdown
- Thumbnail lightbox for 2-3 top-performing Dior ads

Data: format distribution, creative URLs, per-format impressions.

### 5. Campaign Rhythm
*"When do you show up — and when don't you?"*

- Dior's monthly cadence vs Cartier's burst strategy vs CHANEL's
  always-on approach
- Seasonal patterns: Dior peaks in Jan (14 ads) and Apr (10 ads)
- Gap months where competitors are active and Dior is quiet
- Timeline visualization with scroll animation

Data: start_date monthly aggregation.

### 6. Content That Works
*"What's your strongest Snapchat content?"*

- Top Dior ad: "Été 2026" — 10.5M impressions in Belgium
- Top campaigns by reach: Été 2026 (13M), Sommer 2026 (9.9M),
  J'adore Intense (6M), DIOR ADDICT (4.9M)
- Spotlight content: 16 videos, 200K views, fashion show and
  backstage content performing best
- 2-3 embedded creatives with impressions and context

Data: top ads with creative URLs, spotlight view counts.

### 7. Key Takeaways
*"What should you do next?"*

3-4 sharp, actionable bullets synthesized from all sections:
- The AR Lens gap (Cartier/CHANEL invest 50%+, you invest 7%)
- The France paradox (French house, Belgium/Germany-heavy)
- The efficiency question (59 ads for 47M vs Gucci's 7 ads for 48M)
- The content opportunity (spotlight content has traction, lean in)

Closes with: "This is what Ravineo sees. Want this for your brand?"
