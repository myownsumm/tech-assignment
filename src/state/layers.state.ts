import { atom } from "jotai";
import { vectorTableSource, vectorTilesetSource } from "@deck.gl/carto";

export type FillMode = "solid" | "byValue";

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
  },
  {
    id: "sociodemographics",
    tableName: "carto-demo-data.demo_tilesets.sociodemographics_usa_blockgroup",
    source: vectorTilesetSource,
    getFillColor: [100, 200, 100, 150],
    getLineColor: [50, 50, 50, 100],
    lineWidthMinPixels: 1,
    visible: true,
    fillMode: "solid",
  },
];

export const layersState = atom<LayerConfig[]>(initialLayers);

// Selector function to get a layer by ID
export const layerByIdSelector = (layerId: string) =>
  atom(
    (get) => get(layersState).find((layer) => layer.id === layerId),
    (get, set, updates: Partial<LayerConfig>) => {
      const layers = get(layersState);
      set(
        layersState,
        layers.map((layer) =>
          layer.id === layerId ? { ...layer, ...updates } : layer
        )
      );
    }
  );
