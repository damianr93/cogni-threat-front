declare module "react-simple-maps" {
  import { ComponentType, SVGProps } from "react";

  export interface GeographyProps {
    geography: any;
    style?: {
      default?: SVGProps<SVGPathElement>;
      hover?: SVGProps<SVGPathElement>;
      pressed?: SVGProps<SVGPathElement>;
    };
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseMove?: (event: React.MouseEvent) => void;
    onMouseLeave?: () => void;
  }

  export interface GeographiesProps {
    geography: string;
    children: (props: { geographies: any[] }) => React.ReactNode;
  }

  export interface ComposableMapProps {
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
    };
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export interface ZoomableGroupProps {
    children?: React.ReactNode;
    zoom?: number;
    center?: [number, number];
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
}

