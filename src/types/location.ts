export interface FeatureVector {
  historical: number;
  architectural: number;
  religious: number;
  natural: number;
  cultural: number;
  artistic: number;
  educational: number;
  adventurous: number;
  ancient: number;
  medieval: number;
  colonial: number;
  modern: number;
}

export interface Hotspot {
  id: string;
  type: 'navigation' | 'info' | 'media';
  azimuth: number;
  elevation: number;
  label: string;
  content?: string;
  targetNodeId?: string;
}

export interface TourNode {
  id: string;
  label: string;
  panoramaUrl: string;
  fallbackImageUrl: string;
  connectedNodes: string[];
  hotspots: Hotspot[];
  wikiContext?: string;
}

export type LocationRegion =
  | 'north' | 'south' | 'east' | 'west' | 'northeast' | 'central'   // India sub-regions (legacy)
  | 'europe' | 'asia' | 'africa' | 'oceania'
  | 'north-america' | 'south-america';
export type LocationCategory =
  | 'heritage' | 'temple' | 'fort' | 'museum' | 'nature' | 'spiritual' | 'hill-station'
  | 'modern';

export interface IndiaLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  region: LocationRegion;
  category: LocationCategory;
  lat: number;
  lng: number;
  description: string;
  established?: string;
  unescoStatus: boolean;
  bestSeason: string[];
  tags: string[];
  wikiSlug: string;
  wikimediaCategory: string;
  features: FeatureVector;
  nodes: TourNode[];
}
