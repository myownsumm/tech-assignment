import { useEffect, useState, useRef, useCallback } from "react";
import { createViewportSpatialFilter } from "@carto/api-client";
import debounce from "lodash.debounce";
import type {
  ViewportStats,
  UseViewportStatsParams,
  DeckWithViewports,
  DeckLayer,
  TilejsonResultWithWidgetSource,
} from "@modules/Widgets/types";

export function useViewportStats({
  deckRef,
  layerId,
  attribute,
}: UseViewportStatsParams): ViewportStats {
  const [stats, setStats] = useState<ViewportStats>({
    value: 0,
    count: 0,
    loading: false,
  });

  const abortRef = useRef<AbortController | null>(null);
  const calculateStatsRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const lastBoundsRef = useRef<[number, number, number, number] | null>(null);

  // FE-only aggregation using CARTO tileset widgetSource (no SQL). Requires tiles to be loaded via onViewportLoad.
  const calculateStats = useCallback(async () => {
    const deck = deckRef.current as DeckWithViewports | null;
    if (!deck) {
      return;
    }

    // Find the layer instance by id from Deck props (these are the actual layer instances Deck is rendering)
    const rootLayersRaw = deck.props.layers as DeckLayer | DeckLayer[] | DeckLayer[][] | null | undefined;
    const rootLayers: DeckLayer[] = Array.isArray(rootLayersRaw)
      ? rootLayersRaw.flat(Infinity) as DeckLayer[]
      : rootLayersRaw
      ? [rootLayersRaw as DeckLayer]
      : [];
    const layer = rootLayers.find((l) => l?.id === layerId);

    const data = layer?.props?.data;
    if (!data) {
      return;
    }

    const resolvedData = await Promise.resolve(data) as TilejsonResultWithWidgetSource | null;
    const widgetSource = resolvedData?.widgetSource;

    // Only support tileset widgetSource (table widgetSource is remote and doesn't have loadTiles).
    if (!widgetSource || typeof widgetSource.loadTiles !== "function") {
      return;
    }

    const viewports = deck.getViewports?.();
    const vp = viewports?.[0];
    const bounds = vp?.getBounds();
    if (!bounds) {
      return;
    }

    // Check if bounds have changed to avoid unnecessary recalculations
    const boundsChanged = lastBoundsRef.current === null || 
      bounds[0] !== lastBoundsRef.current[0] || 
      bounds[1] !== lastBoundsRef.current[1] || 
      bounds[2] !== lastBoundsRef.current[2] || 
      bounds[3] !== lastBoundsRef.current[3];

    // Early return if bounds haven't changed (skip unnecessary recalculation)
    if (!boundsChanged) {
      return;
    }

    const spatialFilter = createViewportSpatialFilter(bounds);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStats((prev) => ({ ...prev, loading: true }));

    try {
      const res = await widgetSource.getAggregations({
        aggregations: [
          { column: attribute, operation: "sum", alias: "value" },
          { column: "*", operation: "count", alias: "count" },
        ],
        spatialFilter,
        signal: controller.signal,
      });

      const row = res?.rows?.[0];
      const value = typeof row?.value === "number" ? row.value : 0;
      const count = typeof row?.count === "number" ? row.count : 0;

      lastBoundsRef.current = bounds;
      setStats({ value, count, loading: false });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setStats((prev) => ({ ...prev, value: 0, count: 0, loading: false }));
    }
  }, [deckRef, layerId, attribute]);

  // Keep ref updated with latest calculateStats
  useEffect(() => {
    calculateStatsRef.current = calculateStats;
  }, [calculateStats]);

  // Debounce to prevent calculating on every frame during pan/zoom
  const debouncedCalculateRef = useRef<ReturnType<typeof debounce> | null>(null);
  useEffect(() => {
    debouncedCalculateRef.current?.cancel();
    const debouncedFn = debounce(() => {
      calculateStatsRef.current?.();
    }, 500);
    debouncedCalculateRef.current = debouncedFn;
    return () => {
      debouncedCalculateRef.current?.cancel();
    };
  }, [layerId, attribute]); // Don't recreate debounce when calculateStats changes - it's stable

  // Poll lightly and debounce. This is "good enough" without wiring a viewState prop through React,
  // and the heavy work runs in the widgetSource worker/local impl (not via expensive GPU picking).
  // TODO. Consider trying to use deck.onViewStateChange instead of polling.
  useEffect(() => {
    // Use interval longer than debounce delay so debounce can actually fire
    const interval = setInterval(() => {
      if (deckRef.current && debouncedCalculateRef.current) {
        debouncedCalculateRef.current();
      }
    }, 600); // Longer than debounce delay (500ms) so it can fire

    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
      debouncedCalculateRef.current?.cancel();
    };
  }, [deckRef]);

  return stats;
}
