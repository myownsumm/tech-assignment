import { useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import maplibregl from "maplibre-gl";
import { Deck } from "@deck.gl/core";
import { BASEMAP, VectorTileLayer } from "@deck.gl/carto";
import { layersState } from "../../state/layers.state";
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
  const layersConfig = useAtomValue(layersState);

  useEffect(() => {
    if (!mapContainerRef.current || !canvasRef.current) return;

    // Initialize deck.gl
    const deck = new Deck({
      canvas: canvasRef.current,
      initialViewState: INITIAL_VIEW_STATE,
      controller: true,
      layers: [],
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

  // Update layers when layersConfig changes
  useEffect(() => {
    if (!deckRef.current) return;

    // Set the credentials to connect with CARTO
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const accessToken = import.meta.env.VITE_API_ACCESS_TOKEN;
    const connectionName = "carto_dw";
    const cartoConfig = { apiBaseUrl, accessToken, connectionName };

    // Create layers from config
    const layers = layersConfig.map((config) => {
      const dataSource = config.source({
        ...cartoConfig,
        tableName: config.tableName,
      });

      return new VectorTileLayer({
        id: config.id,
        data: dataSource,
        pointRadiusMinPixels: config.pointRadiusMinPixels,
        getFillColor: config.getFillColor as
          | [number, number, number]
          | [number, number, number, number],
        getLineColor: config.getLineColor as
          | [number, number, number]
          | [number, number, number, number],
        lineWidthMinPixels: config.lineWidthMinPixels,
      });
    });

    deckRef.current.setProps({ layers });
  }, [layersConfig]);

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
