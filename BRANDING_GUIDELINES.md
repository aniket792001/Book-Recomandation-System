# 🎨 PagePulse AI — Project Branding & Design System Guidelines

> **File:** `BRANDING_GUIDELINES.md`  
> **Status:** Official Design System Specification  
> **Audience:** Frontend Developers, Mobile UI Engineers, AI Agents, Designers  

---

## 1. Brand Identity & Personality

**PagePulse AI** bridges the timeless beauty of classical literature with the modern intelligence of generative AI. 
The brand voice and visual aesthetic balance:
- **Literary Elegance**: Warm, thoughtful, uncluttered, and readable.
- **Modern Dynamism**: Smooth glassmorphism, soft 3D elevation, dynamic fluid transitions.
- **Warmth & Inclusivity**: Retaining the iconic pink-orchid signature aesthetic that invites readers rather than feeling sterile or corporate.

---

## 2. Master Color Palette (Invariable Design Tokens)

The color theme is mathematically calibrated for high contrast, WCAG 2.1 AA accessibility, and aesthetic delight across both Day (Light) and Night (Dark) modes.

### 2.1. Brand Core Colors
| Token Name | Hex Code | RGB | Role & Usage |
| :--- | :--- | :--- | :--- |
| `primary` | `#E285C3` | `rgb(226, 133, 195)` | **Signature Brand Color**: Active tabs, primary CTAs, progress bars, glowing borders. |
| `primary-hover`| `#D66EB1` | `rgb(214, 110, 177)` | Button pressed states, active link hover. |
| `secondary` | `#818CF8` | `rgb(129, 140, 248)` | AI badge chips, genre tags, secondary action buttons. |
| `ambient-glow` | `#E0E7FF` | `rgb(224, 231, 255)` | Soft card gradients, subtle aura shadows, elevated card tints. |

---

### 2.2. Mode-Specific Canvas & Surfaces

#### Light Mode Palette (Daylight Reading)
| Token Name | Hex Code | Description & Usage |
| :--- | :--- | :--- |
| `bg-light-canvas` | `#F5F6FA` | App background, page canvas |
| `bg-light-surface` | `#FFFFFF` | Elevated book cards, modals, sheets |
| `bg-light-secondary`| `#E0E7FF` | Highlighted rows, search input containers |
| `border-light` | `#E2E8F0` | Subtle hairline dividers and card borders |
| `text-light-primary` | `#222222` | Headings, book titles, high-emphasis text |
| `text-light-secondary` | `#64748B` | Author names, publication dates, metadata |

#### Dark Mode Palette (Midnight Reading)
| Token Name | Hex Code | Description & Usage |
| :--- | :--- | :--- |
| `bg-dark-canvas` | `#0F172A` | Deep midnight blue background |
| `bg-dark-surface` | `#1E293B` | Elevated cards, bottom navigation bar |
| `bg-dark-secondary` | `#334155` | Search bars, chips background, dialogs |
| `border-dark` | `#334155` | Subtle borders for elevated containers |
| `text-dark-primary` | `#F8FAFC` | Bright crisp text for dark canvas |
| `text-dark-secondary` | `#94A3B8` | Muted metadata and reading counters |

#### Reading Canvas Themes (Inside In-App Reader)
| Theme Name | Background | Text Color | Ambient Tint |
| :--- | :--- | :--- | :--- |
| **Daylight** | `#FFFFFF` | `#1A1A1A` | Pure crisp white |
| **Warm Sepia** | `#FBF0D9` | `#433422` | Easy on eyes for prolonged reading |
| **Midnight** | `#0F172A` | `#E2E8F0` | Dark room battery-saving reading |
| **Soft Rose** | `#FFF5F9` | `#2A1B24` | Brand-tinted gentle reading canvas |

---

### 2.3. Semantic Status Indicators
| Token Name | Hex Code | Meaning |
| :--- | :--- | :--- |
| `status-success` | `#10B981` | Download completed, sync verified |
| `status-warning` | `#F59E0B` | Low battery, download paused |
| `status-error` | `#EF4444` | Network failed, login error |
| `status-info` | `#3B82F6` | New chapter available, AI tip |

---

## 3. Typography Hierarchy

### 3.1. UI Fonts (Interface & Navigation)
- **Primary Sans-Serif**: `Inter`, `Outfit`, or `System Sans-Serif` (San Francisco on iOS, Roboto on Android).
- **Scale**:
  - `Hero Title`: 28pt / Bold (Weight 700)
  - `Screen Title`: 22pt / Semi-Bold (Weight 600)
  - `Book Card Title`: 16pt / Semi-Bold (Weight 600)
  - `Body / Metadata`: 14pt / Regular (Weight 400)
  - `Caption / Tags`: 12pt / Medium (Weight 500)

### 3.2. Reader Fonts (Long-form Reading Engine)
- **Serif Fonts**: `Literata`, `Merriweather`, or `Georgia`.
- Adjustable line height (default `1.6`), adjustable font size (12pt to 28pt), and word spacing controls.

---

## 4. UI Component Design Patterns

### 4.1. The 3D BookCard
- **Border Radius**: `18px`
- **Shadow**: `0 8px 32px 0 rgba(226, 133, 195, 0.15), 0 2px 8px 0 rgba(0, 0, 0, 0.08)`
- **Hover/Press Animation**: Smooth `scale(1.04)` with micro-rotation `rotateY(5deg)` to simulate an inviting tactile hardcover book.
- **Cover Thumbnail**: Aspect ratio `1:1.5` with rounded corners `10px` and shadow `0 4px 16px rgba(226, 133, 195, 0.25)`.

### 4.2. Action Buttons (Primary)
- **Background**: `#E285C3` (Primary) with optional subtle gradient to `#D66EB1`.
- **Text Color**: `#FFFFFF` (Font weight 600).
- **Border Radius**: `12px` (Squircle).
- **Elevation**: Soft colored glow `box-shadow: 0 4px 14px rgba(226, 133, 195, 0.39)`.

### 4.3. AI Companion Assistant Interface
- Floating action button or bottom drawer with `#818CF8` to `#E285C3` gentle gradient shimmer.
- Conversational bubble:
  - User: Solid `#E285C3` with white text.
  - AI Assistant: Elevated surface with fine `#E0E7FF` border and `#818CF8` subtle avatar indicator.

---

## 5. Voice & Tone Guidelines

When writing copy for the app or formulating AI Companion prompt personas:
- **Tone**: Cultured yet friendly, insightful, patient, and welcoming.
- **Rules**:
  - Never spoil plots or major twists without an explicit user confirmation button.
  - Keep recommendations context-aware (*"Because you enjoyed Pride and Prejudice, you might appreciate the sharp wit in Middlemarch"*).
  - Use encouraging language for daily reading habits.
