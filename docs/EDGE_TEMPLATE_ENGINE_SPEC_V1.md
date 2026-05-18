# Edge Template Engine Spec v1

**Status:** Specification  
**Date:** 2026-05-18  
**Principle:** Assemble optimized conversion systems. Personalize within constraints. Never invent architecture arbitrarily.

---

## 1. Product Architecture

Edge is a **storefront operating system with intelligent conversion routing** — not an AI website builder.

### The 4-Layer Stack

| Layer | Name | Responsibility | AI Role |
|-------|------|---------------|---------|
| 1 | Master Engine | Conversion architecture, section rules, CTA strategy, checkout behavior | None — predefined |
| 2 | Variant | Section order, hero structure, merchandising emphasis, promo density | None — predefined |
| 3 | Vertical Preset | Allowed sections, product archetypes, proof types, trust signals, imagery style, vocabulary | None — predefined |
| 4 | AI Personalization | Brand copy, colors, images, headlines, testimonials, featured products | **AI fills modules here** |

**Rule:** AI only operates at Layer 4. Layers 1-3 are strict architectural boundaries. AI must never cross into Layer 1-3 territory — no inventing sections, no arbitrary page structures, no hallucinated product systems.

---

## 2. The 5 Master Engines

Each engine is a complete conversion architecture. Engines are NOT themes, NOT templates, NOT style presets. They are **behavioral systems** that determine how the storefront converts.

### 2.1 Editorial Commerce Engine

**ID:** `editorial-commerce`  
**System name:** Milano  
**Onboarding label:** Editorial Premium  

**Purpose:** Browse-first commerce with brand storytelling. High perceived value through editorial presentation.

**Conversion profile:**
- Primary flow: Browse → Product discovery → Add to cart → Fast checkout
- Secondary flow: Brand story → Trust → Catalog → Purchase
- CTA density: Medium (balanced between browsing and conversion)
- Mobile: Thumb-friendly grids, sticky add-to-cart

**Allowed sections (18):**
- Headers: `header-simple`, `header-promo`
- Heroes: `hero-visual`, `hero-split`, `hero-products`
- Commerce: `featured-collection`, `product-grid`, `best-sellers`, `collection-carousel`
- Social proof: `testimonial-grid`, `press-logos`, `review-carousel`
- Story: `brand-story`, `maker-note`
- Conversion: `newsletter-cta`, `promo-banner`
- Information: `faq`, `value-icons`
- Footer: `footer-basic`, `footer-service`

**Variants:**
- `campaign-storefront` — High promo density, seasonal merchandising, urgency signals
- `catalog-first` — Product-dense layouts, minimal story, search-forward
- `editorial-brand` — Story-led, image-heavy, slower conversion pace

### 2.2 Trust-First Services Engine

**ID:** `trust-services`  
**System name:** Ocean  
**Onboarding label:** Professional Authority  

**Purpose:** Service businesses requiring trust scaffolding before conversion. Optimized for quotes, bookings, and consultation flows.

**Conversion profile:**
- Primary flow: Problem recognition → Proof → Service packaging → Booking/Quote
- Secondary flow: Authority content → Trust → Consultation → Enrollment
- CTA density: Low (trust before ask)
- Mobile: Stacked service cards, click-to-call prominent

**Allowed sections (16):**
- Headers: `header-simple`, `header-mega`
- Heroes: `hero-trust`, `hero-visual`, `hero-cta`
- Services: `service-list`, `service-comparison`, `pricing-table`
- Social proof: `testimonial-grid`, `before-after`, `case-studies`, `press-logos`, `certifications`
- Trust: `brand-story`, `team-grid`
- Information: `faq`, `value-icons`
- Conversion: `quote-cta`, `booking-cta`
- Footer: `footer-service`

**Variants:**
- `quote-first` — Quote forms prominent, proof-heavy, slower pace
- `booking-led` — Calendar-first, availability-focused, faster pace
- `authority-funnel` — Content/credential-heavy, enrollment-oriented

### 2.3 Menus + Booking Engine

**ID:** `menu-booking`  
**System name:** Sunlit  
**Onboarding label:** Bold High Energy  

**Purpose:** Food, hospitality, and service businesses requiring fast ordering and reservation flows.

**Conversion profile:**
- Primary flow: Menu display → Order → Checkout (or Reserve)
- Secondary flow: Gallery → Trust → Menu → Order
- CTA density: High (order now everywhere)
- Mobile: Large tap targets, minimal scroll to order

