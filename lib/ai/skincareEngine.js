import products from "@/data/products.json";

// Natural Language Skincare Expert Engine
// Built for luxury dermatological consultation, exact product matching, and full clinical safety.

export function generateSkincareResponse({ userMessage, history = [], profile = {} }) {
  const query = (userMessage || "").toLowerCase();
  
  // Extract user profile facts
  const skinType = (profile?.skin_type || detectSkinType(query) || "combination").toLowerCase();
  const acneLevel = (profile?.acne_level || "none").toLowerCase();
  const allergies = (profile?.allergies || "").toLowerCase();
  const budget = (profile?.budget || "medium").toLowerCase();
  const isPregnantOrMedicated = (profile?.pregnancy_or_medication || "").toLowerCase() === "yes" ||
    /pregnant|pregnancy|nursing|breastfeeding|isotretinoin|accutane/.test(query);

  // Intent classification
  const isAcne = /acne|pimple|breakout|zit|whitehead|blackhead|blemish|cystic/.test(query);
  const isPigmentation = /dark spot|pigmentation|hyperpigmentation|melasma|tan|blemish mark|pih/.test(query);
  const isDullness = /dull|glow|brighten|radiance|tired skin|uneven tone/.test(query);
  const isDryOrDehydrated = /dry|peeling|flak|tight|dehydrat|parched/.test(query);
  const isOilyOrPores = /oily|greas|sebum|pore|large pore|shine|blackhead/.test(query);
  const isBarrierDamage = /burn|sting|sensiti|redness|barrier|irritat|inflam|compromised/.test(query);
  const isAging = /wrinkle|fine line|anti-aging|aging|elasticity|sagging|collagen/.test(query);
  const isDarkCircles = /dark circle|eye bag|under eye|puffiness/.test(query);
  const isRoutine = /routine|ritual|morning|night|am|pm|steps|start|regimen/.test(query);
  const isConflict = /mix|combine|layer|together|conflict|pair|safe with|with retinol|with vitamin c/.test(query);
  const isRetinol = /retinol|retinoid|tretinoin|bakuchiol/.test(query);
  const isVitaminC = /vitamin c|ascorbic/.test(query);
  const isSalicylic = /salicylic|bha/.test(query);
  const isNiacinamide = /niacinamide|vitamin b3/.test(query);
  const isSunscreen = /sunscreen|spf|sun protection|uv/.test(query);
  const isCleanser = /cleanser|face wash|wash|cleansing/.test(query);
  const isMoisturizer = /moisturizer|cream|gel|lotion|hydrat/.test(query);

  // Safety Gate: Pregnancy & Prescription
  if (isPregnantOrMedicated && (isRetinol || isSalicylic || /active|treatment/.test(query))) {
    return formatPregnancySafetyResponse(profile);
  }

  // Active Conflict Guidance
  if (isConflict) {
    return formatConflictResponse(query, skinType);
  }

  // Specific Active Breakdown
  if (isRetinol && !isAcne && !isPigmentation) {
    return formatIngredientDeepDive("Retinol", profile);
  }
  if (isVitaminC && !isPigmentation) {
    return formatIngredientDeepDive("Vitamin C", profile);
  }
  if (isSalicylic && !isAcne) {
    return formatIngredientDeepDive("Salicylic Acid", profile);
  }
  if (isNiacinamide) {
    return formatIngredientDeepDive("Niacinamide", profile);
  }

  // Concern Treatments
  if (isAcne) {
    return formatAcneResponse(skinType, budget, isPregnantOrMedicated, allergies);
  }
  if (isPigmentation) {
    return formatPigmentationResponse(skinType, budget, allergies);
  }
  if (isBarrierDamage) {
    return formatBarrierRepairResponse(skinType, budget);
  }
  if (isDullness) {
    return formatDullnessResponse(skinType, budget, allergies);
  }
  if (isAging) {
    return formatAgingResponse(skinType, budget, isPregnantOrMedicated);
  }
  if (isDryOrDehydrated) {
    return formatDrySkinResponse(skinType, budget);
  }
  if (isOilyOrPores) {
    return formatOilyPoresResponse(skinType, budget);
  }
  if (isDarkCircles) {
    return formatDarkCirclesResponse(skinType, budget);
  }
  if (isSunscreen) {
    return formatProductRecommendation("Sunscreen", skinType, budget);
  }
  if (isCleanser) {
    return formatProductRecommendation("Cleanser", skinType, budget);
  }
  if (isMoisturizer) {
    return formatProductRecommendation("Moisturizer", skinType, budget);
  }

  // General Routine Builder
  return formatComprehensiveRoutine(skinType, budget, profile);
}

