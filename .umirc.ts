import { defineConfig } from 'dumi';

const prefixPath = 'l7-traffic-flow';

export default defineConfig({
  title: 'L7TrafficFlow',
  favicon:
    'https://user-images.githubusercontent.com/9554297/83762004-a0761b00-a6a9-11ea-83b4-9c8ff721d4b8.png',
  logo: 'https://user-images.githubusercontent.com/9554297/83762004-a0761b00-a6a9-11ea-83b4-9c8ff721d4b8.png',
  outputPath: 'docs-dist',
  publicPath: `/${prefixPath}/`,
  base: `/${prefixPath}/`,
  // more config: https://d.umijs.org/config
});