**Allowed sections (14):**
- Headers: `header-promo`, `header-simple`
- Heroes: `hero-visual`, `hero-products`
- Menu: `product-grid`, `featured-collection`, `best-sellers`
- Social proof: `testimonial-grid`, `review-carousel`
- Gallery: `image-gallery`
- Information: `faq`, `value-icons`
- Location: `location-map`
- Conversion: `order-cta`, `reservation-cta`
- Footer: `footer-basic`

**Variants:**
- `order-first` — Menu above fold, fast checkout, delivery/pickup toggle
- `reservation-led` — Booking prominent, gallery-heavy, slower pace
- `event-catering` — Packages, inquiry forms, capacity management

### 2.4 Maker Storytelling Engine

**ID:** `maker-storytelling`  
**System name:** Sage  
**Onboarding label:** Warm Artisan  

**Purpose:** Handmade, artisan, and craft businesses where provenance, story, and product detail drive conversion.

**Conversion profile:**
- Primary flow: Brand story → Product discovery → Product detail → Purchase
- Secondary flow: Maker connection → Trust → Catalog → Cart
- CTA density: Low (story before sale)
- Mobile: Editorial scroll, image-forward, craft details

**Allowed sections (15):**
- Headers: `header-simple`
- Heroes: `hero-split`, `hero-visual`
- Story: `brand-story`, `maker-note`, `process-timeline`
- Commerce: `product-grid`, `featured-collection`, `collection-carousel`
- Materials: `materials-showcase`, `craft-details`
- Social proof: `testimonial-grid`, `press-logos`
- Information: `faq`
- Conversion: `newsletter-cta`, `inquiry-cta`
- Footer: `footer-basic`

**Variants:**
- `story-first` — Story-led, slower reveal, craft-oriented
- `product-first` — Stronger merchandising, faster to catalog
- `maker-profile` — Creator-centric, process-heavy, commission-oriented

### 2.5 Authority Funnel Engine

**ID:** `authority-funnel`  
**System name:** Ocean (shares with Trust Services)  
**Onboarding label:** Professional Authority  

**Purpose:** Coaches, educators, and consultants where authority building and enrollment funnels drive conversion.

**Conversion profile:**
- Primary flow: Authority content → Trust signals → Offer → Enrollment
- Secondary flow: Lead magnet → Email sequence → Consultation → Program
- CTA density: Low-medium (authority before ask)
- Mobile: Long-form scroll, video embed support

**Allowed sections (14):**
- Headers: `header-simple`
- Heroes: `hero-visual`, `hero-cta`, `hero-trust`
- Authority: `brand-story`, `team-grid`, `certifications`, `press-logos`
- Content: `content-cards`, `video-embed`
- Social proof: `testimonial-grid`, `case-studies`, `before-after`
- Offers: `pricing-table`, `program-cards`
- Information: `faq`, `value-icons`
- Conversion: `enrollment-cta`, `booking-cta`
- Footer: `footer-service`

**Variants:**
- `lead-capture` — Lead magnet first, email sequence, slower enrollment
- `direct-enrollment` — Offer above fold, faster conversion pace
- `authority-first` — Content/credential-heavy, consultation-oriented

---

## 3. Engine → Variant Matrix

| Engine | Campaign / Fast | Balanced | Authority / Story |
|--------|----------------|----------|-------------------|
| Editorial Commerce | Campaign Storefront | Catalog First | Editorial Brand |
| Trust Services | Booking-Led | Quote-First | Authority Funnel |
| Menu + Booking | Order-First | Reservation-Led | Event Catering |
| Maker Storytelling | Product-First | Story-First | Maker Profile |
| Authority Funnel | Direct Enrollment | Lead Capture | Authority-First |

---

## 4. Vertical Presets

Vertical presets define the product archetypes, proof types, trust signals, imagery style, and vocabulary constraints for specific business categories. These sit between the engine/variant and AI personalization.

### 4.1 Retail Verticals

**Coffee / Specialty Food**
- Product archetypes: Roasts/blends, brewing equipment, subscriptions, gift sets
- Proof types: Star ratings, tasting notes, origin stories, press mentions
- Trust signals: Sourcing transparency, freshness guarantees
- Vocabulary: Roast profiles, tasting notes, origin, small-batch
- Imagery: Warm, rich, textured, bean-to-cup narrative
- **Forbidden:** Never generate jewelry, clothing, or non-food products

