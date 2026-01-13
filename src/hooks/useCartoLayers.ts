import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { VectorTileLayer } from "@deck.gl/carto";
import { layersState } from "../state/layers.state";

export function useCartoLayers() {
  const layersConfig = useAtomValue(layersState);

  // 1. Stable Credentials
  const cartoConfig = useMemo(
    () => ({
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      accessToken: import.meta.env.VITE_API_ACCESS_TOKEN,
      connectionName: "carto_dw",
    }),
    []
  );

  // 2. Stable Data Sources (The "Heavy" Lifting)
  // This only re-runs if tableNames or IDs change, ignoring style changes.
  const dataSources = useMemo(() => {
    const sources: Record<string, any> = {};

    layersConfig.forEach((config) => {
      sources[config.id] = config.source({
        ...cartoConfig,
        tableName: config.tableName,
      });
    });

    return sources;
  }, [
    cartoConfig,
    JSON.stringify(layersConfig.map((c) => ({ id: c.id, table: c.tableName }))),
  ]);

  // 3. Layer Generation (The "Light" Lifting)
  // This runs on every style change but is cheap because 'data' is cached.
  return useMemo(() => {
    return layersConfig.map((config) => {
      const stableData = dataSources[config.id];

      // Create triggers to tell WebGL what changed
      const updateTriggers = {
        getFillColor: config.getFillColor,
        getLineColor: config.getLineColor,
        getRadius: config.pointRadiusMinPixels,
        getLineWidth: config.lineWidthMinPixels,
      };

      return new VectorTileLayer({
        id: config.id,
        data: stableData, // Stable reference!

        // Visual Props
        pointRadiusMinPixels: config.pointRadiusMinPixels,
        lineWidthMinPixels: config.lineWidthMinPixels,
        getFillColor: config.getFillColor as
          | [number, number, number]
          | [number, number, number, number],
        getLineColor: config.getLineColor as
          | [number, number, number]
          | [number, number, number, number],

        // Performance Optimization
        updateTriggers,
      });
    });
  }, [layersConfig, dataSources]);
}
