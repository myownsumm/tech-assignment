import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { VectorTileLayer, colorBins } from "@deck.gl/carto";
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
  // Extract layer identifiers to a stable dependency string
  const layerIdentifiersKey = useMemo(
    () =>
      JSON.stringify(
        layersConfig.map((c) => ({ id: c.id, table: c.tableName }))
      ),
    [layersConfig]
  );

  const dataSources = useMemo(() => {
    const sources: Record<string, unknown> = {};

    layersConfig.forEach((config) => {
      sources[config.id] = config.source({
        ...cartoConfig,
        tableName: config.tableName,
      });
    });

    return sources;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartoConfig, layerIdentifiersKey]);

  // 3. Layer Generation (The "Light" Lifting)
  // This runs on every style change but is cheap because 'data' is cached.
  return useMemo(() => {
    const layers = layersConfig
      .filter((config) => config.visible !== false)
      .map((config) => {
      const stableData = dataSources[config.id];

      // Determine getFillColor based on fillMode
      const getFillColor =
        config.fillMode === "byValue" &&
        config.fillAttribute &&
        config.colorScale
          ? colorBins({
              attr: config.fillAttribute,
              domain: config.colorScale.domain,
              colors: config.colorScale.colors,
            })
          : config.getFillColor;

      const updateTriggers = {
        getFillColor: [
          config.fillMode,
          config.fillAttribute,
          config.getFillColor,
          config.colorScale,
        ],
        getLineColor: config.getLineColor,
        getRadius: config.pointRadiusMinPixels,
        getLineWidth: config.lineWidthMinPixels,
      };

      return new VectorTileLayer({
        id: config.id,
        data: stableData as
          | import("@deck.gl/carto").TilejsonResult
          | Promise<import("@deck.gl/carto").TilejsonResult>
          | null,

        // Interaction
        pickable: true,
        autoHighlight: true,
        highlightColor: [0, 255, 255, 255],
        // TODO: Add uniqueIdProperty and pointRadiusUnits to the config, but it is not working for points.

        // Visual Props
        pointRadiusMinPixels: config.pointRadiusMinPixels,
        lineWidthMinPixels: config.lineWidthMinPixels,
        getFillColor: getFillColor as
          | ((d: unknown) => [number, number, number, number])
          | [number, number, number, number]
          | undefined,
        getLineColor: config.getLineColor as
          | ((d: unknown) => [number, number, number, number])
          | [number, number, number, number]
          | undefined,

        updateTriggers,
      });
    });

    return layers;
  }, [layersConfig, dataSources]);
}
