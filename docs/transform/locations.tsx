import React, { useEffect, useState } from 'react';
import 'antd/dist/antd.css';
import CompareJson from './CompareJson';
import { DataProvider } from '@antv/l7-traffic-flow';
import { GaodeMapV2, PointLayer, Scene } from '@antv/l7';

const Index: React.FC = () => {
  const [originData, setOriginData] = useState<any>({});
  const [resultData, setResultData] = useState<any>([]);
  const [scene, setScene] = useState<Scene | null>(null);
  const [pointLayer, setPointLayer] = useState<PointLayer | null>(null);
  const [textLayer, setTextLayer] = useState<PointLayer | null>(null);
  const [currentZoom, setCurrentZoom] = useState(0);
  const [dataZoom, setDataZoom] = useState(0);

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
        .size('weight', [2, 30])
        .color('weight', [
          'rgba(179, 217, 255, 1)',
          'rgba(94,175,255,1)',
          'rgba(53,148,255,1)',
          'rgba(0,119,229,1)',
          'rgba(0,86,183,1)',
          'rgba(0,59,121,1)',
        ])
        .style({
          strokeWidth: 1,
        });

      const textLayer = new PointLayer({})
        .source([], {
          parser: {
            type: 'json',
            x: 'lng',
            y: 'lat',
          },
        })
        .shape('zoom', 'text')
        .size(20)
        .color('#ff0000')
        .style({
          strokeWidth: 1,
          textAllowOverlap: true,
        });

      scene.addLayer(pointLayer);
      scene.addLayer(textLayer);

      // @ts-ignore
      setPointLayer(pointLayer);
      // @ts-ignore
      setTextLayer(textLayer);
      setScene(scene);

      pointLayer.on('click', (e) => {
        console.log(e);
      });
    });
  }, []);

  useEffect(() => {
    const onZoomChange = () => {
      const zoom = scene?.getZoom() ?? 0;
      setCurrentZoom(zoom);

      const zoomList = resultData.map((item: any) => {
        return Math.abs(item.zoom - zoom);
      });
      const minIndex = zoomList.indexOf(Math.min(...zoomList));
      const { zoom: newDataZoom, nodes } = resultData[minIndex];
      if (newDataZoom === dataZoom) {
        return;
      }
      setDataZoom(newDataZoom);
      pointLayer?.setData(nodes, {
        parser: {
          type: 'json',
          x: 'lng',
          y: 'lat',
        },
      });
      // textLayer?.setData(nodes, {
      //   parser: {
      //     type: 'json',
      //     x: 'lng',
      //     y: 'lat',
      //   },
      // });
    };
    if (resultData.length && scene && pointLayer) {
      scene.on('zoomchange', onZoomChange);
      onZoomChange();
    }

    return () => {
      scene?.off('zoomchange', onZoomChange);
    };
  }, [resultData, scene, pointLayer, textLayer, dataZoom]);

  return (
    <div>
      <CompareJson
        json1={originData}
        json2={resultData}
        title1={'原始OD数据'}
        title2={'转换后的Locations和Flows数据'}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>当前展示层级为：{currentZoom}</span>
        <span>数据展示层级为：{dataZoom}</span>
      </div>
      <div id="map" style={{ height: 500, position: 'relative' }}></div>
    </div>
  );
};

export default Index;
