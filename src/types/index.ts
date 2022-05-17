export type LocationData = {
  id: string;
  lng: number;
  lat: number;
};

export type FlowData = {
  from_id: string;
  to_id: string;
  value: number;
}

export type OdData = {
  from_lng: string;
  from_lat: string;
  to_lng: string;
  to_lat: string;
  value: string;
  [key: string]: any;
};
