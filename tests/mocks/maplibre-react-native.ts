import React, { forwardRef, useImperativeHandle } from 'react';

type MockProps = {
  children?: React.ReactNode;
  [key: string]: unknown;
};

const MapView = forwardRef<object, MockProps>(({ children, ...props }, ref) => {
  useImperativeHandle(ref, () => ({
    getCenter: async () => [35.0818, 31.4117],
    getCoordinateFromView: async () => [35.0818, 31.4117],
    getPointInView: async () => [0, 0],
    getVisibleBounds: async () => [
      [35.92, 33.31],
      [34.2, 29.49],
    ],
    getZoom: async () => 7.2,
    queryRenderedFeaturesAtPoint: async () => ({ features: [], type: 'FeatureCollection' }),
    queryRenderedFeaturesInRect: async () => ({ features: [], type: 'FeatureCollection' }),
    setNativeProps: () => undefined,
    setSourceVisibility: () => undefined,
    showAttribution: async () => undefined,
    takeSnap: async () => '',
  }));

  return React.createElement('MapView', props, children as React.ReactNode);
});

MapView.displayName = 'MapView';

const Camera = forwardRef<object, MockProps>(({ children, ...props }, ref) => {
  useImperativeHandle(ref, () => ({
    fitBounds: () => undefined,
    flyTo: () => undefined,
    moveTo: () => undefined,
    setCamera: () => undefined,
    zoomTo: () => undefined,
  }));

  return React.createElement('Camera', props, children as React.ReactNode);
});

Camera.displayName = 'Camera';

const MarkerView = ({ children, ...props }: MockProps) =>
  React.createElement('MarkerView', props, children);

MarkerView.displayName = 'MarkerView';

export { Camera, MapView, MarkerView };
