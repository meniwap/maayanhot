import type {
  BoundingBox,
  GeoPoint,
  ProjectionFreshness,
  SpringId,
  WaterPresence,
} from '@maayanhot/contracts';
import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { MapSurface } from './MapSurface';
import { CoordinatePickerSurface } from './CoordinatePickerSurface';
import { buildInitialCameraRequest, buildSelectionCameraRequest } from './camera';
import { describeMarker } from './presentation';

export type MapViewport = BoundingBox & {
  center?: GeoPoint;
  zoom?: number;
};

export type MapMarkerDescriptor = {
  springId: SpringId;
  coordinate: GeoPoint;
  title: string;
  waterPresence: WaterPresence;
  freshness: ProjectionFreshness;
  isSelected: boolean;
};

export type MapCameraRequest = {
  center?: GeoPoint;
  bounds?: BoundingBox;
  zoom?: number;
  animated?: boolean;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

export type MapSelectionChange = {
  springId: SpringId | null;
  source: 'map' | 'marker';
};

export type MapMarkerAppearance = {
  fillColor: string;
  borderColor: string;
  ringColor: string;
  ringWidth: number;
  size: number;
};

export type MapSurfacePalette = {
  water: string;
  noWater: string;
  unknown: string;
  stale: string;
  selectedRing: string;
  outline: string;
  markerSurface: string;
};

export type MapSurfaceProps = {
  mapStyle?: object | string;
  markers: MapMarkerDescriptor[];
  onSelectionChange?: (change: MapSelectionChange) => void;
  palette: MapSurfacePalette;
  selectionPaddingBottom?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  viewport: MapViewport;
};

export type MapAdapterComponent = ComponentType<MapSurfaceProps>;

export type CoordinatePickerChange = {
  coordinate: GeoPoint;
  source: 'map' | 'manual';
};

export type CoordinatePickerSurfaceProps = {
  onChange?: (change: CoordinatePickerChange) => void;
  palette: MapSurfacePalette;
  selectedCoordinate: GeoPoint | null;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  viewport: MapViewport;
};

export interface MapAdapter {
  CoordinatePickerSurface: ComponentType<CoordinatePickerSurfaceProps>;
  Surface: MapAdapterComponent;
}

export const mapLibreAdapter: MapAdapter = {
  CoordinatePickerSurface,
  Surface: MapSurface,
};

export {
  CoordinatePickerSurface,
  MapSurface,
  buildInitialCameraRequest,
  buildSelectionCameraRequest,
  describeMarker,
};
