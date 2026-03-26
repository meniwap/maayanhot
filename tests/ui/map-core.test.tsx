import {
  MapSurface,
  buildInitialCameraRequest,
  buildSelectionCameraRequest,
  describeMarker,
  mapLibreAdapter,
  type MapAdapter,
  type MapMarkerDescriptor,
  type MapSurfacePalette,
} from '@maayanhot/map-core';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

vi.mock('react-native', async () => import('../mocks/react-native'));

const palette: MapSurfacePalette = {
  markerSurface: '#F6F3E8',
  noWater: '#9E5A3C',
  outline: '#2E3A2D',
  selectedRing: '#1F6F8B',
  stale: '#B27A16',
  unknown: '#D0C8B2',
  water: '#2E8B62',
};

const viewport = {
  center: {
    latitude: 31.4117,
    longitude: 35.0818,
  },
  east: 35.92,
  north: 33.31,
  south: 29.49,
  west: 34.2,
  zoom: 7.2,
} satisfies Parameters<typeof buildInitialCameraRequest>[0];

const markers: MapMarkerDescriptor[] = [
  {
    coordinate: {
      latitude: 31.7454,
      longitude: 35.1691,
    },
    freshness: 'recent',
    isSelected: false,
    springId: 'spring-ein-haniya',
    title: 'עין חניה',
    waterPresence: 'water',
  },
  {
    coordinate: {
      latitude: 31.8515,
      longitude: 35.3342,
    },
    freshness: 'stale',
    isSelected: true,
    springId: 'spring-ein-fara',
    title: 'עין פרא',
    waterPresence: 'no_water',
  },
];

const recentWaterMarker = markers[0]!;
const selectedNoWaterMarker = markers[1]!;

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react-native');

  cleanup();
});

describe('map-core', () => {
  it('keeps the exported adapter surface provider-neutral', () => {
    expectTypeOf(mapLibreAdapter).toMatchTypeOf<MapAdapter>();
    expect(mapLibreAdapter.Surface).toBe(MapSurface);
  });

  it('derives marker presentation from semantic status, freshness, and selection', () => {
    const appearance = describeMarker(selectedNoWaterMarker, palette);

    expect(appearance.fillColor).toBe(palette.noWater);
    expect(appearance.borderColor).toBe(palette.stale);
    expect(appearance.ringColor).toBe(palette.selectedRing);
    expect(appearance.size).toBe(28);
  });

  it('builds initial and selection camera requests without leaking provider types', () => {
    const initialRequest = buildInitialCameraRequest(viewport);
    const selectionRequest = buildSelectionCameraRequest(recentWaterMarker, 192);

    expect(initialRequest).toEqual({
      animated: false,
      center: viewport.center,
      padding: {
        bottom: 24,
        left: 24,
        right: 24,
        top: 24,
      },
      zoom: 7.2,
    });
    expect(selectionRequest).toEqual({
      animated: true,
      center: recentWaterMarker.coordinate,
      padding: {
        bottom: 192,
        left: 48,
        right: 48,
        top: 48,
      },
      zoom: 13.5,
    });
  });

  it('renders markers and emits selection changes from the provider-neutral surface', async () => {
    const onSelectionChange = vi.fn();
    const { fireEvent, render, screen } = await import('@testing-library/react-native');

    render(
      <MapSurface
        markers={markers}
        onSelectionChange={onSelectionChange}
        palette={palette}
        testID="map-surface"
        viewport={viewport}
      />,
    );

    fireEvent.press(screen.getByTestId('map-marker-spring-ein-haniya'));
    expect(onSelectionChange).toHaveBeenCalledWith({
      source: 'marker',
      springId: 'spring-ein-haniya',
    });

    fireEvent.press(screen.getByTestId('map-surface'));
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      source: 'map',
      springId: null,
    });

    const cameraHost = screen.getByTestId('map-surface-camera');
    expect(cameraHost.props.defaultSettings).toBeDefined();
  });
});