function detectSkinType(q) {
  if (/oily/.test(q)) return "oily";
  if (/dry/.test(q)) return "dry";
  if (/combination|combo/.test(q)) return "combination";
  if (/sensitive/.test(q)) return "sensitive";
  if (/normal/.test(q)) return "normal";
  return null;
}

// ---------------- Response Builders ---------------- //

function formatAcneResponse(skinType, budget, isPregnant, allergies) {
  const cleanser = skinType === "sensitive" || skinType === "dry"
    ? "[Simple Kind to Skin Refreshing Facial Wash](/go/simple-face-wash)"
    : "[La Roche-Posay Effaclar Purifying Foaming Gel](/go/lrp-effaclar-gel)";
  
  const treatment = isPregnant
    ? "[Minimalist 5% Niacinamide Face Serum](/go/minimalist-niacinamide)"
    : "[Minimalist 2% Salicylic Acid Face Serum](/go/minimalist-salicylic-serum)";

  const moisturizer = "[Pond's Super Light Gel](/go/ponds-super-light-gel)";
  const sunscreen = "[Aqualogica Glow+ Dewy Sunscreen SPF 50 PA+++](/go/aqualogica-glow-sunscreen)";

  return `### What May Be Going On
Acne and breakouts generally stem from a confluence of excess sebum production, keratinized cell buildup blocking the follicular canal, and *C. acnes* colonization. In Indian humidity and urban environments, particulate pollution can further oxidize sebum, aggravating surface micro-inflammation.

### Targeted Ritual
* **Morning Protocol**:
  1. Cleanse gently with lukewarm water and ${cleanser}. Avoid hot water or abrasive physical scrubs.
  2. Apply 2-3 drops of ${treatment} on lightly damp skin to penetrate congested pores.
  3. Lock in lightweight hydration with a coin-sized amount of ${moisturizer}.
  4. Mandatory broad-spectrum sun defense with ${sunscreen}.
* **Evening Protocol**:
  1. Cleanse thoroughly to dissolve sun filters and sebum with ${cleanser}.
  2. Treat with ${treatment} (start 3 nights per week to monitor barrier tolerance).
  3. Hydrate with ${moisturizer}.

### Curated Product Recommendations
* **Purifying Cleanser**: ${cleanser} (Gentle surfactant base with Zinc to calm redness without stripping).
* **Blemish Active**: ${treatment} (Oil-soluble BHA that clears internal pore walls).
* **Non-Comedogenic Hydration**: ${moisturizer} (Oil-free hyaluronic gel that prevents dehydration-induced rebound oiliness).
* **Daily Defense**: ${sunscreen} (Weightless broad-spectrum protection that prevents inflammatory hyperpigmentation).

### Mindful Alternative & Home Care
* **Gentle Cold Compress**: Brew pure green tea, chill it in the refrigerator, and press gently over inflamed areas with a clean cotton pad. The natural epigallocatechin gallate (EGCG) calms acute redness.
* **Alternative**: Diluted honey mask (raw organic honey) left for 10 minutes provides natural osmotic, antimicrobial soothing.

### Actives Caution & Pairings
* Do **not** layer Salicylic Acid (BHA) with high-strength Retinol or pure Vitamin C on the same evening.
* If pimples are accompanied by deep, painful cystic lumps below the skin surface, do not attempt to squeeze or dry them out with multiple harsh actives.

*Not medical advice — consult a dermatologist for severe or persistent problems.*`;
}

