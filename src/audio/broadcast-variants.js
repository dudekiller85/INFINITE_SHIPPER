/**
 * Broadcast Variant Libraries
 *
 * Contains variant templates for introduction and time period announcements.
 * Provides weighted random selection to ensure variety while maintaining authenticity.
 *
 * Based on specs/003-broadcast-structure/research.md RQ-004, RQ-005
 * Implements FR-005, FR-006, FR-007 (introduction), FR-017 (time periods)
 *
 * @see /specs/003-broadcast-structure/spec.md
 * @see /specs/003-broadcast-structure/data-model.md
 */

/**
 * Introduction Variants (20+ templates)
 *
 * Standard variants (weight 2, ~60% frequency):
 * - Use Met Office attribution
 * - Formal BBC style
 *
 * Surreal variants (weight 1, ~40% frequency):
 * - Alternative authorities
 * - Temporal ambiguities
 * - Must maintain 80%+ "unsettling but plausible" threshold (SC-012)
 */
export const INTRODUCTION_VARIANTS = [
  // ========== STANDARD VARIANTS (12 variants, weight 2 each, ~60% frequency) ==========

  {
    id: 'std-001',
    isSurreal: false,
    authorityTemplate: 'the Met Office on behalf of the Maritime and Coastguard Agency',
    template: 'And now the shipping forecast, issued by {authority} at {time} {date}',
    weight: 2
  },

  {
    id: 'std-002',
    isSurreal: false,
    authorityTemplate: 'the Met Office on behalf of the Maritime and Coastguard Agency',
    template: 'The shipping forecast, issued by {authority} at {time} {date}',
    weight: 2
  },

  {
    id: 'std-003',
    isSurreal: false,
    authorityTemplate: 'the Met Office for the Maritime and Coastguard Agency',
    template: 'And now the shipping forecast, issued by {authority} at {time} {date}',
    weight: 2
  },

  {
    id: 'std-004',
    isSurreal: false,
    authorityTemplate: 'the Met Office',
    template:
      'And now the shipping forecast, issued by {authority} on behalf of the Maritime and Coastguard Agency at {time} {date}',
    weight: 2
  },

  {
    id: 'std-005',
    isSurreal: false,
    authorityTemplate: 'the Met Office',
    template: 'The shipping forecast for {date}, issued by {authority} at {time}',
    weight: 2
  },

  {
    id: 'std-006',
    isSurreal: false,
    authorityTemplate: 'the Meteorological Office on behalf of the Maritime and Coastguard Agency',
    template: 'And now the shipping forecast, issued by {authority} at {time} {date}',
    weight: 2
  },

  {
    id: 'std-007',
    isSurreal: false,
    authorityTemplate: 'the Met Office',
    template:
      'And now the shipping forecast. Issued by {authority} on behalf of the Maritime and Coastguard Agency at {time} {date}',
    weight: 2
  },

  {
    id: 'std-008',
    isSurreal: false,
    authorityTemplate: 'the Met Office on behalf of the Maritime and Coastguard Agency',
    template: 'The shipping forecast issued at {time} {date} by {authority}',
    weight: 2
  },

  {
    id: 'std-009',
    isSurreal: false,
    authorityTemplate: 'the Met Office',
    template:
      'And now the shipping forecast for mariners. Issued by {authority} on behalf of the Maritime and Coastguard Agency at {time} {date}',
    weight: 2
  },

  {
    id: 'std-010',
    isSurreal: false,
    authorityTemplate: 'the Met Office on behalf of the Maritime and Coastguard Agency',
    template: 'And now, the shipping forecast. Issued by {authority} at {time} {date}',
    weight: 2
  },

  {
    id: 'std-011',
    isSurreal: false,
    authorityTemplate: 'the Met Office for Her Majesty\'s Coastguard',
    template: 'And now the shipping forecast, issued by {authority} at {time} {date}',
    weight: 2
  },

  {
    id: 'std-012',
    isSurreal: false,
    authorityTemplate: 'the Meteorological Office',
    template:
      'The shipping forecast for {date}. Issued by {authority} on behalf of the Maritime and Coastguard Agency at {time}',
    weight: 2
  },

  // ========== SURREAL VARIANTS (8 variants, weight 1 each, ~40% frequency) ==========
  // Must maintain 80%+ "unsettling but plausible" threshold (SC-012)
  // Alternative authorities and temporal ambiguities per research.md RQ-004

  {
    id: 'sur-001',
    isSurreal: true,
    authorityTemplate: 'the Department of Quiet Waters',
    template: 'And now the shipping forecast, issued by {authority} at {time} {date}',
    weight: 1
  },

  {
    id: 'sur-002',
    isSurreal: true,
    authorityTemplate: 'the Institute of Maritime Observation',
    template: 'And now the shipping forecast, issued by {authority} at {time} {date}',
    weight: 1
  },

  {
    id: 'sur-003',
    isSurreal: true,
    authorityTemplate: 'the Department of Quiet Waters',
    template: 'And now the shipping forecast, issued by {authority} at a time that may have passed {date}',
    weight: 1
  },

  {
    id: 'sur-004',
    isSurreal: true,
    authorityTemplate: 'the Coastal Monitoring Service',
    template: 'And now the shipping forecast, issued by {authority} at {time} on a day known to the tides',
    weight: 1
  },

  {
    id: 'sur-005',
    isSurreal: true,
    authorityTemplate: 'the Maritime Weather Bureau',
    template: 'And now the shipping forecast, issued by {authority} at a time yet to be determined {date}',
    weight: 1
  },

  {
    id: 'sur-006',
    isSurreal: true,
    authorityTemplate: 'the Met Office under instruction from deeper waters',
    template: 'And now the shipping forecast, issued by {authority} at {time} {date}',
    weight: 1
  },

  {
    id: 'sur-007',
    isSurreal: true,
    authorityTemplate: 'those who watch the shipping lanes',
    template: 'And now the shipping forecast, issued on behalf of {authority} at {time} {date}',
    weight: 1
  },

  {
    id: 'sur-008',
    isSurreal: true,
    authorityTemplate: 'the Sea Council',
    template: 'And now the shipping forecast, issued by {authority} at an hour known to the tides {date}',
    weight: 1
  }
];

