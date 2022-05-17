import { LocationData, TotalData } from '../types';

class DataProvider {
  originData: TotalData;

  locationMap: Map<string, LocationData> = new Map();

  constructor(data: TotalData) {
    this.originData = data;
    this.updateLocationMap();
  }

  updateLocationMap() {
    this.locationMap.clear();
    this.originData.locations.forEach((location) => {
      this.locationMap.set(location.id, location);
    });
  }
}