function formatPigmentationResponse(skinType, budget, allergies) {
  const serum = "[Minimalist 2% Alpha Arbutin Face Serum](/go/minimalist-alpha-arbutin)";
  const altSerum = "[Minimalist 10% Vitamin C Face Serum](/go/minimalist-vitamin-c)";
  const sunscreen = "[La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF 50+](/go/lrp-anthelios-uvmue)";
  const cleanser = "[Simple Kind to Skin Refreshing Facial Wash](/go/simple-face-wash)";
  const moisturizer = "[Pond's Super Light Gel](/go/ponds-super-light-gel)";

  return `### What May Be Going On
Dark spots and hyperpigmentation (often Post-Inflammatory Hyperpigmentation or solar lentigines) occur when melanocytes overproduce melanin following UV exposure or localized inflammation (such as healed breakouts). Without diligent daily UV protection, existing spots darken rapidly.

### Targeted Ritual
* **Morning Protocol**:
  1. Refresh skin with ${cleanser}.
  2. Apply 3-4 drops of ${altSerum} to neutralize daily oxidative stress and brighten tone.
  3. Follow with ${moisturizer}.
  4. Apply generous coverage (two finger lengths) of ${sunscreen}.
* **Evening Protocol**:
  1. Cleanse thoroughly with ${cleanser}.
  2. Apply ${serum} directly to clean, dry skin to inhibit tyrosinase activity.
  3. Hydrate and seal barrier with ${moisturizer}.

### Curated Product Recommendations
* **Targeted Pigmentation Corrector**: ${serum} (Formulated with pure Alpha Arbutin & Hyaluronic acid for safe, steady spot fading).
* **Antioxidant Brightener**: ${altSerum} (Stable ethyl ascorbic acid to fade stubborn marks and boost collagen).
* **Ultra-UVA Protection**: ${sunscreen} (Equipped with Mexoryl 400 to shield against long-range UV rays responsible for deep pigment).

### Mindful Alternative & Home Care
* **Saffron & Milk Compress**: A few strands of pure saffron infused in 2 tablespoons of cool milk, pressed gently with cotton onto spots, provides traditional mild carotenoid brightness.
* **Cheaper Alternative**: [The Derma Co 2% Alpha Arbutin + Kojic Acid Serum](/go/derma-co-alpha-arbutin).

### Actives Caution & Pairings
* Always wear broad-spectrum SPF 50 daily. Pigmentation treatments are ineffective if skin is exposed to unshielded sunlight.
* Introduce Alpha Arbutin and Vitamin C on alternating schedules if your skin is reactive.

*Not medical advice — consult a dermatologist for severe or persistent problems.*`;
}

function formatBarrierRepairResponse(skinType, budget) {
  const cream = "[CeraVe Moisturising Cream](/go/cerave-moisturising-cream)";
  const cleanser = "[Simple Kind to Skin Refreshing Facial Wash](/go/simple-face-wash)";
  const serum = "[Plum 2% Hyaluronic Acid Serum with Korean Orchid](/go/plum-hyaluronic)";

  return `### What May Be Going On
A compromised stratum corneum (damaged skin barrier) manifests as burning when applying mild moisturizers, tightness, visible erythema (redness), and micro-flaking. It is frequently caused by over-exfoliation (stacking BHA/AHA), high-strength retinoid misuse, or harsh foaming detergents.

### Targeted Ritual
* **Immediate Reset Protocol**:
  * **Halt All Actives**: Completely pause Retinol, AHA, BHA, Benzoyl Peroxide, and pure Vitamin C for at least 14 days.
  * **Morning**: Rinse with cool water (or a pea-sized amount of ${cleanser}) $\\rightarrow$ Apply ${serum} on damp skin $\\rightarrow$ Generous layer of ${cream} $\\rightarrow$ Gentle mineral sunscreen.
  * **Evening**: Wash with ${cleanser} $\\rightarrow$ Slather ${cream} while skin is still slightly moist to seal essential physiological lipids.

### Curated Product Recommendations
* **Physiological Lipid Restorative**: ${cream} (Loaded with 3 essential skin-identical ceramides, cholesterol, and hyaluronic acid with MVE continuous release).
* **Ultra-Gentle Cleanser**: ${cleanser} (100% soap-free and enriched with Pro-Vitamin B5 and Glycerin).
* **Hydration Reservoir**: ${serum} (Infuses moisture into parched epidermis without causing irritation).

### Mindful Alternative & Home Care
* **Pure Colloidal Oat Compress**: Finely ground pure oats steeped in warm water create a soothing milky bath. Pressing this liquid over irritated skin restores beta-glucans and reduces inflammatory cytokines immediately.

### Actives Caution & Pairings
* Do **not** use hot water on your face.
* Avoid scented facial wipes, astringent toners, or alcohol-based sunscreens until stinging completely subsides.

*Not medical advice — consult a dermatologist for severe or persistent problems.*`;
}

