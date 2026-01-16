import { useMemo } from "react";
import { VectorTileLayer, colorBins } from "@deck.gl/carto";
import { useLayersList } from "@modules/Layers/state";
import { COLOR_SCALES } from "@modules/Layers/config/colorScales";
import type {
  LayerIdentity,
  LayerFillStyling,
  LayerLineStyling,
  LayerPointStyling,
} from "@modules/Layers/types";
import type { TilejsonResultWithWidgetSource } from "@modules/Widgets/types";

interface CartoConfig {
  apiBaseUrl: string;
  accessToken: string;
  connectionName: string;
}

/**
 * Creates data sources for layers based on their identity configuration.
 * Handles the "heavy lifting" of data source creation.
 */
function createLayerDataSources(
  layersConfig: LayerIdentity[],
  cartoConfig: CartoConfig
): Record<string, unknown> {
  const sources: Record<string, unknown> = {};

  layersConfig.forEach((config) => {
    sources[config.id] = config.source({
      ...cartoConfig,
      tableName: config.tableName,
    });
  });

  return sources;
}

/**
 * Determines the fill color function or value based on fill styling configuration.
 * Handles both solid fill and data-driven styling (byValue mode).
 */
function createLayerFillColor(
  fillStyling: LayerFillStyling
):
  | ((d: unknown) => [number, number, number, number])
  | [number, number, number, number]
  | undefined {
  // Determine getFillColor based on fillMode
  // Use COLOR_SCALES config if available, otherwise fall back to layer's colorScale
  const colorScaleConfig =
    fillStyling.fillMode === "byValue" && fillStyling.fillAttribute
      ? COLOR_SCALES[fillStyling.fillAttribute] || fillStyling.colorScale
      : null;

  const getFillColor = colorScaleConfig
    ? colorBins({
        attr: fillStyling.fillAttribute!,
        domain: colorScaleConfig.domain,
        colors: colorScaleConfig.colors,
      })
    : fillStyling.getFillColor;

  return getFillColor as
    | ((d: unknown) => [number, number, number, number])
    | [number, number, number, number]
    | undefined;
}

/**
 * Extracts and formats visual properties from line and point styling configurations.
 */
function createLayerVisualProps(
  lineStyling: LayerLineStyling,
  pointStyling: LayerPointStyling
) {
  return {
    getLineColor: lineStyling.getLineColor as
      | ((d: unknown) => [number, number, number, number])
      | [number, number, number, number]
      | undefined,
    lineWidthMinPixels: lineStyling.lineWidthMinPixels,
    pointRadiusMinPixels: pointStyling.pointRadiusMinPixels,
  };
}

/**
 * Creates update triggers for deck.gl layer based on styling configurations.
 * These triggers ensure the layer updates when relevant styling properties change.
 */
function createLayerUpdateTriggers(
  fillStyling: LayerFillStyling,
  lineStyling: LayerLineStyling,
  pointStyling: LayerPointStyling
) {
  return {
    getFillColor: [
      fillStyling.fillMode,
      fillStyling.fillAttribute,
      fillStyling.getFillColor,
      fillStyling.colorScale,
      // Include COLOR_SCALES config if using it
      fillStyling.fillAttribute && COLOR_SCALES[fillStyling.fillAttribute]
        ? COLOR_SCALES[fillStyling.fillAttribute]
        : null,
    ],
    getLineColor: lineStyling.getLineColor,
    getRadius: pointStyling.pointRadiusMinPixels,
    getLineWidth: lineStyling.lineWidthMinPixels,
  };
}

export function useCartoLayers() {
  const layersConfig = useLayersList();

  // 1. Stable Credentials
  const cartoConfig = useMemo<CartoConfig>(
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

  const dataSources = useMemo(
    () => createLayerDataSources(layersConfig, cartoConfig),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartoConfig, layerIdentifiersKey]
  );

  // 3. Layer Generation (The "Light" Lifting)
  // This runs on every style change but is cheap because 'data' is cached.
  return useMemo(() => {
    const layers = layersConfig
      .filter((config) => config.visible !== false)
      .map((config) => {
        const stableData = dataSources[config.id];

        const getFillColor = createLayerFillColor(config);
        const visualProps = createLayerVisualProps(config, config);
        const updateTriggers = createLayerUpdateTriggers(
          config,
          config,
          config
        );

        return new VectorTileLayer({
          id: config.id,
          data: stableData as
            | import("@deck.gl/carto").TilejsonResult
            | Promise<import("@deck.gl/carto").TilejsonResult>
            | null,
          // Feed loaded tiles into CARTO widgetSource when available (tileset sources only).
          // This enables FE-only widget calculations without running SQL queries.
          onViewportLoad: (tiles) => {
            Promise.resolve(
              stableData as
                | TilejsonResultWithWidgetSource
                | Promise<TilejsonResultWithWidgetSource>
                | null
            ).then((resolved) => {
              if (resolved?.widgetSource?.loadTiles) {
                resolved.widgetSource.loadTiles(tiles);
              }
            });
          },

          // Interaction
          pickable: true,
          autoHighlight: true,
          highlightColor: [0, 255, 255, 255],
          // TODO: Add uniqueIdProperty and pointRadiusUnits to the config, but it is not working for points.

          // Visual Props
          pointRadiusMinPixels: visualProps.pointRadiusMinPixels,
          lineWidthMinPixels: visualProps.lineWidthMinPixels,
          getFillColor,
          getLineColor: visualProps.getLineColor,

          updateTriggers,
        });
      });

    return layers;
  }, [layersConfig, dataSources]);
}
