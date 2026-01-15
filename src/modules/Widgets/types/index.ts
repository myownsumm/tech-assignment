import { Deck, Layer } from "@deck.gl/core";
import type { TilejsonResult } from "@deck.gl/carto";

export interface ViewportStats {
  value: number;
  count: number;
  loading: boolean;
}

export interface UseViewportStatsParams {
  deckRef: React.RefObject<Deck | null>;
  layerId: string;
  attribute: string;
}

export interface AggregationConfig {
  column: string;
  operation: "sum" | "count" | "avg" | "min" | "max";
  alias: string;
}

export interface GetAggregationsOptions {
  aggregations: AggregationConfig[];
  spatialFilter: unknown;
  signal: AbortSignal;
}

export interface AggregationRow {
  value?: number;
  count?: number;
  [key: string]: unknown;
}

export interface AggregationResult {
  rows?: AggregationRow[];
}

export interface TilesetWidgetSource {
  loadTiles: (tiles: unknown) => void;
  getAggregations: (options: GetAggregationsOptions) => Promise<AggregationResult>;
}

export interface TilejsonResultWithWidgetSource extends TilejsonResult {
  widgetSource?: TilesetWidgetSource;
}

export type DeckLayer = Layer & {
  id?: string;
  props?: {
    data?: TilejsonResultWithWidgetSource | Promise<TilejsonResultWithWidgetSource> | null;
    [key: string]: unknown;
  };
};

export interface Viewport {
  getBounds: () => [number, number, number, number] | undefined;
}

export type DeckWithViewports = Deck & {
  getViewports?: () => Viewport[] | undefined;
};