function formatDullnessResponse(skinType, budget, allergies) {
  const vitC = "[Minimalist 10% Vitamin C Face Serum](/go/minimalist-vitamin-c)";
  const niacinamide = "[Minimalist 5% Niacinamide Face Serum](/go/minimalist-niacinamide)";
  const sunscreen = "[Aqualogica Glow+ Dewy Sunscreen SPF 50 PA+++](/go/aqualogica-glow-sunscreen)";
  const moisturizer = "[Pond's Super Light Gel](/go/ponds-super-light-gel)";

  return `### What May Be Going On
Skin dullness is commonly caused by surface desquamation slowdown (dead keratinocyte buildup), chronic sub-clinical dehydration, and free-radical pollution exposure that oxidizes surface lipids.

### Targeted Ritual
* **Morning**:
  1. Refresh skin with a gentle wash.
  2. Press 3-4 drops of ${vitC} onto face and neck.
  3. Hydrate with ${moisturizer}.
  4. Apply ${sunscreen} for a naturally radiant, dewy finish.
* **Evening**:
  1. Cleanse thoroughly.
  2. Apply ${niacinamide} to strengthen cellular energy and refine texture.
  3. Seal with ${moisturizer}.

### Curated Product Recommendations
* **Luminosity Active**: ${vitC} (Stabilized with ferulic acid to reverse environmental dullness).
* **Texture & Tone Refiner**: ${niacinamide} (Balances oil and evens blotchy tone).
* **Dewy Daily Defense**: ${sunscreen} (Hydrating sunscreen with Vitamin C and papaya extract for immediate radiance).

### Mindful Alternative & Home Care
* **Chilled Cucumber Mist**: Pure strained cucumber juice misted onto freshly washed skin provides natural ascorbic acid and silica for instant revitalizing glow.

*Not medical advice — consult a dermatologist for severe or persistent problems.*`;
}

function formatAgingResponse(skinType, budget, isPregnant) {
  if (isPregnant) {
    return formatPregnancySafetyResponse({ note: "Retinoids are strictly avoided during pregnancy." });
  }

  const retinol = "[Minimalist 0.3% Retinol Face Serum](/go/minimalist-retinol)";
  const cream = "[CeraVe Moisturising Cream](/go/cerave-moisturising-cream)";
  const sunscreen = "[La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF 50+](/go/lrp-anthelios-uvmue)";

  return `### What May Be Going On
Chronological aging coupled with photo-aging (UV-induced collagen degradation) slows epidermal turnover and reduces dermal hyaluronic acid synthesis, leading to fine expression lines, textural changes, and loss of rebound firmness.

### Targeted Ritual
* **Morning**:
  1. Gentle cleanse $\\rightarrow$ Hydrate $\\rightarrow$ Generous broad-spectrum sun protection with ${sunscreen} (90% of premature aging is UV-induced).
* **Evening**:
  1. Wash and let face dry thoroughly for 5 minutes.
  2. Apply 2-3 drops of ${retinol} using the "sandwich technique" (Moisturizer $\\rightarrow$ Retinol $\\rightarrow$ Moisturizer) if your skin is new to retinoids.
  3. Seal with barrier-reinforcing ${cream}.

### Curated Product Recommendations
* **Gold-Standard Renewal**: ${retinol} (Pure 0.3% retinol suspended in squalane to accelerate cell turnover and stimulate pro-collagen).
* **Barrier Lipid Reinforcement**: ${cream} (Essential ceramides to prevent retinoid-induced transepidermal water loss).
* **Photoprotection Barrier**: ${sunscreen} (Protects deep dermal matrix from elastosis).

### Actives Caution & Pairings
* Never use Retinol and AHA/BHA exfoliants on the same night.
* Retinoids make the skin photosensitive — high SPF is non-negotiable every morning.

*Not medical advice — consult a dermatologist for severe or persistent problems.*`;
}

