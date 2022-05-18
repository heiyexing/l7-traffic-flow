import React, { useEffect, useState } from 'react';
import { transformOdData } from '@antv/l7-traffic-flow';
import 'antd/dist/antd.css';
import CompareJson from './CompareJson';

const Index: React.FC = () => {
  const [originData, setOriginData] = useState<any>({});
  const [resultData, setResultData] = useState<any>({});

  useEffect(() => {
    fetch('https://gw.alipayobjects.com/os/bmw-prod/1efb8add-0fc2-4a22-a9d6-efc68f745694.json')
      .then((res) => res.json())
      .then((data) => {
        setOriginData(data);
        setResultData(
          transformOdData(data, {
            getFromLng: 'f_lon',
            getFromLat: 'f_lat',
            getToLng: 't_lon',
            getToLat: 't_lat',
            getWeight: 'value',
          }),
        );
      });
  }, []);

  return (
    <CompareJson
      json1={originData}
      json2={resultData}
      title1={'原始OD数据'}
      title2={'转换后的Locations和Flows数据'}
    />
  );
};

export default Index;
