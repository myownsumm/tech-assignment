import { Box } from "@mui/material";
import { Map } from "@modules/Map/components/Map";
import { LeftSidePanel } from "@modules/Layout/components/LeftSidePanel";
import { MainContainer } from "@modules/Layout/components/MainContainer";
import { LayersList } from "@modules/Layers/components/LayersList";

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