function formatDrySkinResponse(skinType, budget) {
  const cream = "[CeraVe Moisturising Cream](/go/cerave-moisturising-cream)";
  const ha = "[Plum 2% Hyaluronic Acid Serum with Korean Orchid](/go/plum-hyaluronic)";
  const wash = "[Simple Kind to Skin Refreshing Facial Wash](/go/simple-face-wash)";

  return `### What May Be Going On
Dry skin lacks adequate natural lipids (ceramides, free fatty acids, and cholesterol), leading to micro-fissuring of the stratum corneum, rapid water evaporation, and increased environmental sensitivity.

### Targeted Ritual
* **Morning**: Cleanse with lukewarm water $\\rightarrow$ Pat ${ha} onto damp skin $\\rightarrow$ Lock in with ${cream}.
* **Evening**: Gentle wash with ${wash} $\\rightarrow$ ${ha} $\\rightarrow$ Generous layer of ${cream}.

### Curated Product Recommendations
* **Ceramide Rich Cream**: ${cream}
* **Intense Hydrating Serum**: ${ha}
* **Sulfate-Free Cleanser**: ${wash}

### Mindful Alternative & Home Care
* Apply pure plant squalane or cold-pressed sweet almond oil as the very final step before bed to create an emollient occlusive veil.

*Not medical advice — consult a dermatologist for severe or persistent problems.*`;
}

function formatOilyPoresResponse(skinType, budget) {
  const wash = "[La Roche-Posay Effaclar Purifying Foaming Gel](/go/lrp-effaclar-gel)";
  const serum = "[Minimalist 2% Salicylic Acid Face Serum](/go/minimalist-salicylic-serum)";
  const gel = "[Pond's Super Light Gel](/go/ponds-super-light-gel)";

  return `### What May Be Going On
Enlarged pore appearance is caused by trapped sebum oxidized by exposure to air (forming blackheads), loss of surrounding peripore collagen elasticity, and sebaceous gland hyperactivity in warm, humid climates.

### Targeted Ritual
* **Morning**: Cleanse with ${wash} $\\rightarrow$ Lightweight hydration with ${gel} $\\rightarrow$ Matte broad-spectrum sunscreen.
* **Evening**: Cleanse with ${wash} $\\rightarrow$ Apply ${serum} focused on T-zone and nose $\\rightarrow$ Hydrate with ${gel}.

### Curated Product Recommendations
* **Purifying Cleanser**: ${wash}
* **Pore Clearing Active**: ${serum}
* **Water-Light Moisturizer**: ${gel}

*Not medical advice — consult a dermatologist for severe or persistent problems.*`;
}

function formatDarkCirclesResponse(skinType, budget) {
  const moisturizer = "[CeraVe Moisturising Cream](/go/cerave-moisturising-cream)";
  const sunscreen = "[La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF 50+](/go/lrp-anthelios-uvmue)";

  return `### What May Be Going On
Under-eye darkness is multifactorial: thin periorbital skin showing underlying venous pooling, hyperpigmentation from rubbing or sun, and hollow shadows due to orbital bone structure or volume loss.

### Targeted Ritual
* Keep the periorbital area deeply hydrated with ${moisturizer}.
* Extend ${sunscreen} up to the orbital bone daily to prevent UV darkening.
* Avoid vigorous eye-rubbing which triggers micro-inflammatory hyperpigmentation.

### Mindful Home Care
* Chilled green tea bags rested over closed eyes for 8 minutes leverage caffeine and theophylline to constrict superficial capillaries and drain stagnant lymph.

*Not medical advice — consult a dermatologist for severe or persistent problems.*`;
}

