# SUBJECTS — PRODUCTION-GRADE GENERATION PROMPTS

These are compositing-first subject assets. Every prompt is self-contained and must be executed as an independent asset. Preserve the specified silhouette, camera orientation, material realism, edge quality, negative space, and alpha behavior. Do not merge multiple subjects into one generated image.

## `planet-fitness-entrance.png`
Beat 00:00–00:40 · P0 · PNG 2048×1152 · REAL ALPHA

**Role:** Hero foreground cutout that enters over `bg_empty_gym_4am.jpg` near the end of the cold open. It should read instantly as a commercial budget-gym exterior while remaining easy to composite.

**Master prompt:** Create a photorealistic editorial cutout of a recognizable Planet Fitness-style gym storefront entrance at night, viewed from a slightly low three-quarter angle from the parking-lot side. Show a compact American strip-mall fitness club facade with glass double entrance doors, a simple rectangular canopy, purple architectural panels, restrained yellow brand accents, illuminated interior visible through the glass, realistic parking-lot reflections, subtle condensation on glass, clean commercial construction, believable sign proportions, and natural late-night fluorescent spill from the interior. Keep the storefront centered but not oversized, with the entrance occupying roughly the middle 55% of the canvas and enough transparent margin around the complete building silhouette for motion scale-up. Lighting must feel like real late-night commercial photography: cool ambient blue-gray exterior, slightly warmer interior light, soft shadow falloff, no HDR halos, no artificial glow. Camera language: full-frame editorial still, approximately 35mm equivalent, eye level slightly below the sign, straight verticals, moderate depth of field, realistic perspective. Materials must read physically: painted masonry, powder-coated metal, glass, rubber door seals, wet asphalt reflections. Cut the entire storefront cleanly from the environment with a true alpha channel. Preserve every edge of the building, canopy and door frame; no cropped roof, no cut-off entrance, no floating fragments. Keep the background completely transparent, not white, gray, checkerboard, or blurred. Final image should look like a real photograph prepared by a professional compositor, not an illustration or 3D render.

**Negative:** cartoon, vector art, flat illustration, painterly look, game asset, plastic CGI, fake perspective, fisheye, warped architecture, tilted verticals, extra doors, duplicate signage, random people, cars overlapping the storefront, invented readable advertising copy, gibberish text, fake QR codes, excessive bloom, neon glow, clipped roof, clipped doorway, white matte, gray matte, checkerboard baked into pixels, halo, fringe, color spill, watermark.

**Continuity:** Match the purple/yellow visual family of the official logo asset; keep lighting compatible with `bg_empty_gym_4am.jpg` so the storefront can be placed over that background without looking pasted on.

**QA:** Full storefront visible; clean alpha; no background pixels; no object clipping; no logo mutation; realistic signage geometry; 10%–15% transparent padding around the silhouette.

## `planet-fitness-membership-card.png`
Beat 00:20–00:35 · P1 · PNG 2048×1152 · REAL ALPHA

**Role:** Physical object insert representing a recurring gym membership and giving the editor a tactile cutaway after the ratio calculation.

**Master prompt:** Create a premium editorial product photograph of a generic Planet Fitness-style membership card isolated on a fully transparent background. The card is a real-world PVC membership card, approximately standard bank-card proportions, viewed in a slight three-quarter perspective with the top edge angled subtly away from camera. Use a matte-to-semi-gloss purple plastic body with restrained yellow branding accents and a simple gym-membership visual hierarchy. Include a believable blank photo or identity area and simple blank fields that can later receive renderer-owned text, but do not invent personal information. Show realistic 0.76mm card thickness, slightly chamfered edges, micro-scratches from ordinary handling, soft edge highlights, and a faint satin reflection from a large studio softbox. The lighting should be premium commercial product photography with one broad key from upper left, weaker fill from lower right, and a very subtle rim along the top edge. Camera approximately 85mm equivalent macro/product lens, shallow but controlled depth of field so the entire card face remains readable. Center the card with generous transparent breathing room and a slight shadow-free lift from the imaginary surface. The card must be physically plausible and completely isolated for compositing.

**Negative:** invented QR code, fake member barcode, readable personal name, address, photograph of a real person, childish plastic toy look, excessive gloss, warped corners, bent card, floating second card, background surface, cast shadow touching a background, white matte, gray matte, checkerboard pixels, watermark.

**QA:** Real alpha; one card only; full card visible; no clipped edges; correct rectangular proportions; clean text-safe blank areas.

