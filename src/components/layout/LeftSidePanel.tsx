import { Paper } from "@mui/material";
import type { ReactNode } from "react";

export const LeftSidePanel = ({ children }: { children: ReactNode }) => {
  return (
    <Paper
      elevation={2}
      sx={{
        width: 320,
        minWidth: 320,
        height: "100%",
        borderRadius: 0,
      }}
    >
      {children}
    </Paper>
  );
};
