import React, { useEffect } from 'react';
import { transformOdData } from '@antv/l7-traffic-flow';

const Index: React.FC = () => {
  useEffect(() => {
    fetch('https://gw.alipayobjects.com/os/bmw-prod/1efb8add-0fc2-4a22-a9d6-efc68f745694.json')
      .then((res) => res.json())
      .then((data) => {
        console.log(
          transformOdData(data, {
            f_lng: 'f_lon',
            t_lng: 't_lon',
          }),
        );
      });
  }, []);

  return <></>;
};

export default Index;
