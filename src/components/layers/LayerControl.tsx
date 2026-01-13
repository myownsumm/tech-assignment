import { useAtom } from "jotai";
import {
  Box,
  TextField,
  Typography,
} from "@mui/material";
import { layerByIdSelector } from "../../state/layers.state";

interface LayerControlProps {
  layerId: string;
}

export const LayerControl = ({ layerId }: LayerControlProps) => {
  const [layer, updateLayer] = useAtom(layerByIdSelector(layerId));

  if (!layer) {
    return (
      <Typography color="error">Layer not found</Typography>
    );
  }

  const updateColor = (
    colorProp: "getFillColor" | "getLineColor",
    index: number,
    value: number
  ) => {
    const currentColor = layer[colorProp] || [0, 0, 0, 255];
    const newColor = [...currentColor];
    newColor[index] = value;
    updateLayer({ [colorProp]: newColor });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Point Radius Min Pixels */}
        <TextField
          label="Point Radius Min Pixels"
          type="number"
          value={layer.pointRadiusMinPixels ?? ""}
          onChange={(e) =>
            updateLayer({
              pointRadiusMinPixels: e.target.value
                ? Number(e.target.value)
                : undefined,
            })
          }
          fullWidth
          size="small"
          inputProps={{ min: 0, step: 0.1 }}
        />

        {/* Fill Color */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Fill Color (RGBA)
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {[0, 1, 2, 3].map((index) => (
              <TextField
                key={index}
                label={["R", "G", "B", "A"][index]}
                type="number"
                value={layer.getFillColor?.[index] ?? (index === 3 ? 255 : 0)}
                onChange={(e) =>
                  updateColor(
                    "getFillColor",
                    index,
                    Number(e.target.value) || 0
                  )
                }
                size="small"
                inputProps={{ min: 0, max: 255, step: 1 }}
                sx={{ flex: 1 }}
              />
            ))}
          </Box>
        </Box>

        {/* Line Color */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Line Color (RGBA)
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {[0, 1, 2, 3].map((index) => (
              <TextField
                key={index}
                label={["R", "G", "B", "A"][index]}
                type="number"
                value={layer.getLineColor?.[index] ?? (index === 3 ? 255 : 0)}
                onChange={(e) =>
                  updateColor(
                    "getLineColor",
                    index,
                    Number(e.target.value) || 0
                  )
                }
                size="small"
                inputProps={{ min: 0, max: 255, step: 1 }}
                sx={{ flex: 1 }}
              />
            ))}
          </Box>
        </Box>

        {/* Line Width Min Pixels */}
        <TextField
          label="Line Width Min Pixels"
          type="number"
          value={layer.lineWidthMinPixels ?? ""}
          onChange={(e) =>
            updateLayer({
              lineWidthMinPixels: e.target.value
                ? Number(e.target.value)
                : undefined,
            })
          }
          fullWidth
          size="small"
          inputProps={{ min: 0, step: 0.1 }}
        />
      </Box>
  );
};
