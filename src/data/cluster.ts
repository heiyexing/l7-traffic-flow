import {
  ClusterItem,
  NodeLevel,
  LocationItem,
  MapState,
  NodeItem,
  ClusterOptions,
  NodeMap,
  LinkItem,
  LinkLevel,
  FlowItem,
} from '../types';
import KDBush from 'kdbush';
import { isClusterNode, x2Lng, y2Lat } from '../utils';
import { v4 } from 'uuid';

export function createClusterItem({
  x,
  y,
  zoom,
  childIds,
  id,
  weight,
}: {
  x: number;
  y: number;
  zoom: number;
  childIds: string[];
  id: string;
  weight: number;
}): ClusterItem {
  return {
    childIds,
    id,
    isCluster: true,
    lng: x2Lng(x),
    lat: y2Lat(y),
    weight,
    x,
    y,
    zoom,
  };
}

/**
 * 生成kdbush搜索树
 * @param nodes
 */
export function getSearchTree(nodes: NodeItem[]) {
  return new KDBush<NodeItem>(
    nodes,
    (p) => p.x,
    (p) => p.y,
    64,
    Float64Array,
  );
}

export function getNodeCount(node: NodeItem) {
  return (isClusterNode(node) ? (node as ClusterItem).childIds?.length : 1) ?? 1;
}

export function sortNodesByWeight(nodes: NodeItem[]) {
  return nodes.sort((a, b) => a.weight - b.weight);
}

export function getNodesByZoom(
  nodes: NodeItem[],
  tree: KDBush<NodeItem>,
  zoom: number,
  options: ClusterOptions,
): NodeItem[] {
  const result: NodeItem[] = [];
  const radius = 40 / (512 * Math.pow(2, zoom));
  const set = new Set();

  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (set.has(node.id)) {
      continue;
    }
    const innerIndexes = tree.within(node.x, node.y, radius);
    const childIds: string[] = [node.id];
    node.zoom = zoom;
    set.add(node.id);

    let weight = node.weight;
    let nodeCount = getNodeCount(node);
    let weightX = node.x * weight;
    let weightY = node.y * weight;

    const clusterId = v4();
    if (innerIndexes.length > 1) {
      for (const innerIndex of innerIndexes) {
        const innerNode = tree.points[innerIndex];
        if (set.has(innerNode.id)) {
          continue;
        }
        innerNode.zoom = zoom;
        set.add(innerNode.id);
        weight += innerNode.weight;
        nodeCount += getNodeCount(innerNode);
        weightX += innerNode.weight * innerNode.x;
        weightY += innerNode.weight * innerNode.y;
        innerNode.clusterId = clusterId;
        childIds.push(innerNode.id);
      }
      node.clusterId = clusterId;
      result.push(
        createClusterItem({
          x: weightX / weight,
          y: weightY / weight,
          childIds,
          id: clusterId,
          weight,
          zoom,
        }),
      );
    } else {
      result.push(node);
    }
  }
  return sortNodesByWeight(result);
}

/**
 * 遍历所有zoom层级，获取所有聚合点经纬度
 * @param locations
 * @param options
 */
export function getNodeLevels(locations: LocationItem[], options: ClusterOptions): NodeLevel[] {
  if (!locations.length) {
    return [];
  }
  const nodeLevels: NodeLevel[] = [];
  const { minZoom, maxZoom, zoomStep } = options;
  let nodes: NodeItem[] = [...locations];
  let tree = getSearchTree(nodes);
  const originTree = tree;
  for (let zoom = maxZoom - zoomStep; zoom >= minZoom; zoom -= zoomStep) {
    const newClusters = getNodesByZoom(nodes, tree, zoom, options);
    if (newClusters.length < nodes.length) {
      tree = getSearchTree(newClusters);
      nodeLevels.push({
        nodes: newClusters,
        zoom,
        tree,
      });
    }
    nodes = newClusters;
  }
  if (nodeLevels.length) {
    nodeLevels.unshift({
      nodes: [...locations],
      zoom: nodeLevels[0].zoom + zoomStep,
      tree: originTree,
    });
  }
  return nodeLevels;
}

export function getFromIdMap(flows: FlowItem[]): Map<string, FlowItem[]> {
  const map = new Map<string, FlowItem[]>();
  flows.forEach((flow) => {
    map.set(flow.fromId, (map.get(flow.fromId) ?? []).concat(flow));
  });
  return map;
}

export function getLinkLevels(
  flows: FlowItem[],
  nodeLevels: NodeLevel[],
  nodeMap: NodeMap,
  options: ClusterOptions,
): LinkLevel[] {
  debugger;
  if (!nodeLevels.length || !flows.length) {
    return [];
  }

  let fromIdMap = getFromIdMap(flows);
  console.log(fromIdMap);
  const linkLevels: LinkLevel[] = [];
  for (const { nodes, zoom } of nodeLevels) {
    const nodeIdSet = new Set(nodes.map((item) => item.id));
    // nodeIdSet.forEach((id) => {});
  }
  return linkLevels;
}
