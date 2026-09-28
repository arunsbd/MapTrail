export type MapTrailRegion =
  | "United States"
  | "North America"
  | "South America"
  | "Europe"
  | "Africa"
  | "Asia"
  | "Oceania";

export type PolygonReference = {
  source: string;
  featureId: string;
};

export type GeographicPoint = {
  longitude: number;
  latitude: number;
};

export type GeographyPlace<PlaceId extends string> = {
  id: PlaceId;
  name: string;
  aliases: readonly string[];
  polygon: PolygonReference;
  centroid?: GeographicPoint;
  labelPoint?: GeographicPoint;
  terrestrialNeighbors: readonly PlaceId[];
  gameRegion: MapTrailRegion;
};

export type GeographyDataset<PlaceId extends string> = {
  id: string;
  version: string;
  label: string;
  placeKind: "state" | "country";
  places: readonly GeographyPlace<PlaceId>[];
};
