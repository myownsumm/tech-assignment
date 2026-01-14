import { useAtom } from "jotai";
import {
  Box,
  Typography,
  Stack,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  TextField,
} from "@mui/material";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import PaletteIcon from "@mui/icons-material/Palette";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { layerByIdSelector, type FillMode } from "../../state/layers.state";
import { ColorPicker } from "./ColorPicker";

interface LayerControlProps {
  layerId: string;
}

export const LayerControl = ({ layerId }: LayerControlProps) => {
  const [layer, updateLayer] = useAtom(layerByIdSelector(layerId));

  if (!layer) {
    return <Typography color="error">Layer not found</Typography>;
  }

  const isPointLayer = layer.pointRadiusMinPixels !== undefined;
  const fillMode = layer.fillMode || "solid";
  const fillColor = layer.getFillColor || [0, 0, 0, 255];
  const lineColor = layer.getLineColor || [0, 0, 0, 255];
  const lineWidth = layer.lineWidthMinPixels || 0;
  const radius = layer.pointRadiusMinPixels || 0;

  const handleFillModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: FillMode | null
  ) => {
    if (newMode !== null) {
      updateLayer({ fillMode: newMode });
    }
  };

  const handleFillColorChange = (color: number[]) => {
    updateLayer({ getFillColor: color });
  };

  const handleLineColorChange = (color: number[]) => {
    updateLayer({ getLineColor: color });
  };

  const handleLineWidthChange = (_event: Event, newValue: number | number[]) => {
    const width = Array.isArray(newValue) ? newValue[0] : newValue;
    updateLayer({ lineWidthMinPixels: width });
  };

  const handleLineWidthInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const width = Number(event.target.value);
    if (width >= 0 && width <= 10) {
      updateLayer({ lineWidthMinPixels: width });
    }
  };

  const handleRadiusChange = (_event: Event, newValue: number | number[]) => {
    const newRadius = Array.isArray(newValue) ? newValue[0] : newValue;
    updateLayer({ pointRadiusMinPixels: newRadius });
  };

  const handleRadiusInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newRadius = Number(event.target.value);
    if (newRadius >= 0 && newRadius <= 100) {
      updateLayer({ pointRadiusMinPixels: newRadius });
    }
  };

  return (
    <Stack spacing={2}>
      {/* Fill Section */}
      <Box>
        <Typography variant="body2" fontWeight="medium" gutterBottom>
          Fill
        </Typography>
        <Stack spacing={2}>
          <ToggleButtonGroup
            value={fillMode}
            exclusive
            onChange={handleFillModeChange}
            fullWidth
            size="small"
          >
            <ToggleButton value="solid" aria-label="solid fill">
              <FormatColorFillIcon sx={{ mr: 0.5, fontSize: 16 }} />
              Solid
            </ToggleButton>
            <ToggleButton value="byValue" aria-label="by value fill">
              <PaletteIcon sx={{ mr: 0.5, fontSize: 16 }} />
              By Value
            </ToggleButton>
          </ToggleButtonGroup>

          {fillMode === "solid" && (
            <ColorPicker
              value={fillColor}
              onChange={handleFillColorChange}
              label="Color"
            />
          )}
        </Stack>
      </Box>

      <Divider />

      {/* Outline Section */}
      <Box>
        <Typography variant="body2" fontWeight="medium" gutterBottom>
          Outline
        </Typography>
        <Stack spacing={2}>
          <ColorPicker
            value={lineColor}
            onChange={handleLineColorChange}
            label="Color"
          />
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                Width
              </Typography>
              <Slider
                value={lineWidth}
                onChange={handleLineWidthChange}
                min={0}
                max={10}
                step={0.1}
                sx={{ flex: 1 }}
                size="small"
              />
              <TextField
                value={lineWidth.toFixed(1)}
                onChange={handleLineWidthInputChange}
                type="number"
                inputProps={{
                  min: 0,
                  max: 10,
                  step: 0.1,
                  style: { textAlign: "right", padding: "4px 8px" },
                }}
                sx={{
                  width: 65,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "divider",
                    },
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                      borderWidth: 1,
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    py: 0.5,
                    fontSize: "0.875rem",
                  },
                }}
                size="small"
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20 }}>
                px
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Radius Section (only for point layers) */}
      {isPointLayer && (
        <>
          <Divider />
          <Box>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Radius
            </Typography>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <RadioButtonUncheckedIcon
                  sx={{ fontSize: 16, color: "text.secondary", minWidth: 16 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 45 }}>
                  Size
                </Typography>
                <Slider
                  value={radius}
                  onChange={handleRadiusChange}
                  min={0}
                  max={100}
                  step={0.1}
                  sx={{ flex: 1 }}
                  size="small"
                />
                <TextField
                  value={radius.toFixed(1)}
                  onChange={handleRadiusInputChange}
                  type="number"
                  inputProps={{
                    min: 0,
                    max: 100,
                    step: 0.1,
                    style: { textAlign: "right", padding: "4px 8px" },
                  }}
                  sx={{
                    width: 65,
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "divider",
                      },
                      "&:hover fieldset": {
                        borderColor: "primary.main",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "primary.main",
                        borderWidth: 1,
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      py: 0.5,
                      fontSize: "0.875rem",
                    },
                  }}
                  size="small"
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20 }}>
                  px
                </Typography>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Stack>
  );
};
