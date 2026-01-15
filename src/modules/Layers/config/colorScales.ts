/**
 * Color scale configurations for data-driven styling.
 * These configurations define the color palettes and domains used for visualizing
 * numeric attributes in map layers.
 */

export interface ColorScaleConfig {
  label: string;
  domain: number[];
  colors: string; // CARTO palette name (e.g., "PurpOr", "Mint")
  hexColors: string[]; // Hex color values matching the CARTO palette for legend display
  format: (val: number) => string; // Helper function to format values for display
}

/**
 * Color scale configurations keyed by attribute name.
 * When a layer uses fillMode="byValue" with a fillAttribute,
 * this config is used to determine the color scale.
 */
export const COLOR_SCALES: Record<string, ColorScaleConfig> = {
  revenue: {
    label: "Store Revenue",
    // Highly granular domain with extra detail in the 1M-2M range where data is concentrated
    domain: [
      100000, // $100k
      500000, // $500k
      1000000, // $1M
      1200000, // $1.2M
      1400000, // $1.4M
      1600000, // $1.6M
      1800000, // $1.8M
      2000000, // $2M
      3000000, // $3M
      5000000, // $5M
    ],
    colors: "PurpOr",
    // Approximate hex colors for CARTO's PurpOr palette (10-color scale)
    // Smooth transition from purple to orange
    hexColors: [
      "#7B2CBF", // Dark purple
      "#9D4EDD", // Purple
      "#C77DFF", // Light purple
      "#D4A5FF", // Very light purple
      "#E0AAFF", // Lavender
      "#F0C8FF", // Pale purple
      "#FFD4A3", // Peach
      "#FF9E00", // Orange
      "#FF6B00", // Dark orange
      "#FF4500", // Red-orange
    ],
    format: (val: number) => `$${(val / 1000).toFixed(0)}k`,
  },
  total_pop: {
    label: "Population Density",
    domain: [0, 500, 1000, 1500, 2000],
    colors: "Mint",
    // Approximate hex colors for CARTO's Mint palette (5-color scale)
    hexColors: ["#E0F2E9", "#A8E6CF", "#5FD3A2", "#2D8659", "#1A4D3A"],
    format: (val: number) => val.toLocaleString(),
  },
};
