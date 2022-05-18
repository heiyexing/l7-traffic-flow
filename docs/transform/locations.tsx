import React, { useEffect, useState } from 'react';
import 'antd/dist/antd.css';
import CompareJson from './CompareJson';
import { DataProvider } from '@antv/l7-traffic-flow';
import { GaodeMapV2, PointLayer, Scene } from '@antv/l7';

const Index: React.FC = () => {
  const [originData, setOriginData] = useState<any>({});
  const [resultData, setResultData] = useState<any>([]);
  const [scene, setScene] = useState<Scene | null>(null);
  const [layer, setLayer] = useState<PointLayer | null>(null);

  useEffect(() => {
    fetch('https://gw.alipayobjects.com/os/bmw-prod/dc7eda1a-fb50-41c6-bee9-7cbd13e84aa5.json')
      .then((res) => res.json())
      .then((locations) => {
        setOriginData(locations);

        const dataProvider = new DataProvider(
          {
            // locations: locations.slice(0, 10),
            locations,
            flows: [],
          },
          {},
        );
        setResultData(dataProvider.nodeLevels);
      });

    const scene = new Scene({
      id: 'map',
      map: new GaodeMapV2({
        style: 'dark',
        center: [120.3187420896896, 36.14463542031832],
      }),
    });
    scene.on('loaded', () => {
      const pointLayer = new PointLayer({})
        .source([], {
          parser: {
            type: 'json',
            x: 'lng',
            y: 'lat',
          },
        })
        .shape('circle')
        .size('weight', [5, 30])
        .color('weight', [
          'rgba(179, 217, 255, 1)',
          'rgba(94,175,255,1)',
          'rgba(53,148,255,1)',
          'rgba(0,119,229,1)',
          'rgba(0,86,183,1)',
          'rgba(0,59,121,1)',
        ])
        // .size('weight', (weight) => (weight ? 5 : 10))
        // .color('weight', (weight) => (weight ? 'white' : 'black'))
        .style({
          strokeWidth: 1,
        });

      scene.addLayer(pointLayer);

      // @ts-ignore
      setLayer(pointLayer);
      setScene(scene);
    });
  }, []);

  useEffect(() => {
    const onZoomChange = () => {
      const zoom = scene?.getZoom() ?? 0;

      const zoomList = resultData.map((item: any) => {
        return Math.abs(item.zoom - zoom);
      });
      const minIndex = zoomList.indexOf(Math.min(...zoomList));
      layer?.setData(resultData[minIndex].nodes, {
        parser: {
          type: 'json',
          x: 'lng',
          y: 'lat',
        },
      });
    };
    if (resultData.length && scene && layer) {
      scene.on('zoomchange', onZoomChange);
      onZoomChange();
    }

    return () => {
      scene?.off('zoomchange', onZoomChange);
    };
  }, [resultData, scene, layer]);

  return (
    <div>
      <CompareJson
        json1={originData}
        json2={resultData}
        title1={'原始OD数据'}
        title2={'转换后的Locations和Flows数据'}
      />
      <div id="map" style={{ height: 500, position: 'relative', marginTop: 16 }}></div>
    </div>
  );
};

export default Index;
