import { Paper, Typography, Box, CircularProgress } from "@mui/material";
import { Deck } from "@deck.gl/core";
import { useViewportStats } from "../hooks/useViewportStats";
import { useLayer } from "@modules/Layers/state";

interface ViewportWidgetProps {
  deckRef: React.RefObject<Deck | null>;
  layerId: string;
  attribute: string;
}

/**
 * Formats a number to a human-readable string (e.g., "1.2M", "500k", "1,234")
 */
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toLocaleString();
}

export function ViewportWidget({
  deckRef,
  layerId,
  attribute,
}: ViewportWidgetProps) {
  const [layer] = useLayer(layerId);

  // Only show widget if layer exists and is visible
  if (!layer || layer.visible === false) {
    return null;
  }

  const { value, count, loading } = useViewportStats({
    deckRef,
    layerId,
    attribute,
  });

  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        bottom: 20,
        left: 20,
        zIndex: 1000,
        p: 2,
        minWidth: 200,
        maxWidth: 240,
        backgroundColor: "background.paper",
      }}
    >
      <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
        Visible Population
      </Typography>
      <Box sx={{ mt: 1.5, mb: 1 }}>
        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Calculating...
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ fontSize: "1.75rem", lineHeight: 1.2 }}
          >
            {formatNumber(value)}
          </Typography>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
        Based on {count.toLocaleString()} visible block{count !== 1 ? "s" : ""}
      </Typography>
    </Paper>
  );
}
