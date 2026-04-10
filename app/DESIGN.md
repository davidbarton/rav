# Design Language — Ravineo Dashboard Prototype

Extracted from `ravineo.webflow.css` on 2026-04-10, simplified for POC.

---

## Colors

### Brand Green

| Token     | Hex       | Usage                                    |
|-----------|-----------|------------------------------------------|
| `brand-50`  | `#edf7f2` | Hover backgrounds, tinted fills          |
| `brand-100` | `#e3f2eb` | Badge backgrounds, light fills           |
| `brand-600` | `#248069` | **Primary — buttons, links, active**     |
| `brand-700` | `#216959` | Primary button fill                      |
| `brand-900` | `#092625` | **Nav bar, dark sections**               |

### Grays (warm-tinted)

| Token     | Hex       | Usage                                    |
|-----------|-----------|------------------------------------------|
| `gray-50`  | `#f5f5f4` | Table headers, subtle backgrounds        |
| `gray-100` | `#f1f1ef` | Secondary button, tertiary bg            |
| `gray-200` | `#e8e8e6` | Borders, dividers                        |
| `gray-600` | `#7a7a7a` | Secondary text, labels                   |
| `gray-900` | `#171c1b` | **Primary text**                         |
| `white`    | `#ffffff` | Page & card backgrounds                  |

### Accents

| Token        | Hex       | Usage                    |
|--------------|-----------|--------------------------|
| `orange-500` | `#ff703c` | Attention CTA, highlights|
| `success`    | `#4e8f54` | Positive / verified      |
| `warning`    | `#de6c03` | Caution                  |
| `error`      | `#cd483f` | Risk / alerts            |
| `snapchat`   | `#FFFC00` | Snapchat brand yellow    |

### Data Viz (first 6 only)

```
#217866  #abd28b  #efd467  #7891d4  #365791  #36b2cf
```

---

## Typography

**One font: Inter** (Raveo VF is proprietary; Newsreader serif is overkill for POC).

```
Inter:wght@400;500;600;700
```

| Element      | Size     | Weight | Letter-spacing | Line-height |
|--------------|----------|--------|----------------|-------------|
| h1           | 3rem     | 700    | −0.03em        | 1.1         |
| h2           | 2.25rem  | 600    | −0.02em        | 1.2         |
| h3           | 1.5rem   | 600    | −0.02em        | 1.3         |
| h4           | 1.25rem  | 600    | −0.02em        | 1.3         |
| body         | 1rem     | 400    | 0              | 1.5         |
| small / label| 0.875rem | 500    | 0              | 1.4         |
| badge        | 0.75rem  | 500    | 0              | 1           |

---

## Spacing

Pick from: **4  8  12  16  24  32  48  64 px**. Nothing else.

---

## Radius

| Element  | Value |
|----------|-------|
| Buttons  | 8px   |
| Cards    | 12px  |
| Pills    | 9999px|

---

## Shadows

```css
--shadow-sm: 0 1px 3px #10182808;
--shadow-md: 0 4px 12px #10182814;
```

---

## Buttons

**Primary:**
- bg `brand-700` (#216959), text white, radius 8px, shadow-sm
- hover: bg `brand-600` (#248069)

**Secondary:**
- bg `gray-100` (#f1f1ef), text `gray-900`, no shadow
- hover: bg `gray-200`

**Outline:**
- bg white, border 1px `gray-200`, text `gray-900`
- hover: bg `gray-50`

Padding: `8px 12px` (default), `12px 24px` (large).
Font: 14px, weight 500.

---

## Cards

- bg white, border 1px `gray-200`, radius 12px, padding 16–24px
- shadow-sm optional

## Tables

- Header: bg `gray-50`, text `gray-600`, weight 500, 14px
- Rows: white, border-bottom 1px `gray-200`
- Hover: bg `brand-50` (#edf7f2)
- Cells: padding 12px 16px, text 14px

## Nav

- bg `brand-900` (#092625), text white, height 56px, sticky
- Active item: `brand-600` underline or text

## Badges

- Radius: pill (9999px), padding 4px 12px, font 12px weight 500
- Default: bg `brand-100` / text `brand-900`
- Warning: bg `#fcf2e6` / text `#de6c03`
- Error: bg `#fbf2f1` / text `#cd483f`
- Success: bg `#ebf4ec` / text `#4e8f54`

---

## Tailwind Config

```js
colors: {
  brand: {
    50:  '#edf7f2',
    100: '#e3f2eb',
    600: '#248069',
    700: '#216959',
    900: '#092625',
  },
  gray: {
    50:  '#f5f5f4',
    100: '#f1f1ef',
    200: '#e8e8e6',
    600: '#7a7a7a',
    900: '#171c1b',
  },
  orange:  { 500: '#ff703c' },
  success: { DEFAULT: '#4e8f54', light: '#ebf4ec' },
  error:   { DEFAULT: '#cd483f', light: '#fbf2f1' },
  warning: { DEFAULT: '#de6c03', light: '#fcf2e6' },
  snap:    '#FFFC00',
},
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
},
borderRadius: {
  btn:  '0.5rem',
  card: '0.75rem',
  pill: '9999px',
},
boxShadow: {
  sm: '0 1px 3px #10182808',
  md: '0 4px 12px #10182814',
},
```

---

## Rules

1. One font (Inter), no serif.
2. Green is for actions and nav — don't paint everything green.
3. Orange is rare — one CTA per page max.
4. Warm grays only (#f1f1ef not #f0f0f0).
5. 8px button radius, 12px card radius. That's it.
6. Tables are the core UI — give them room to breathe.
