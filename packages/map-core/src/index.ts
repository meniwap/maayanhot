import type {
  BoundingBox,
  GeoPoint,
  ProjectionFreshness,
  SpringId,
  WaterPresence,
} from '@maayanhot/contracts';

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

export type MapClusterDescriptor = {
  id: string;
  coordinate: GeoPoint;
  springIds: SpringId[];
  pointCount: number;
};

export interface MapAdapter {
  syncAnnotations(input: {
    markers: MapMarkerDescriptor[];
    clusters?: MapClusterDescriptor[];
  }): Promise<void> | void;
  setViewport(viewport: MapViewport): Promise<void> | void;
  focusCamera(request: MapCameraRequest): Promise<void> | void;
}