**Fashion / Apparel**
- Product archetypes: Collections, lookbooks, sizing guides, style edits
- Proof types: Fit guides, material details, customer photos, press features
- Trust signals: Size guarantee, free returns, ethical sourcing
- Vocabulary: Silhouette, fabrication, collection, edit, capsule
- Imagery: Editorial, lifestyle, model-on-figure, detail shots
- **Forbidden:** Never generate food products or service offerings

**Home / Decor**
- Product archetypes: Furniture, decor, textiles, lighting, room collections
- Proof types: Room photography, material samples, designer notes
- Trust signals: Craftsmanship guarantees, delivery windows, design consultations
- Vocabulary: Collection, craftsmanship, materials, designed for, curated
- Imagery: Room settings, detail closeups, lifestyle, material swatches
- **Forbidden:** Never generate apparel or food products

### 4.2 Service Verticals

**Home Services (Plumber, Electrician, Contractor)**
- Product archetypes: Service packages, emergency tiers, maintenance plans
- Proof types: Before/after photos, licenses, insurance badges, response times
- Trust signals: Licensed & insured, response guarantees, local reviews
- Vocabulary: Reliable, certified, same-day, guaranteed, local
- Imagery: Before/after, trucks/equipment, team photos, work in progress
- **Forbidden:** Never use retail-style product cards or "add to cart"

**Beauty / Wellness**
- Product archetypes: Treatment tiers, packages, memberships, gift cards
- Proof types: Before/after, reviews, certifications, press
- Trust signals: Licensed practitioners, hygiene standards, consultation
- Vocabulary: Treatment, consultation, results, transformation, ritual
- Imagery: Serene, clean, treatment rooms, results, products
- **Forbidden:** Never use medical claims or guarantee results

**Professional Services (Legal, Accounting, Consulting)**
- Product archetypes: Service tiers, retainers, audits, consultations
- Proof types: Credentials, case studies, client logos, publications
- Trust signals: Bar membership, CPA license, confidentiality, experience years
- Vocabulary: Advisory, engagement, practice, client, expertise, results
- Imagery: Professional, office, team, publications, credentials
- **Forbidden:** Never use "buy now" or shopping cart language

### 4.3 Food Verticals

**Restaurant**
- Product archetypes: Menu sections, specialties, wine list, private dining
- Proof types: Food photography, chef profiles, press, awards
- Trust signals: Reservations, dietary accommodations, health rating
- Vocabulary: Chef, seasonal, tasting, reservation, cuisine, menu
- Imagery: Food photography, dining room, kitchen, ingredients
- **Forbidden:** Never use "add to cart" (use "Order" or "Reserve")

**Bakery / Desserts**
- Product archetypes: Cakes, pastries, custom orders, celebration tiers
- Proof types: Cake photos, custom designs, reviews, press
- Trust signals: Custom consultations, delivery, dietary options
- Vocabulary: Custom, celebration, handcrafted, order ahead, occasion
- Imagery: Cake detail, decorating process, celebration settings
- **Forbidden:** Never generate non-food, non-bakery products

### 4.4 Artisan Verticals

**Jewelry**
- Product archetypes: Collections, custom pieces, materials, care guides
- Proof types: Detail photography, materials, maker story, certifications
- Trust signals: Authenticity, craftsmanship, repair, appraisal
- Vocabulary: Crafted, precious, collection, design, hand-finished
- Imagery: Macro detail, wearing shots, studio, materials, process
- **Forbidden:** Never generate food or clothing products

**Woodworking / Furniture**
- Product archetypes: Collections, custom commissions, materials, finishes
- Proof types: Workshop photos, material sourcing, process, reviews
- Trust signals: Craftsmanship, materials guarantee, delivery
- Vocabulary: Handcrafted, solid wood, commission, finish, heirloom
- Imagery: Workshop, grain detail, finished pieces, process
- **Forbidden:** Never generate non-furniture products

### 4.5 Event Verticals

**Florist**
- Product archetypes: Arrangements, wedding tiers, subscriptions, occasions
- Proof types: Arrangement photos, event gallery, reviews, press
- Trust signals: Delivery guarantee, freshness, customization
- Vocabulary: Arrangement, seasonal, bespoke, occasion, delivery
- Imagery: Arrangement detail, event settings, studio, process
- **Forbidden:** Never use "shopping cart" (use "Inquire" or "Order arrangement")