## `photoshop-cs6-box.png`
Beat 06:30–07:10 · P0 · PNG 2048×2048 · REAL ALPHA

**Role:** Hero object for the ownership-to-subscription reversal. It needs to feel like a physical early-2010s retail product that could genuinely sit on a desk.

**Master prompt:** Create an authentic-looking early-2010s boxed desktop creative-software retail package, inspired by the physical retail era of Photoshop CS6, isolated on a transparent background. Show a rigid white cardboard software box with a restrained dark-gray and Adobe-red graphic treatment, period-appropriate product imagery, a visible side panel, and a partially visible disc case nested inside or slightly revealed from an opened flap. Use realistic commercial packaging proportions, correct cardboard thickness, slight corner compression from store handling, tiny scuffs on the shrink-wrap, realistic gloss where plastic wrap catches the key light, subtle fingerprints and micro-abrasions, and a believable printed-paper texture. The box should be photographed from a three-quarter front-left angle, approximately 50–70mm equivalent product lens, camera slightly above object center so the front face and one side panel are visible. Use a soft studio key from upper left, neutral fill from right, and a controlled edge highlight on the top edge. Color palette: off-white cardboard, charcoal text areas, restrained period Adobe red, neutral skin-tone or software-art imagery only if visible on packaging. No modern SaaS dashboard on the box. Leave generous transparent padding around the entire package silhouette. The alpha must be real and continuous around every corner, fold, shrink-wrap edge, and protruding disc case.

**Negative:** modern Creative Cloud box art, futuristic interface, current subscription UI, 3D cartoon, toy packaging, fake serial numbers, gibberish typography, extra boxes, duplicate discs, melted edges, impossible perspective, plastic CGI, white matte, background table, hard cast shadow outside the object, watermark.

**QA:** One complete retail package; no clipped corners; believable period styling; clean alpha; consistent upper-left key light; readable object silhouette from thumbnail size.

## `photoshop-cs6-disc.png`
Beat 06:40–07:05 · P1 · PNG 2048×2048 · REAL ALPHA

**Role:** Macro physical detail that makes the old ownership model tangible.

**Master prompt:** Create a single pressed early-2010s desktop-software installation DVD isolated against real transparency. The disc is a physically believable 12cm optical disc with a metallic silver surface, restrained period software branding ring, center hub, laser-etched concentric rings, tiny authentic manufacturing imperfections, and realistic micro-scratches from handling. Position the disc at a slight 15-degree tilt so a broad circular highlight reveals the reflective substrate without obscuring the printed ring. Camera approximately 70–100mm macro equivalent, centered, no dramatic perspective distortion. Studio lighting: large soft key from upper left, narrow rim from right, dark neutral reflection controlled within the disc surface. Materials must read as real polycarbonate and printed ink, not chrome CGI. Keep the complete circular silhouette visible with generous transparent margin. No table, no jewel case, no hand, no background.

**Negative:** futuristic optical disc, blue glowing hologram, floating particles, multiple discs, broken disc, warped circle, rainbow CGI reflection, unreadable fake serial text, white matte, background, watermark.

**QA:** True alpha; one intact disc; circular geometry perfect; full disc visible; no crop.

## `generic-smartphone-subscription.png`
Beat 00:40–01:35 · P0 · PNG 2048×2048 · REAL ALPHA

**Role:** Hero device that represents recurring subscription payments without pretending to be a real bank or a specific smartphone manufacturer.

**Master prompt:** Create a premium contemporary smartphone isolated on a transparent background, shown nearly front-on with a slight three-quarter turn of approximately 6–8 degrees. Use a modern generic high-end handset with dark anodized metal frame, black glass front, extremely thin bezels, rounded corners, and a realistic camera bump barely visible along the rear edge. The screen shows a believable subscription-management dashboard composed of clean cards, toggles, small recurring-amount rows, and simple payment icons; the body text must remain intentionally abstract or renderer-safe rather than generated as factual copy. The screen should communicate “many small recurring charges” at a glance. Use physically accurate glass reflections, subtle fingerprint traces, mild anti-reflective coating, and realistic screen luminance. Camera approximately 65mm equivalent product lens, centered, slightly above horizon, enough depth of field to keep the full phone sharp. Lighting: large cool key from upper left, faint warm edge from lower right, controlled reflection strip across the glass. Isolate completely with real alpha and generous padding on all sides. No hand, no charging cable, no desk, no brand logo.

