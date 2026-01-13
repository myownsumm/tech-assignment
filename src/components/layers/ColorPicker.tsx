import { useState } from "react";
import { Box, Popover, Slider, Typography, TextField } from "@mui/material";

interface ColorPickerProps {
  value: number[]; // [R, G, B, A] where A is 0-255
  onChange: (color: number[]) => void;
  label?: string;
}

// Convert RGB array to hex string
const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
};

// Convert hex string to RGB array
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
};

export const ColorPicker = ({
  value,
  onChange,
  label,
}: ColorPickerProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const open = Boolean(anchorEl);

  const [r, g, b, a = 255] = value;
  const opacity = (a / 255) * 100; // Convert to percentage for slider

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorChange = (hex: string) => {
    const [newR, newG, newB] = hexToRgb(hex);
    onChange([newR, newG, newB, a]);
  };

  const handleOpacityChange = (_event: Event, newValue: number | number[]) => {
    const newOpacity = Array.isArray(newValue) ? newValue[0] : newValue;
    const newAlpha = Math.round((newOpacity / 100) * 255);
    onChange([r, g, b, newAlpha]);
  };

  const handleOpacityInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newOpacity = Number(event.target.value);
    if (newOpacity >= 0 && newOpacity <= 100) {
      const newAlpha = Math.round((newOpacity / 100) * 255);
      onChange([r, g, b, newAlpha]);
    }
  };

  const colorHex = rgbToHex(r, g, b);
  const rgbaString = `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;

  return (
    <Box>
      {label && (
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {label}
        </Typography>
      )}
      <Box
        onClick={handleClick}
        sx={{
          width: "100%",
          height: 40,
          backgroundColor: rgbaString,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "&:hover": {
            borderColor: "primary.main",
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: r + g + b < 384 ? "white" : "black",
            textShadow: "0 0 2px rgba(0,0,0,0.5)",
          }}
        >
          {colorHex}
        </Typography>
      </Box>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 2, minWidth: 250 }}>
          <Box sx={{ mb: 2 }}>
            <input
              type="color"
              value={colorHex}
              onChange={(e) => handleColorChange(e.target.value)}
              style={{
                width: "100%",
                height: 40,
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            />
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                Opacity
              </Typography>
              <Slider
                value={opacity}
                onChange={handleOpacityChange}
                min={0}
                max={100}
                step={1}
                sx={{ flex: 1 }}
                size="small"
              />
              <TextField
                value={opacity.toFixed(0)}
                onChange={handleOpacityInputChange}
                type="number"
                inputProps={{
                  min: 0,
                  max: 100,
                  step: 1,
                  style: { textAlign: "right", padding: "4px 8px" },
                }}
                sx={{
                  width: 55,
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
                %
              </Typography>
            </Box>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};
