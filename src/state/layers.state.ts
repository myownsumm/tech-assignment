import { atom } from "jotai";
import { vectorTableSource, vectorTilesetSource } from "@deck.gl/carto";

export type FillMode = "solid" | "byValue";

export interface ColorScaleConfig {
  domain: number[];
  colors: string;
}

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

export interface LayerConfig {
  id: string;
  tableName: string;
  source: typeof vectorTableSource | typeof vectorTilesetSource;
  pointRadiusMinPixels?: number;
  getFillColor?: number[];
  getLineColor?: number[];
  lineWidthMinPixels?: number;
  visible?: boolean;
  fillMode?: FillMode;
  fillAttribute?: string; // For data-driven styling
  colorScale?: ColorScaleConfig; // Color scale configuration for data-driven styling
}

const initialLayers: LayerConfig[] = [
  {
    id: "retail-stores",
    tableName: "carto-demo-data.demo_tables.retail_stores",
    source: vectorTableSource,
    pointRadiusMinPixels: 3,
    getFillColor: [0, 150, 200],
    visible: true,
    fillMode: "solid",
    fillAttribute: "revenue",
    colorScale: {
      domain: generateColorDomain(0, 500000, 200),
      colors: "PurpOr",
    },
  },
  {
    id: "sociodemographics",
    tableName: "carto-demo-data.demo_tilesets.sociodemographics_usa_blockgroup",
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
];

export const layersState = atom<LayerConfig[]>(initialLayers);

// Selector function to get a layer by ID
export const layerByIdSelector = (layerId: string) =>
  atom(
    (get) => get(layersState).find((layer) => layer.id === layerId),
    (get, set, updates: Partial<LayerConfig>) => {
      const layers = get(layersState);
      const currentLayer = layers.find((layer) => layer.id === layerId);
      // Automatically set fillAttribute when fillMode changes to "byValue"
      if (
        updates.fillMode === "byValue" &&
        !updates.fillAttribute &&
        currentLayer?.fillAttribute
      ) {
        updates.fillAttribute = currentLayer.fillAttribute;
      }
      set(
        layersState,
        layers.map((layer) =>
          layer.id === layerId ? { ...layer, ...updates } : layer
        )
      );
    }
  );
