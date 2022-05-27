import React, { useEffect, useState } from 'react';
import 'antd/dist/antd.css';
import CompareJson from './CompareJson';
import { DataProvider } from '@antv/l7-traffic-flow';
import { GaodeMapV2, LineLayer, PointLayer, Scene } from '@antv/l7';
import { bbox, featureCollection, point } from '@turf/turf';
import { debounce } from 'lodash';

const Index: React.FC = () => {
  const [originFlowData, setOriginFlowData] = useState<any>({});
  const [resultLocationData, setResultLocationData] = useState<any>([]);
  const [resultFlowData, setResultFlowData] = useState<any>([]);
  const [scene, setScene] = useState<Scene | null>(null);
  const [pointLayer, setPointLayer] = useState<PointLayer | null>(null);
  const [lineLayer, setLineLayer] = useState<LineLayer | null>(null);

  const [currentZoom, setCurrentZoom] = useState(0);
  const [dataZoom, setDataZoom] = useState(0);
  const [dataProvider, setDataProvider] = useState<DataProvider | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(
        'https://gw.alipayobjects.com/os/bmw-prod/dc7eda1a-fb50-41c6-bee9-7cbd13e84aa5.json',
      ).then((res) => res.json()),
      fetch(
        'https://gw.alipayobjects.com/os/bmw-prod/5b4931cb-afde-4b1d-9b5d-ce3411e29076.json',
      ).then((res) => res.json()),
    ]).then(([locations, flows]) => {
      setOriginFlowData(flows);

      const dataProvider = new DataProvider(
        {
          locations,
          // locations: locations.slice(0, 10),
          flows,
        },
        {
          getFlowId: 'id',
          getLocationWeight: 'weight',
          getFlowFromId: 'from_id',
          getFlowToId: 'to_id',
          getFlowWeight: 'weight',
        },
      );
      setDataProvider(dataProvider);
      setResultLocationData(dataProvider.nodeLevels);
      setResultFlowData(dataProvider.linkLevels);
    });

    const scene = new Scene({
      id: 'map',
      map: new GaodeMapV2({
        style: 'dark',
        center: [120.17427737151957, 35.98158706693357],
        zoom: 4,
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
        .scale('weight', {
          type: 'quantile',
        })
        .size('weight', [5, 20])
        .color(
          'weight',
          ['#f7feae', '#b7e6a5', '#7ccba2', '#46aea0', '#089099', '#00718b', '#045275'].reverse(),
        )
        .style({
          strokeWidth: 1,
        });

      const lineLayer = new LineLayer({})
        .source([], {
          parser: {
            type: 'json',
            x: 'fromLng',
            y: 'fromLat',
            x1: 'toLng',
            y1: 'toLat',
          },
        })
        .shape('line')
        .scale('weight', {
          type: 'quantile',
        })
        .size('weight', [2, 8])
        .color(
          'weight',
          ['#f7feae', '#b7e6a5', '#7ccba2', '#46aea0', '#089099', '#00718b', '#045275'].reverse(),
        )
        .style({
          opacity: 0.8,
        });

      scene.addLayer(lineLayer);
      scene.addLayer(pointLayer);

      // @ts-ignore
      setPointLayer(pointLayer);
      // @ts-ignore
      setLineLayer(lineLayer);
      setScene(scene);

      pointLayer.on('click', (e) => {
        console.log(e);
      });
    });
  }, []);

  useEffect(() => {
    const onZoomChange = debounce(
      () => {
        const { nodes, links } = dataProvider?.getData(
          bbox(featureCollection(scene?.getBounds().map((position) => point(position)) ?? [])),
          scene?.getZoom(),
        );
        pointLayer?.setData(nodes, {
          parser: {
            type: 'json',
            x: 'lng',
            y: 'lat',
          },
        });
        lineLayer?.setData(links, {
          parser: {
            type: 'json',
            x: 'fromLng',
            y: 'fromLat',
            x1: 'toLng',
            y1: 'toLat',
          },
        });
      },
      50,
      {
        maxWait: 50,
      },
    );
    if (
      resultLocationData.length &&
      resultFlowData.length &&
      scene &&
      pointLayer &&
      lineLayer &&
      dataProvider
    ) {
      scene.on('zoomchange', onZoomChange);
      scene.on('mapmove', onZoomChange);
      onZoomChange();
    }

    return () => {
      scene?.off('zoomchange', onZoomChange);
      scene?.off('mapmove', onZoomChange);
    };
  }, [resultLocationData, resultFlowData, scene, pointLayer, lineLayer, dataZoom, dataProvider]);

  return (
    <div>
      <CompareJson
        json1={originFlowData}
        json2={resultFlowData}
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
