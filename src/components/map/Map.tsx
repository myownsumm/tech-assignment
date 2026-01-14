import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { Deck } from "@deck.gl/core";
import { BASEMAP } from "@deck.gl/carto";
import { useCartoLayers } from "../../hooks/useCartoLayers";
import { getTooltip } from "./tooltip";
import "maplibre-gl/dist/maplibre-gl.css";

const INITIAL_VIEW_STATE = {
  latitude: 39.8097343,
  longitude: -98.5556199,
  zoom: 4,
  bearing: 0,
  pitch: 30,
};

export function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deckRef = useRef<Deck | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const layers = useCartoLayers();

  useEffect(() => {
    if (!mapContainerRef.current || !canvasRef.current) return;

    // Initialize deck.gl
    const deck = new Deck({
      canvas: canvasRef.current,
      initialViewState: INITIAL_VIEW_STATE,
      controller: true,
      layers: [],
      getTooltip,
    });

    // Initialize MapLibre GL
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP.VOYAGER,
      interactive: false,
    });

    // Sync deck.gl view state with MapLibre
    deck.setProps({
      onViewStateChange: ({ viewState }) => {
        const { longitude, latitude, ...rest } = viewState;
        map.jumpTo({ center: [longitude, latitude], ...rest });
      },
    });

    deckRef.current = deck;
    mapRef.current = map;

    // Cleanup
    return () => {
      deck.finalize();
      map.remove();
    };
  }, []);


  // Update Deck instance when layers change
  useEffect(() => {
    if (!deckRef.current) return;
    deckRef.current.setProps({ layers });
  }, [layers]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={mapContainerRef}
        id="map"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
      <canvas
        ref={canvasRef}
        id="deck-canvas"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