function formatProductRecommendation(category, skinType, budget) {
  const matches = products.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
  const top = matches.slice(0, 3);

  const productList = top.map(p => `* **[${p.name}](/go/${p.id})** (₹${p.price_inr}) — Formulated with ${p.key_ingredients.join(", ")}. Suitable for ${p.suitable_skin_types.join(", ")} skin.`).join("\n");

  return `### Curated ${category} Guidance
For **${skinType} skin**, here are the most balanced, clinically sound formulations from the Twacha catalogue:

${productList}

### How to Select
* Choose based on your primary tolerance: for sensitive barriers, prioritize fragrance-free options.
* Apply after cleansing and lighter water-based serums.

*Not medical advice — consult a dermatologist for severe or persistent problems.*`;
}

function formatConflictResponse(query, skinType) {
  let pairNotice = "";
  if (/retinol.*bha|bha.*retinol|retinol.*salicylic|salicylic.*retinol/.test(query)) {
    pairNotice = "**Retinol + Salicylic Acid (BHA)**: Do NOT use in the exact same application. Using both simultaneously causes severe barrier breakdown, excessive peeling, and dermatitis. Use Salicylic Acid in the morning (or on alternate nights), and Retinol in the evening.";
  } else if (/retinol.*aha|aha.*retinol|retinol.*glycolic|glycolic.*retinol/.test(query)) {
    pairNotice = "**Retinol + Glycolic/Lactic Acid (AHA)**: High irritation risk. Cycle them on alternate nights (e.g., Retinol on Monday/Wednesday, AHA on Friday).";
  } else if (/retinol.*benzoyl|benzoyl.*retinol/.test(query)) {
    pairNotice = "**Retinol + Benzoyl Peroxide**: Benzoyl Peroxide can oxidize and deactivate traditional pure retinol while causing extreme dryness. Use Benzoyl Peroxide in the AM and Retinol in the PM.";
  } else if (/vitamin c.*niacinamide|niacinamide.*vitamin c/.test(query)) {
    pairNotice = "**Vitamin C + Niacinamide**: Modern derivatives can be layered safely! However, if you have reactive skin, apply Vitamin C in the morning for antioxidant shield, and Niacinamide in the evening.";
  } else {
    pairNotice = "**General Compatibility Rule**: Never layer two potent exfoliating acids (AHA + BHA) with Retinoids at the same time. Always cushion active serums with barrier ceramides like [CeraVe Moisturising Cream](/go/cerave-moisturising-cream).";
  }

  return `### Active Ingredient Compatibility Assessment
${pairNotice}

### Golden Rules of Layering
1. **Thin to Thick**: Water-based serums first $\\rightarrow$ Active treatment $\\rightarrow$ Emulsion/Cream $\\rightarrow$ Sunscreen (AM).
2. **Skin Cycling**: Dedicate night 1 to Exfoliation, night 2 to Retinoid, and nights 3 & 4 to pure barrier recovery with Ceramides.
3. **Always Wear Sunscreen**: Actives accelerate cell turnover, leaving fresh epidermal cells vulnerable to photo-damage. Protect with [La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF 50+](/go/lrp-anthelios-uvmue).

*Not medical advice — consult a dermatologist for severe or persistent problems.*`;
}

