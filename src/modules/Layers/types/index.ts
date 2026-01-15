import { vectorTableSource, vectorTilesetSource } from "@deck.gl/carto";

export type FillMode = "solid" | "byValue";

export interface ColorScaleConfig {
  domain: number[];
  colors: string;
}

export interface LayerConfig {
  id: string;
  tableName: string;

  // TODO.Looks like tileset datasets should be queried using specific approach.
  // Pass the stats table name to the config to enable querying
  // with the base implementation of SQL API.
  statsTableName?: string;

  // TODO. just for assessment purposes. we should use the source from the config.
  source: typeof vectorTableSource | typeof vectorTilesetSource;

  pointRadiusMinPixels?: number;
  getFillColor?: number[];
  getLineColor?: number[];
  lineWidthMinPixels?: number;

  visible?: boolean;
  fillMode?: FillMode;

  // TODO.It would be great allowing to set fill attribute dynamically.
  // We'll keep it hardcoded to simplify the implementation.
  fillAttribute?: string; // For data-driven styling

  colorScale?: ColorScaleConfig; // Color scale configuration for data-driven styling
}
