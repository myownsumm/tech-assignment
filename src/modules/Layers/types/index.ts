import { vectorTableSource, vectorTilesetSource } from "@deck.gl/carto";

export type FillMode = "solid" | "byValue";

export interface ColorScaleConfig {
  domain: number[];
  colors: string;
}

export interface LayerConfig {
  id: string;
  tableName: string;
  statsTableName?: string;
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
