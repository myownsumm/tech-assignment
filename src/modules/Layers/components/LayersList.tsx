import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Switch,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useLayersList, useLayer, useExpandedLayer } from "@modules/Layers/state";
import { LayerControl } from "./LayerControl";

export const LayersList = () => {
  const layers = useLayersList();
  const [expanded, setExpanded] = useExpandedLayer();

  const handleChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Box sx={{ height: "100%", overflow: "auto" }}>
      {layers.map((layer) => (
        <LayerAccordion
          key={layer.id}
          layerId={layer.id}
          expanded={expanded === layer.id}
          onExpandedChange={handleChange(layer.id)}
        />
      ))}
    </Box>
  );
};

interface LayerAccordionProps {
  layerId: string;
  expanded: boolean;
  onExpandedChange: (event: React.SyntheticEvent, isExpanded: boolean) => void;
}

const LayerAccordion = ({
  layerId,
  expanded,
  onExpandedChange,
}: LayerAccordionProps) => {
  const [layer, updateLayer] = useLayer(layerId);

  if (!layer) return null;

  const handleVisibilityToggle = (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    event.stopPropagation();
    updateLayer({ visible: checked });
  };

  return (
    <Accordion expanded={expanded} onChange={onExpandedChange}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${layerId}-content`}
        id={`${layerId}-header`}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            mr: 1,
          }}
        >
          <Typography>{layer.id}</Typography>
          <Switch
            checked={layer.visible ?? true}
            onChange={handleVisibilityToggle}
            onClick={(e) => e.stopPropagation()}
            size="small"
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <LayerControl layerId={layerId} />
      </AccordionDetails>
    </Accordion>
  );
};
