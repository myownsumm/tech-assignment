import { Box } from "@mui/material";
import type { ReactNode } from "react";

export const MainContainer = ({ children }: { children: ReactNode }) => {
  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw" }}>
      {children}
    </Box>
  );
};
