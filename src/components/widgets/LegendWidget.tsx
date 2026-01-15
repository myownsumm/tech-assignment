import { useAtomValue } from "jotai";
import { Paper, Typography, Box, Stack, Skeleton } from "@mui/material";
import { layersState } from "../../state/layers.state";
import { COLOR_SCALES } from "../../config/colorScales";
import { useHistogram } from "../../hooks/useHistogram";

export function LegendWidget() {
  const layers = useAtomValue(layersState);

  // Find the visible layer that has fillMode === 'byValue'
  const activeLayer = layers.find(
    (layer) =>
      layer.visible !== false &&
      layer.fillMode === "byValue" &&
      layer.fillAttribute
  );

  // Look up the color scale config for this attribute (may be undefined)
  const colorScale = activeLayer?.fillAttribute
    ? COLOR_SCALES[activeLayer.fillAttribute]
    : undefined;

  // Only fetch histogram data if statsTableName is explicitly provided
  // If statsTableName is missing, show static legend (colors + labels only)
  const hasStatsTable = !!activeLayer?.statsTableName;

  // Always call hooks before any early returns
  const {
    data: histogramData,
    loading: histogramLoading,
    error: histogramError,
  } = useHistogram(
    activeLayer?.statsTableName, // Use statsTableName directly instead of tableName
    activeLayer?.fillAttribute,
    colorScale?.domain,
    hasStatsTable && !!colorScale?.domain // Only enable fetch if statsTableName exists and domain is available
  );

  // If no layer is in 'byValue' mode, hide widget
  if (!activeLayer || !activeLayer.fillAttribute) {
    return null;
  }

  // If no color scale config found, hide widget
  if (!colorScale) {
    return null;
  }

  const { label, domain, hexColors, format } = colorScale;

  // Generate range labels for each color bin
  // For n domain values, colorBins creates n-1 bins: [domain[0], domain[1]), [domain[1], domain[2]), etc.
  // Each bin uses a color from the hexColors array
  const numBins = domain.length - 1;
  const ranges = Array.from({ length: numBins }, (_, index) => {
    const start = domain[index];
    const end = domain[index + 1];
    // Use the color at the same index, ensuring we don't exceed the colors array
    const colorIndex = Math.min(index, hexColors.length - 1);
    return {
      start,
      end,
      color: hexColors[colorIndex],
      binIndex: index,
    };
  });

  // Calculate max count for percentage width calculation (only if we have stats table)
  const maxCount =
    hasStatsTable && histogramData.length > 0
      ? Math.max(...histogramData.map((d) => d.count))
      : 0;

  // Format count numbers (e.g., "1.2k", "500", "1.5M")
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toLocaleString();
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        bottom: 20,
        right: 20,
        p: 2,
        minWidth: 200,
        maxWidth: 280,
        zIndex: 1000,
        backgroundColor: "background.paper",
      }}
    >
      <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
        {label}
      </Typography>
      {hasStatsTable && histogramError && (
        <Typography
          variant="caption"
          color="error"
          sx={{ fontSize: "0.7rem", display: "block", mb: 1 }}
        >
          Error loading data
        </Typography>
      )}
      <Stack spacing={1} sx={{ mt: 1 }}>
        {ranges.map((range, index) => {
          const binData = histogramData.find((d) => d.bin === range.binIndex);
          const count = binData?.count || 0;
          const widthPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  backgroundColor: range.color,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 0.5,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.75rem", minWidth: 80, flexShrink: 0 }}
              >
                {format(range.start)} - {format(range.end)}
              </Typography>
              {/* Only show histogram bars if statsTableName is provided */}
              {hasStatsTable &&
                (histogramLoading ? (
                  <Skeleton
                    variant="rectangular"
                    width={60}
                    height={16}
                    sx={{ borderRadius: 0.5, flex: 1 }}
                  />
                ) : (
                  <>
                    <Box
                      sx={{
                        flex: 1,
                        height: 16,
                        backgroundColor: "action.hover",
                        borderRadius: 0.5,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          height: "100%",
                          width: `${widthPercent}%`,
                          backgroundColor: range.color,
                          opacity: 0.6,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: "0.7rem",
                        minWidth: 40,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {formatCount(count)}
                    </Typography>
                  </>
                ))}
            </Box>
          );
        })}
        {/* Show the last domain value as the upper bound (values >= last domain value) */}
        {domain.length > 1 &&
          (() => {
            const lastBinIndex = ranges.length; // The bin after all ranges
            const binData = histogramData.find((d) => d.bin === lastBinIndex);
            const count = binData?.count || 0;
            const widthPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const lastColor =
              ranges.length > 0
                ? ranges[ranges.length - 1].color
                : hexColors[hexColors.length - 1];

            return (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    backgroundColor: lastColor,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 0.5,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.75rem", minWidth: 80, flexShrink: 0 }}
                >
                  {format(domain[domain.length - 1])}+
                </Typography>
                {/* Only show histogram bars if statsTableName is provided */}
                {hasStatsTable &&
                  (histogramLoading ? (
                    <Skeleton
                      variant="rectangular"
                      width={60}
                      height={16}
                      sx={{ borderRadius: 0.5, flex: 1 }}
                    />
                  ) : (
                    <>
                      <Box
                        sx={{
                          flex: 1,
                          height: 16,
                          backgroundColor: "action.hover",
                          borderRadius: 0.5,
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            height: "100%",
                            width: `${widthPercent}%`,
                            backgroundColor: lastColor,
                            opacity: 0.6,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: "0.7rem",
                          minWidth: 40,
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        {formatCount(count)}
                      </Typography>
                    </>
                  ))}
              </Box>
            );
          })()}
      </Stack>
    </Paper>
  );
}
