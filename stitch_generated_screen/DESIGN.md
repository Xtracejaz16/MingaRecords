# Design System Strategy: Ancestral Modernism

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Ancestral Monolith."** 

This system rejects the ephemeral, "bubbly" nature of modern SaaS design in favor of something that feels eternal, heavy, and excavated. We are building a digital experience that mirrors the precision of Muisca goldsmithing and the architectural permanence of Tairona stone paths. 

To break the "template" look, we employ **Intentional Monasticism**: a layout strategy that uses expansive negative space (Obsidian Black) to make every element feel like a curated artifact. We utilize hard, 90-degree geometry to echo the precision of Zenú weaving, while overlapping "gold filigree" accents provide a layer of delicate complexity over the brutalist stone-like foundations.

## 2. Colors & Atmospheric Depth
Our palette is rooted in the earth and the sacred. It is designed to be experienced as a high-contrast, low-light environment that evokes a private gallery or a subterranean temple.

### The Palette
*   **Background (Surface):** `Obsidian Black (#181303)` – A deep, rich void that serves as our canvas.
*   **Primary (Accents):** `Muisca Gold (#C8860A / #ffb950)` – Used for high-value interactions and critical branding.
*   **Secondary (Depth):** `Tairona Terracotta (#8B2500 / #ffb59f)` – Used for heat, energy, and secondary calls to action.
*   **Tertiary (Highlights):** `Jade Wayuu (#81d6c7)` – Used sparingly for success states or specialized navigational highlights.

### The "No-Line" Rule
Sectioning must never be achieved through 1px solid lines. We define boundaries through **Tonal Carving**. Use `surface-container-low` (#211b08) against the base `surface` (#181303) to create a subtle shift in the "floor" of the UI. This mimics the transition between different types of stone in a temple rather than a digital box.

### Surface Hierarchy & Nesting
Treat the UI as layered lithic plates. 
*   **Base Layer:** `surface` (#181303).
*   **Submerged Content:** `surface-container-lowest` (#130e01) for inset areas like code blocks or footer wells.
*   **Raised Artifacts:** `surface-container-high` (#302915) for cards and modals.

### Signature Textures
While the UI is digital, it must feel tactile. Apply a subtle 5% opacity noise texture to the `surface` layer to mimic the grain of volcanic stone. For CTAs, use a linear gradient transitioning from `primary` (#ffb950) to `primary-container` (#c8860a) at a 45-degree angle to simulate the way light hits polished gold.

## 3. Typography: The Editorial Voice
We pair the Roman architectural authority of *Cinzel* with the intimate, scholarly legibility of *Crimson Pro*.

*   **Display & Headlines (Cinzel):** These are our "engravings." Use `display-lg` (3.5rem) with wide letter-spacing (+0.05em) for hero moments. This font represents the permanent, the historical, and the authoritative.
*   **Body & Titles (Crimson Pro):** This is our "narrative." Crimson Pro provides an editorial, high-end feel that suggests depth of knowledge.
*   **The Hierarchy Strategy:** Large headlines should often be center-aligned to create a sense of ceremony. Body text should be generously leaded (line-height: 1.6) to ensure the dark background doesn't overwhelm the eye.

## 4. Elevation & Depth: Tonal Layering
In this system, shadows are not "dark blurs"; they are **Ambient Occlusion**.

*   **The Layering Principle:** Avoid the "Z-axis shadow" default. Instead, move an element "forward" by shifting its color from `surface` to `surface-bright`.
*   **Ambient Shadows:** If a floating element (like a dropdown) requires a shadow, use a large 40px blur with 10% opacity, tinted with `#452b00` (on-primary). This creates a "glow" of reflected gold light rather than a grey shadow.
*   **The Ghost Border:** For form inputs, we use the "Ghost Border"—the `outline-variant` (#514535) at 20% opacity. It provides a guide for the eye without interrupting the Obsidian Black flow.
*   **Filigree Glass:** For floating navigation, use a backdrop-blur (20px) combined with a 40% opaque `surface-container-highest`. This creates a "smoky quartz" effect that feels premium and custom.

## 5. Components

### Buttons: The Gold Standard
All buttons feature **0px border-radius**. No exceptions.
*   **Primary:** Solid `primary` (#ffb950) background with `on-primary` (#452b00) text. Bold, high-contrast, straight corners.
*   **Secondary:** `outline` (#9e8e7b) border (1px) with `primary` text. No background.
*   **Hover State:** Shift background to `primary-fixed` (#ffddb3) and add a 2px "inner glow" using a gold drop-shadow with 0 blur.

### Form Fields: The Gilded Frame
*   **Style:** Inputs are bottom-bordered only by default, using `primary` (#c8860a). 
*   **Focus State:** The border transitions to a full, 1px rectangular frame of `Muisca Gold`, and the label (using `label-md`) shifts to `primary` color.
*   **Error:** Use `error` (#ffb4ab) but maintain the straight-corner geometry.

### Cards & Lists: The Monoliths
*   **Forbid Dividers:** Never use a horizontal rule to separate list items. Use 32px of vertical white space or a subtle background shift to `surface-container-low`.
*   **Imagery:** All images should have a slight "stone" desaturation or a warm tint to align with the Terracotta and Gold palette.

### Signature Component: The "Filigree Divider"
Instead of a line, use a repeating geometric pattern (Muisca-inspired zig-zags or Zenú waves) at 10% opacity in `primary-container`. This acts as a thematic break between major narrative sections.

## 6. Do's and Don'ts

### Do:
*   **Embrace Asymmetry:** Place a small gold label far to the right of a large left-aligned headline to create a "curated" editorial look.
*   **Use High Contrast:** Ensure `on-background` text (#efe2c2) is bright enough against the Obsidian Black for AAA accessibility.
*   **Respect the Corner:** Maintain a strict 0px radius on every container, button, and input.

### Don't:
*   **No Softness:** Never use rounded corners (pills, circles). It breaks the "stone-carved" metaphor.
*   **No Pure Grey:** Never use #888888 or standard greys. Every neutral must be "warmed" with gold or terracotta undertones.
*   **No Standard Grids:** Avoid the "3-column card row" look. Offset your columns to make the layout feel like a bespoke magazine.