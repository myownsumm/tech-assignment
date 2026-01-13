import { Box, Typography } from "@mui/material";
import { Map } from "./components/map/Map";
import "./App.css";
import { LeftSidePanel } from "./components/layout/LeftSidePanel";
import { MainContainer } from "./components/layout/MainContainer";
import { LayersList } from "./components/layers/LayersList";

function App() {
  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw" }}>
      <LeftSidePanel>
        <LayersList />
      </LeftSidePanel>
      <MainContainer>
        <Map />
      </MainContainer>
    </Box>
  );
}

export default App;
