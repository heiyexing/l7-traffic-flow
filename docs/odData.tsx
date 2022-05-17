import React, { useEffect, useState } from 'react';
import { transformOdData } from '@antv/l7-traffic-flow';
import { Col, Row } from 'antd';
import 'antd/dist/antd.css';
import { JSONTree } from 'react-json-tree';

const theme = {
  scheme: 'monokai',
  author: 'wimer hazenberg (http://www.monokai.nl)',
  base00: '#272822',
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672',
  base09: '#fd971f',
  base0A: '#f4bf75',
  base0B: '#a6e22e',
  base0C: '#a1efe4',
  base0D: '#66d9ef',
  base0E: '#ae81ff',
  base0F: '#cc6633',
};

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
            f_lng: 'f_lon',
            t_lng: 't_lon',
          }),
        );
      });
  }, []);

  return (
    <Row>
      <Col span={12} style={{ maxHeight: 300, overflow: 'auto' }}>
        <p style={{ marginBottom: 0 }}>原始OD数据</p>
        <JSONTree data={originData} theme={theme} />
      </Col>
      <Col span={12} style={{ maxHeight: 300, overflow: 'auto' }}>
        <p style={{ marginBottom: 0 }}>转换后的Locations和Flows数据</p>
        <JSONTree data={resultData} theme={theme} />
      </Col>
    </Row>
  );
};

export default Index;