**Event Planning**
- Product archetypes: Packages, services, gallery, consultation
- Proof types: Event photos, client logos, vendor network, reviews
- Trust signals: Experience, vendor relationships, insurance
- Vocabulary: Curate, design, produce, coordinate, celebration
- Imagery: Event settings, details, behind-the-scenes, client results
- **Forbidden:** Never use product cards or "buy now"

---

## 5. Section Registry

### 5.1 Section Categories

| Category | Purpose | Example Sections |
|----------|---------|-----------------|
| `header` | Site navigation and announcements | header-simple, header-promo, header-mega |
| `hero` | Above-the-fold value proposition | hero-visual, hero-split, hero-trust, hero-cta |
| `commerce` | Product discovery and merchandising | product-grid, featured-collection, best-sellers |
| `social-proof` | Trust and credibility signals | testimonial-grid, before-after, press-logos, reviews |
| `offering` | Service/product packaging | service-list, pricing-table, program-cards |
| `trust` | Authority and credibility | brand-story, certifications, team-grid, maker-note |
| `conversion` | CTAs and conversion points | quote-cta, booking-cta, newsletter-cta, order-cta |
| `information` | Help and details | faq, value-icons, location-map |
| `content` | Rich media and stories | video-embed, content-cards, image-gallery |
| `footer` | Site footer and secondary links | footer-basic, footer-service |

### 5.2 Section Constraints Per Engine

Every section in the registry must declare:
1. **Allowed engines** — which master engines can use this section
2. **Allowed variants** — which variants (if engine-specific)
3. **Minimum/Maximum** — how many instances per page
4. **Position constraints** — must be before/after certain section types
5. **Required fields** — fields that must be populated (not default/empty)
6. **AI generation rules** — what AI can and cannot generate for this section

### 5.3 Example Section Constraint: testimonial-grid

```yaml
section: testimonial-grid
category: social-proof
allowed_engines:
  - editorial-commerce
  - trust-services
  - authority-funnel
  - maker-storytelling
allowed_variants:
  editorial-commerce: [editorial-brand]
  trust-services: [all]
min_instances: 0
max_instances: 1
position: after offering, before conversion
required_fields:
  - testimonials[0].quote
  - testimonials[0].author
ai_generation:
  allowed: true
  rules:
    - Generate testimonials matching the vertical vocabulary
    - Never invent real names or companies
    - Use placeholder format: "Author Name, Business or Role"
    - Maximum 3 testimonials per section
    - Must reflect the buying behavior pattern (fast/considered/relationship)
```

---

## 6. CTA Rules Per Engine

| Engine | CTA Density | Primary CTA | Secondary CTA | Sticky Mobile |
|--------|-----------|-------------|---------------|---------------|
| Editorial Commerce | Medium | "Shop Now" / "View Collection" | "Learn More" | Sticky add-to-cart |
| Trust Services | Low | "Request Quote" / "Book Now" | "View Services" | Click-to-call |
| Menu + Booking | High | "Order Now" / "Reserve" | "View Menu" | Sticky order button |
| Maker Storytelling | Low | "View Collection" / "Inquire" | "Our Story" | None (editorial scroll) |
| Authority Funnel | Low-Med | "Book Consultation" / "Enroll" | "Learn More" | Sticky consultation |

---

## 7. Mobile Rules

| Engine | Layout | CTA Behavior | Image Treatment | Navigation |
|--------|--------|-------------|-----------------|------------|
| Editorial Commerce | Thumb-friendly grids | Sticky add-to-cart | Full-bleed hero, grid below | Hamburger |
| Trust Services | Stacked service cards | Click-to-call prominent | Before/after stacked | Hamburger |
| Menu + Booking | Large tap targets | Sticky order button | Gallery swipe, large photos | Bottom tab bar |
| Maker Storytelling | Editorial scroll | No sticky (scroll-friendly) | Full-bleed, immersive | Minimal hamburger |
| Authority Funnel | Long-form scroll | Sticky consultation | Video embed, headshots | Hamburger |

---

## 8. Proof Rules

| Proof Type | Editorial Commerce | Trust Services | Menu+Booking | Maker Storytelling | Authority Funnel |
|-----------|-------------------|---------------|-------------|-------------------|-----------------|
| Star ratings | Allowed | Not primary | Allowed | Limited | Not primary |
| Testimonials | Secondary | Primary | Secondary | Primary | Primary |
| Before/after | Forbidden | Primary | Forbidden | Limited | Allowed |
| Press logos | Secondary | Primary | Limited | Primary | Primary |
| Case studies | Forbidden | Primary | Forbidden | Limited | Primary |
| Certifications | Limited | Primary | Health only | Craft only | Primary |
| Review count | Secondary | Not primary | Secondary | Limited | Not primary |

