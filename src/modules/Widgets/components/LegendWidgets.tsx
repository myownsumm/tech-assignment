import { Box } from "@mui/material";
import { useLayersList } from "@modules/Layers/state";
import { LegendWidget } from "./LegendWidget";

/**
 * Container component that renders a LegendWidget for each layer
 * that has fillMode === 'byValue' and is visible
 */
export function LegendWidgets() {
  const layers = useLayersList();

  // Find all visible layers that have fillMode === 'byValue'
  const activeLayers = layers.filter(
    (layer) =>
      layer.visible !== false &&
      layer.fillMode === "byValue" &&
      layer.fillAttribute
  );

  if (activeLayers.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        top: 20,
        right: 0,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        maxHeight: "calc(100vh - 40px)",
        overflowY: "auto",
        minWidth: 300,
      }}
    >
      {activeLayers.map((layer) => (
        <LegendWidget key={layer.id} layer={layer} />
      ))}
    </Box>
  );
}
