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
          data: stableData,

          // Interaction
          pickable: true,
          autoHighlight: true,
          highlightColor: [0, 255, 255, 255],
          // TODO: Add uniqueIdProperty and pointRadiusUnits to the config, but it is not working for points.

          // Visual Props
          pointRadiusMinPixels: config.pointRadiusMinPixels,
          lineWidthMinPixels: config.lineWidthMinPixels,
          getFillColor: getFillColor as any,
          getLineColor: config.getLineColor as any,

          onHover: (info) => {
            if (info.object) {
            //   console.group(`🔍 Hover: ${config.id}`);
            //   console.log("Object:", info.object);
              console.log("Properties:", info.object.properties || {});
            //   console.log("Coordinate:", info.coordinate);
            //   console.log("Pixel:", { x: info.x, y: info.y });
            //   console.log("Index:", info.index);
            //   console.groupEnd();
            }
          },

          updateTriggers,
        });
      });

    // Rule: Sociodemographics (Polygons) -> Bottom (Index 0)
    //       Retail Stores (Points) -> Top (Index 1)
    layers.sort((a, b) => {
      const aId = a.id.toLowerCase();
      const bId = b.id.toLowerCase();

      // Push 'sociodemographics' to the bottom (negative index)
      if (aId.includes("sociodemographics")) return -1;
      if (bId.includes("sociodemographics")) return 1;

      // Push 'retail' to the top (positive index)
      if (aId.includes("retail")) return 1;
      if (bId.includes("retail")) return -1;

      return 0;
    });

    return layers;
  }, [layersConfig, dataSources]);
}