---

## 9. Checkout Rules

| Engine | Checkout Flow | Payment Method | Pre-Checkout | Cart Behavior |
|--------|--------------|---------------|-------------|---------------|
| Editorial Commerce | 1-page checkout | Apple Pay, Google Pay, Card | Cart drawer | Persistent cart |
| Trust Services | Inquiry → Quote → Booking | Invoice, Card | Quote form | No cart |
| Menu + Booking | Fast-path ordering | Apple Pay, Google Pay, Card | Menu selection | Order summary |
| Maker Storytelling | Standard cart | Card, Apple Pay | Cart page | Persistent with story notes |
| Authority Funnel | Enrollment → Payment plan | Card, Invoice | Lead capture | No cart |

---

## 10. AI Personalization Rules

### 10.1 What AI Can Do (Layer 4 Only)

- Write headlines and subheadings within vertical vocabulary
- Generate service/product descriptions within product archetypes
- Select imagery style matching vertical preset
- Write testimonial placeholder text
- Choose featured products from inventory
- Customize CTA copy within engine CTA rules
- Apply brand colors within style system parameters

### 10.2 What AI Must Never Do

- **Invent new section types** — use only registered sections
- **Change section order** — defined by variant, not AI
- **Modify CTA behavior** — defined by engine, not AI
- **Create new product archetypes** — defined by vertical preset
- **Generate cross-vertical content** — never generate jewelry for coffee
- **Expose architecture internals** — never mention "engine", "variant", "preset" in output
- **Override mobile rules** — defined by engine, immutable
- **Change checkout flow** — defined by engine, not AI
- **Hallucinate store information** — only use provided business data

### 10.3 AI Prompt Structure

```yaml
system_prompt: |
  You are a storefront personalization engine for Edge.
  You operate ONLY at Layer 4 (personalization).
  
  You are given:
  - engine: {engine_name}
  - variant: {variant_name}
  - vertical: {vertical_preset}
  - business: {business_name, offerings, tagline}
  - sections: [{section_type, data_template}]
  
  Your job:
  - Fill section data templates with personalized content
  - Match vertical vocabulary and product archetypes
  - Stay within the section's ai_generation rules
  
  CONSTRAINTS:
  {vertical_constraints}
  {engine_constraints}
  {section_constraints}

output_format: |
  Return populated section data matching the templates exactly.
  Do not add, remove, or reorder sections.
```

---

## 11. Implementation Priority

1. **Engine definitions** — Complete the 5 engines with all allowed sections and variants
2. **Vertical presets** — 3-5 presets per engine, with product archetypes and vocabularies
3. **Section constraint system** — Add `ai_generation` rules to every section in SECTION_LIBRARY
4. **AI prompt constraints** — Implement strict prompt boundaries based on engine + variant + vertical
5. **Generation refactor** — Rewrite `/api/sites/{id}/generate` to use constrained assembly not free generation

---

## 12. What This Replaces

| Old Approach | New Approach |
|-------------|-------------|
| AI generates arbitrary sections | AI fills predefined section templates |
| Dynamic page structures | Variant-controlled section order |
| Free-form AI copy | Vertical-vocabulary-constrained copy |
| Theme-based visual system | Engine-based behavioral system |
| Unlimited section combinations | Allowed section registry per engine |
| AI decides everything | AI personalizes within strict boundaries |
| "Generate websites" | "Assemble optimized conversion systems" |

---

## 13. Migration Notes

The existing codebase already has much of the infrastructure:
- `SECTION_LIBRARY` in `lib/section-library.ts` — 31 registered sections
- `TEMPLATES` in `lib/templates.ts` — 6 business type definitions
- `STYLE_DIRECTIONS` in onboarding — 4 visual directions
- `TEMPLATE_MANIFESTS` and `PAGE_TEMPLATES` in section-library — existing manifest structure

**What needs to change:**
1. Rename mental model: "templates" → "engines", "style presets" → "engine directions"
2. Add `ai_generation` rules to every section definition
3. Add engine/variant/vertical constraint tables
4. Refactor `generateSiteContent` in `lib/ai.ts` to use constrained assembly
5. Remove free-section-generation from the AI prompt
6. Add vertical preset vocabulary and product archetype definitions
