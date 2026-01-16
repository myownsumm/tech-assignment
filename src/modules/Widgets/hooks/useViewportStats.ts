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

const isAbortError = (error: unknown): boolean => {
  if (!(error instanceof Error || error instanceof DOMException)) {
    return false;
  }
  // Check both name (for DOMException) and message (for Error with "AbortError" in message)
  return error.name === "AbortError" || 
         (error instanceof Error && error.message.includes("AbortError"));
};

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

  // Set up global unhandled rejection handler to suppress AbortError
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isAbortError(event.reason)) {
        event.preventDefault(); // Prevent the error from being logged to console
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const abortRef = useRef<AbortController | null>(null);
  const calculateStatsRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const lastBoundsRef = useRef<[number, number, number, number] | null>(null);

  // FE-only aggregation using CARTO tileset widgetSource (no SQL). Requires tiles to be loaded via onViewportLoad.
  const calculateStats = useCallback(async () => {
    try {
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

      // Wrap getAggregations promise to immediately attach catch handler and prevent unhandled rejection
      const aggregationsPromise = widgetSource.getAggregations({
        aggregations: [
          { column: attribute, operation: "sum", alias: "value" },
          { column: "*", operation: "count", alias: "count" },
        ],
        spatialFilter,
        signal: controller.signal,
      });
      
      // Attach catch handler immediately to prevent unhandled rejection
      const handledPromise = aggregationsPromise.catch((err) => {
        if (isAbortError(err)) {
          // Return undefined to resolve the promise instead of rejecting
          return undefined;
        }
        throw err;
      });
      
      const res = await handledPromise;
      // If res is undefined, it means AbortError was caught - return early
      if (!res) {
        return;
      }

      const row = res?.rows?.[0];
      const value = typeof row?.value === "number" ? row.value : 0;
      const count = typeof row?.count === "number" ? row.count : 0;

      lastBoundsRef.current = bounds;
      setStats({ value, count, loading: false });
    } catch (error) {
      if (isAbortError(error)) {
        // Return undefined to resolve the promise instead of rejecting
        // This prevents the unhandled promise rejection
        return;
      }

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
      // Call calculateStats and immediately attach catch handler to prevent unhandled rejection
      try {
        const promise = calculateStatsRef.current?.();
        if (promise) {
          // Attach catch handler immediately to prevent unhandled rejection
          promise.catch((_err) => {
            // Silently handle AbortError - it's expected when requests are cancelled
            // Don't log or re-throw AbortError to prevent console noise
          });
        }
      } catch (err) {
        // Handle synchronous errors
        if (!isAbortError(err)) {
          console.error('Synchronous error in calculateStats:', err);
        }
      }
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