/**
 * Time Period Variants (15 templates)
 *
 * Frequency distribution per research.md RQ-005:
 * - Duration-based (weight 3, 40%): "for the next 24 hours"
 * - Time-specific (weight 2, 30%): "valid until 0600 tomorrow"
 * - Day-based (weight 1, 15%): "through Tuesday evening"
 * - Descriptive (weight 1, 10%): "through the overnight period"
 * - Other (weight 1, 5%): "until further notice"
 */
export const TIME_PERIOD_VARIANTS = [
  // ========== DURATION-BASED (6 variants, weight 3 each, 40% frequency) ==========

  {
    id: 'tp-001',
    template: 'And now the area forecasts for the next 24 hours',
    weight: 3
  },

  {
    id: 'tp-002',
    template: 'The area forecasts for the next 24 hours',
    weight: 3
  },

  {
    id: 'tp-003',
    template: 'And now the area forecasts for the next 48 hours',
    weight: 3
  },

  {
    id: 'tp-004',
    template: 'Area forecasts issued for the next 6 hours',
    weight: 3
  },

  {
    id: 'tp-005',
    template: 'And now the area forecasts for the 24-hour period beginning at 0600',
    weight: 3
  },

  {
    id: 'tp-006',
    template: 'The area forecasts for the period covering the next 24 hours',
    weight: 3
  },

  // ========== TIME-SPECIFIC (4 variants, weight 2 each, 30% frequency) ==========

  {
    id: 'tp-007',
    template: 'And now the area forecasts valid until 0600 tomorrow',
    weight: 2
  },

  {
    id: 'tp-008',
    template: 'Area forecasts until midnight tonight',
    weight: 2
  },

  {
    id: 'tp-009',
    template: 'And now the area forecasts for the period ending 1800 hours',
    weight: 2
  },

  {
    id: 'tp-010',
    template: 'The area forecasts valid until 0000 UTC Wednesday',
    weight: 2
  },

  // ========== DESCRIPTIVE (2 variants, weight 1 each, 10% frequency) ==========

  {
    id: 'tp-011',
    template: 'And now the area forecasts valid through the overnight period',
    weight: 1
  },

  {
    id: 'tp-012',
    template: 'Area forecasts for the remainder of today and tonight',
    weight: 1
  },

  // ========== MARITIME-SPECIFIC (2 variants, weight 1 each, 10% frequency) ==========

  {
    id: 'tp-013',
    template: 'And now the area forecasts through the next two tidal periods',
    weight: 1
  },

  {
    id: 'tp-014',
    template: 'Area forecasts for the next watch period',
    weight: 1
  },

  // ========== OTHER (1 variant, weight 1, 5% frequency) ==========

  {
    id: 'tp-015',
    template: 'And now the area forecasts until the next scheduled update',
    weight: 1
  }
];

/**
 * Validate introduction variants on module load
 * Ensures minimum variant count and proper structure
 */
