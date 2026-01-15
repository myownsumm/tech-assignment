import { vectorTableSource, vectorTilesetSource } from "@deck.gl/carto";
import type { LayerConfig } from "@modules/Layers/types";

/**
 * Generates a detailed domain array for color scales with fine granularity
 * @param min - Minimum value
 * @param max - Maximum value
 * @param steps - Number of steps/breakpoints to generate
 * @returns Array of domain values
 */
function generateColorDomain(
  min: number,
  max: number,
  steps: number = 100
): number[] {
  const domain: number[] = [];
  const range = max - min;
  const stepSize = range / steps;

  for (let i = 0; i <= steps; i++) {
    domain.push(Math.round(min + stepSize * i));
  }

  return domain;
}

/**
 * Initial layers configuration.
 * Order in this array determines layer order in the map.
 */
export const initialLayers: LayerConfig[] = [
  {
    id: "sociodemographics",
    tableName: "carto-demo-data.demo_tilesets.sociodemographics_usa_blockgroup",
    statsTableName: undefined,
    source: vectorTilesetSource,
    getFillColor: [100, 200, 100, 150],
    getLineColor: [50, 50, 50, 100],
    lineWidthMinPixels: 1,
    visible: true,
    fillMode: "byValue",
    fillAttribute: "total_pop",
    colorScale: {
      domain: generateColorDomain(0, 2000, 10),
      colors: "Mint",
    },
  },
  {
    id: "retail-stores",
    tableName: "carto-demo-data.demo_tables.retail_stores",
    statsTableName: "carto-demo-data.demo_tables.retail_stores",
    source: vectorTableSource,
    pointRadiusMinPixels: 3,
    getFillColor: [255, 255, 0, 150],
    visible: true,
    fillMode: "byValue",
    fillAttribute: "revenue",
    colorScale: {
      domain: generateColorDomain(1439945, 1539945, 2000), // data range is quite specific here
      colors: "PurpOr",
    },
  },
];
