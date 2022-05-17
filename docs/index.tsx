import React, { useEffect } from 'react';
import { Scene, PointLayer } from '@antv/l7';
import { GaodeMapV2 } from '@antv/l7-maps';

const Index: React.FC = () => {
  useEffect(() => {
    const scene = new Scene({
      id: 'map',
      map: new GaodeMapV2({
        pitch: 0,
        style: 'normal',
        center: [140.067171, 36.26186],
        zoom: 5.32,
      }),
    });

    scene.on('loaded', async () => {
      const data = await fetch(
        'https://gw.alipayobjects.com/os/bmw-prod/1efb8add-0fc2-4a22-a9d6-efc68f745694.json',
      ).then((res) => res.json());


    });
  }, []);

  return <div id="map" style={{ height: 500, position: 'relative' }} />;
};

export default Index;