function validateIntroductionVariants() {
  if (INTRODUCTION_VARIANTS.length < 20) {
    console.warn(
      `[broadcast-variants] Introduction variants count (${INTRODUCTION_VARIANTS.length}) below target 20+ (FR-005)`
    );
  }

  const standardCount = INTRODUCTION_VARIANTS.filter((v) => !v.isSurreal).length;
  const surrealCount = INTRODUCTION_VARIANTS.filter((v) => v.isSurreal).length;

  console.log(
    `[broadcast-variants] Introduction variants loaded: ${INTRODUCTION_VARIANTS.length} total (${standardCount} standard, ${surrealCount} surreal)`
  );

  // Validate structure
  INTRODUCTION_VARIANTS.forEach((variant, index) => {
    if (!variant.id || !variant.template || typeof variant.isSurreal !== 'boolean' || !variant.weight) {
      console.error(`[broadcast-variants] Invalid variant structure at index ${index}:`, variant);
    }
  });
}

// Run validation on module load
validateIntroductionVariants();

/**
 * Select introduction variant using weighted random selection
 *
 * Standard variants appear ~60% of time (weight 2)
 * Surreal variants appear ~40% of time (weight 1)
 *
 * @returns {Object} Selected introduction variant
 * @returns {string} return.id - Variant identifier (e.g., "std-001", "sur-003")
 * @returns {boolean} return.isSurreal - Whether this is a surreal variant
 * @returns {string} return.authorityTemplate - Authority text template
 * @returns {string} return.template - Full introduction template with placeholders
 * @returns {number} return.weight - Selection probability weight
 */
export function selectIntroductionVariant() {
  return selectWeightedVariant(INTRODUCTION_VARIANTS);
}

/**
 * Get introduction variant metadata
 * For testing and debugging variant distribution
 *
 * @returns {Object} Metadata about introduction variants
 */
export function getIntroductionVariantMetadata() {
  const standardCount = INTRODUCTION_VARIANTS.filter((v) => !v.isSurreal).length;
  const surrealCount = INTRODUCTION_VARIANTS.filter((v) => v.isSurreal).length;
  const totalWeight = INTRODUCTION_VARIANTS.reduce((sum, v) => sum + v.weight, 0);

  return {
    totalCount: INTRODUCTION_VARIANTS.length,
    standardCount,
    surrealCount,
    totalWeight,
    standardProbability: (standardCount * 2) / totalWeight,
    surrealProbability: (surrealCount * 1) / totalWeight
  };
}

/**
 * Validate time period variants on module load
 * Ensures minimum variant count and proper structure
 */
function validateTimePeriodVariants() {
  if (TIME_PERIOD_VARIANTS.length < 10) {
    console.warn(
      `[broadcast-variants] Time period variants count (${TIME_PERIOD_VARIANTS.length}) below target 10+ (FR-017)`
    );
  }

  console.log(`[broadcast-variants] Time period variants loaded: ${TIME_PERIOD_VARIANTS.length} total`);

  // Validate structure
  TIME_PERIOD_VARIANTS.forEach((variant, index) => {
    if (!variant.id || !variant.template || !variant.weight) {
      console.error(`[broadcast-variants] Invalid time period variant structure at index ${index}:`, variant);
    }
  });
}

// Run validation on module load
validateTimePeriodVariants();

/**
 * Select time period variant using weighted random selection
 *
 * Distribution matches BBC authentic usage patterns (research.md RQ-005)
 *
 * @returns {Object} Selected time period variant
 * @returns {string} return.id - Variant identifier (e.g., "tp-001")
 * @returns {string} return.template - Time period phrase template
 * @returns {number} return.weight - Selection probability weight
 */
export function selectTimePeriodVariant() {
  return selectWeightedVariant(TIME_PERIOD_VARIANTS);
}

/**
 * Get time period variant metadata
 * For testing and debugging variant distribution
 *
 * @returns {Object} Metadata about time period variants
 */
export function getTimePeriodVariantMetadata() {
  const totalWeight = TIME_PERIOD_VARIANTS.reduce((sum, v) => sum + v.weight, 0);

  // Group by weight to show frequency distribution
  const weightGroups = {};
  TIME_PERIOD_VARIANTS.forEach((v) => {
    const key = `weight-${v.weight}`;
    weightGroups[key] = (weightGroups[key] || 0) + 1;
  });

  return {
    totalCount: TIME_PERIOD_VARIANTS.length,
    totalWeight,
    weightGroups,
    averageWeight: totalWeight / TIME_PERIOD_VARIANTS.length
  };
}

/**
 * Generic weighted random selection algorithm
 *
 * Selects variant from array based on weight property.
 * Higher weight = higher probability of selection.
 *
 * @param {Array<Object>} variants - Array of variant objects with weight property
 * @returns {Object} Selected variant
 * @private
 */
function selectWeightedVariant(variants) {
  if (variants.length === 0) {
    throw new Error('Variant array is empty');
  }

  // Calculate total weight
  const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);

  // Generate random number between 0 and totalWeight
  let random = Math.random() * totalWeight;

  // Select variant by subtracting weights until we hit 0
  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) {
      return variant;
    }
  }

  // Fallback (should never reach here due to floating point precision)
  return variants[0];
}
