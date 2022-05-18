import React from 'react';
import { Col, Row } from 'antd';
import { JSONTree } from 'react-json-tree';
import { theme } from './theme';

interface IProps {
  json1: any;
  json2: any;
  title1: string;
  title2: string;
}

const CompareJson: React.FC<IProps> = ({ json1, json2, title2, title1 }) => {
  return (
    <Row>
      <Col span={12} style={{ maxHeight: 300, overflow: 'auto' }}>
        <p style={{ marginBottom: 0 }}>{title1}</p>
        <JSONTree data={json1} theme={theme} />
      </Col>
      <Col span={12} style={{ maxHeight: 300, overflow: 'auto' }}>
        <p style={{ marginBottom: 0 }}>{title2}</p>
        <JSONTree data={json2} theme={theme} />
      </Col>
    </Row>
  );
};

export default CompareJson;