function formatIngredientDeepDive(ingredient, profile) {
  if (ingredient === "Retinol") {
    return `### Understanding Retinol (Vitamin A)
Retinol is the gold-standard dermatological active for cellular renewal, micro-comedone prevention, and pro-collagen stimulation.

### How to Introduce Safely
* **Frequency**: Start with just 2 nights per week for the first fortnight. Gradually increase to alternate nights as skin builds tolerance.
* **The Sandwich Technique**: Apply a thin veil of moisturizer $\\rightarrow$ 2-3 drops of [Minimalist 0.3% Retinol Face Serum](/go/minimalist-retinol) $\\rightarrow$ Second layer of [CeraVe Moisturising Cream](/go/cerave-moisturising-cream).
* **Contraindications**: Strictly avoid during pregnancy or nursing. Never apply without daily broad-spectrum SPF.

*Not medical advice — consult a dermatologist for severe or persistent problems.*`;
  }

  if (ingredient === "Vitamin C") {
    return `### Understanding Vitamin C (L-Ascorbic & Ethyl Ascorbic Acid)
Vitamin C is a potent antioxidant that neutralizes environmental reactive oxygen species (ROS), suppresses excess melanogenesis, and brightens overall tone.

### How to Use
* **Timing**: Best applied in the morning directly after cleansing.
* **Recommended Formulation**: [Minimalist 10% Vitamin C Face Serum](/go/minimalist-vitamin-c) (Stabilized with ferulic acid for non-irritating, sustained radiance).
* **Pair With**: Always lock with daily broad-spectrum sunscreen like [Aqualogica Glow+ Dewy Sunscreen SPF 50 PA+++](/go/aqualogica-glow-sunscreen).

*Not medical advice — consult a dermatologist for severe or persistent problems.*`;
  }

  return `### Active Ingredient Guidance
Actives work best when respected with patience and diligent barrier cushioning. Introduce one active at a time to monitor your skin's response.

*Not medical advice — consult a dermatologist for severe or persistent problems.*`;
}

function formatPregnancySafetyResponse(profile) {
  return `### Mindful Safety Notice: Pregnancy & Sensitive Care
When pregnant, nursing, or using medical dermatological prescriptions, certain active compounds cross the barrier or pose clinical contraindications.

### Ingredients to Strictly Avoid
* **Retinoids / Retinol / Tretinoin / Adapalene**: Teratogenic risks — pause completely.
* **High-Strength Salicylic Acid (BHA)**: Avoid oral or leave-on peels above 2%.
* **Hydroquinone**: Pause until after nursing.

### Safe & Calming Alternatives
* **Gentle Barrier Wash**: [Simple Kind to Skin Refreshing Facial Wash](/go/simple-face-wash).
* **Safe Tone & Barrier Balancing**: [Minimalist 5% Niacinamide Face Serum](/go/minimalist-niacinamide).
* **Deep Non-Comedogenic Hydration**: [CeraVe Moisturising Cream](/go/cerave-moisturising-cream).
* **Daily UV Shield**: [La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF 50+](/go/lrp-anthelios-uvmue).

*Not medical advice — consult your OB-GYN and dermatologist for personal medical confirmation.*`;
}

function formatComprehensiveRoutine(skinType, budget, profile) {
  const cleanser = skinType === "oily"
    ? "[La Roche-Posay Effaclar Purifying Foaming Gel](/go/lrp-effaclar-gel)"
    : "[Simple Kind to Skin Refreshing Facial Wash](/go/simple-face-wash)";
  
  const moisturizer = skinType === "dry"
    ? "[CeraVe Moisturising Cream](/go/cerave-moisturising-cream)"
    : "[Pond's Super Light Gel](/go/ponds-super-light-gel)";

  const sunscreen = "[Aqualogica Glow+ Dewy Sunscreen SPF 50 PA+++](/go/aqualogica-glow-sunscreen)";

  return `### Personalized Skincare Ritual for ${skinType.toUpperCase()} Skin
Based on your profile, here is a balanced, minimalist ritual focused on barrier health, climate resilience, and balanced sebum control:

### Morning Protocol (Protect & Hydrate)
1. **Cleanse**: Wash with ${cleanser} to rinse nocturnal sebum without stripping skin lipids.
2. **Hydrate**: Apply ${moisturizer} on slightly damp skin to seal in moisture.
3. **Protect**: Apply two finger lengths of ${sunscreen}. Reapply before intense outdoor exposure.

### Evening Protocol (Restore & Repair)
1. **Purify**: Cleanse thoroughly with ${cleanser} to remove accumulated dust and UV filters.
2. **Replenish**: Generously apply ${moisturizer} to facilitate skin's natural nocturnal cell turnover and barrier repair.

### Curated Essentials
* **Cleanser**: ${cleanser}
* **Moisturizer**: ${moisturizer}
* **Sunscreen**: ${sunscreen}

*Not medical advice — consult a dermatologist for severe or persistent problems.*`;
}
