import { useState } from "react";
import { useAtomValue } from "jotai";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from "@mui/material";
import { layersState } from "../../state/layers.state";
import { LayerControl } from "./LayerControl";

export const LayersList = () => {
  const layers = useAtomValue(layersState);
  const [expanded, setExpanded] = useState<string | false>(
    layers[0]?.id || false
  );

  const handleChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Box sx={{ height: "100%", overflow: "auto" }}>
      {layers.map((layer) => (
        <Accordion
          key={layer.id}
          expanded={expanded === layer.id}
          onChange={handleChange(layer.id)}
        >
          <AccordionSummary
            aria-controls={`${layer.id}-content`}
            id={`${layer.id}-header`}
          >
            <Typography>{layer.id}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <LayerControl layerId={layer.id} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};
