import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { Deck } from '@deck.gl/core';
import {
  BASEMAP,
  vectorTableSource,
  vectorTilesetSource,
  VectorTileLayer,
} from '@deck.gl/carto';
import 'maplibre-gl/dist/maplibre-gl.css';

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

  useEffect(() => {
    if (!mapContainerRef.current || !canvasRef.current) return;

    // Set the credentials to connect with CARTO
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const accessToken = import.meta.env.VITE_API_ACCESS_TOKEN;
    const connectionName = 'carto_dw';
    const cartoConfig = { apiBaseUrl, accessToken, connectionName };

    const retailStoresSource = vectorTableSource({
      ...cartoConfig,
      tableName: 'carto-demo-data.demo_tables.retail_stores',
    });

    const sociodemographicsSource = vectorTilesetSource({
      ...cartoConfig,
      tableName: 'carto-demo-data.demo_tilesets.sociodemographics_usa_blockgroup',
    });

    // Initialize deck.gl with the dataset layers
    const deck = new Deck({
      canvas: canvasRef.current,
      initialViewState: INITIAL_VIEW_STATE,
      controller: true,
      layers: [
        new VectorTileLayer({
          id: 'retail-stores',
          data: retailStoresSource,
          pointRadiusMinPixels: 3,
          getFillColor: [0, 150, 200],
        }),
        new VectorTileLayer({
          id: 'sociodemographics',
          data: sociodemographicsSource,
          getFillColor: [100, 200, 100, 150],
          getLineColor: [50, 50, 50, 100],
          lineWidthMinPixels: 1,
        }),
      ],
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} id="map" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      <canvas ref={canvasRef} id="deck-canvas" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
    </div>
  );
}