**Negative:** exact Apple clone, exact Samsung clone, invented brand logo, fake readable bank data, gibberish paragraphs, neon sci-fi UI, holographic projection, multiple phones, bent frame, melted glass, broken screen, white background, gray background, reflection of a room, cast shadow outside object, watermark.

**QA:** Full device visible; screen readable at thumbnail scale; realistic materials; true alpha; no background pixels.

## `prime-membership-card.png`
Beat 13:30–15:00 · P1 · PNG 2048×2048 · REAL ALPHA

**Role:** Physical Prime membership token for the Amazon cancellation chapter.

**Master prompt:** Create a premium Amazon Prime-style membership card/token isolated against a fully transparent background. Use a deep navy-blue card body with restrained Prime-blue accent, subtle matte laminate texture, clean premium print finishing, realistic edge thickness, tiny surface wear, and a simple centered membership identity treatment without inventing a card number, barcode, QR code, or user name. Present the card at a gentle three-quarter angle, approximately 70–85mm equivalent product lens, with the long axis slightly tilted upward. Lighting should be controlled commercial product photography: broad soft key from upper left, faint cool rim on right edge, soft specular highlight moving across the laminate. No hand, no desk, no wallet. Maintain realistic card proportions and physical weight. Isolate with generous transparent padding and no shadow painted into the background.

**Negative:** fake payment details, invented member identity, fake QR, distorted Amazon/Prime lettering, bright electric-blue glow, plastic toy appearance, warped corners, duplicate cards, background surface, white matte, watermark.

**QA:** One card; correct physical proportions; official-style but not invented membership data; true alpha.

## `subscription-envelope-stack.png`
Beat 17:35–18:30 · P1 · PNG 2048×2048 · REAL ALPHA

**Role:** Tactile end-section object showing the accumulation of recurring bills.

**Master prompt:** Create a realistic editorial still-life cutout of a small uneven stack of recurring-bill envelopes, receipts, and folded subscription statements isolated on a transparent background. Use off-white paper with visible cellulose fibers, realistic fold creases, slightly bent corners, different paper weights, tiny staple and paperclip details, and a few understated billing dates that are not tied to real people or accounts. One envelope should be slightly open, revealing a blank statement inside. Arrange the stack with a natural desk-document disorder rather than a perfect retail pile. Camera approximately 60–75mm equivalent, three-quarter overhead angle, medium close-up, with enough depth of field that most of the stack remains sharp. Light from upper left like a documentary tabletop shoot, warm neutral paper highlights, slightly cooler shadow edges. No desk surface; only the physical paper objects. True alpha around every sheet, including gaps between pages and the open envelope.

**Negative:** readable fake account numbers, real bank logo, branded utility bills, money flying, cartoon paper, perfect geometric stack, duplicate pages, white background, gray background, heavy vignette, glued pages, watermark.

**QA:** Independent pages remain visually separable; true alpha; realistic paper texture; no clipped corners.

## `anonymous-gym-member.png`
Beat 00:25–00:40 · P2 · PNG 2048×2048 · REAL ALPHA

**Role:** Small distant person layered into the empty gym to create the central contradiction: a huge membership base with almost no visible occupancy.

**Master prompt:** Create a realistic adult gym member in plain dark workout clothing as a full-body isolated cutout, designed to be rendered small inside the wide gym background. The person is viewed from the back and slightly from camera-left in a natural walking-to-treadmill posture, carrying a simple black gym bag in one hand. Face must remain completely invisible; no identifiable facial features. Clothing: dark charcoal athletic hoodie or lightweight jacket, black shorts or tapered training pants, neutral running shoes. Anatomically correct proportions, natural posture, realistic fabric folds, subtle hair and skin detail on exposed limbs. Lighting should mimic cold 4 a.m. fluorescent gym lighting with a soft cool rim along shoulders and legs, low contrast on the front-facing surfaces. Camera approximately 70mm equivalent portrait lens, but subject full-body and isolated. Keep the figure vertical, centered, and slightly smaller within a square canvas with generous transparent padding. No treadmill, no gym equipment, no visible environment, no brand marks.

**Negative:** identifiable celebrity, recognizable face, smiling portrait, fashion editorial pose, exaggerated muscles, bodybuilding physique, cartoon proportions, extra limbs, extra fingers, floating bag, duplicate person, gym background, white matte, gray matte, halo, watermark.

**QA:** Full body visible; natural silhouette; true alpha; no environment; designed to survive heavy downscaling to a tiny distant figure.