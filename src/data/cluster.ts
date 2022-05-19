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
  FlowClusterItem,
} from '../types';
import KDBush from 'kdbush';
import { getUUid, isClusterNode, x2Lng, y2Lat } from '../utils';
import { v4 } from 'uuid';
import { differenceBy, pick } from 'lodash';

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
  const doneIdSet = new Set();

  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (doneIdSet.has(node.id)) {
      continue;
    }
    const innerIndexes = tree.within(node.x, node.y, radius);
    const childIds: string[] = [node.id];
    doneIdSet.add(node.id);

    let weight = node.weight;
    let nodeCount = getNodeCount(node);
    let weightX = node.x * weight;
    let weightY = node.y * weight;

    const clusterId = getUUid();
    if (innerIndexes.length > 1) {
      for (const innerIndex of innerIndexes) {
        const innerNode = tree.points[innerIndex];
        if (doneIdSet.has(innerNode.id)) {
          continue;
        }
        doneIdSet.add(innerNode.id);
        weight += innerNode.weight;
        nodeCount += getNodeCount(innerNode);
        weightX += innerNode.weight * innerNode.x;
        weightY += innerNode.weight * innerNode.y;
        innerNode.clusterId = clusterId;
        childIds.push(innerNode.id);
      }
      // 仅当cluster子节点数量大于1时才升级了新Cluster
      if (childIds.length > 1) {
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
        continue;
      }
    }
    result.push(node);
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
  const originNodes = locations.map((location) => {
    location.zoom = maxZoom;
    return location;
  });
  let oldNodes: NodeItem[] = [...locations];
  let tree = getSearchTree(oldNodes);
  const originTree = tree;
  for (let zoom = maxZoom - zoomStep; zoom >= minZoom; zoom -= zoomStep) {
    const newNodes = getNodesByZoom(oldNodes, tree, zoom, options);
    if (newNodes.length < oldNodes.length) {
      tree = getSearchTree(newNodes);
      nodeLevels.push({
        nodes: newNodes.map((node) => {
          node.zoom = zoom;
          return node;
        }),
        zoom,
        tree,
      });
    }
    oldNodes = newNodes;
  }
  if (nodeLevels.length) {
    const newZoom = nodeLevels[0].zoom + zoomStep;
    nodeLevels.unshift({
      nodes: originNodes.map((node) => {
        if (node.zoom === maxZoom) {
          node.zoom = newZoom;
        }
        return node;
      }),
      zoom: newZoom,
      tree: originTree,
    });
  }
  return nodeLevels;
}

export function getLinkKey(fromId: string, toId: string) {
  return `${fromId},${toId}`;
}

export function addLinkToMap(
  link: LinkItem,
  fromId: string,
  toId: string,
  map: Map<string, LinkItem[]>,
) {
  const key = getLinkKey(fromId, toId);
  map.set(key, (map.get(key) ?? []).concat(link));
}

export function createFlowClusterItem(
  fromId: string,
  toId: string,
  links: LinkItem[],
  zoom: number,
): FlowClusterItem {
  return {
    childIds: links.map((link) => link.id),
    data: undefined,
    fromId,
    id: getUUid(),
    isCluster: true,
    toId,
    weight: links.map((link) => link.weight).reduce((a, b) => a + b, 0),
    zoom,
  };
}

export function getLinkLevels(
  flows: FlowItem[],
  nodeLevels: NodeLevel[],
  nodeMap: NodeMap,
  options: ClusterOptions,
): LinkLevel[] {
  if (!nodeLevels.length || !flows.length) {
    return [];
  }
  const firstZoom = nodeLevels[0].zoom;
  const linkLevels: LinkLevel[] = [
    {
      zoom: firstZoom,
      links: flows.map((flow) => {
        flow.zoom = firstZoom;
        return flow;
      }),
    },
  ];

  let { zoom: preZoom, links: preLinks } = linkLevels[0];

  for (let index = 1; index < nodeLevels.length; index++) {
    const links: LinkItem[] = [];
    const { zoom, nodes } = nodeLevels[index];
    const linkListMap = new Map<string, LinkItem[]>();
    const nodeIdSet = new Set(nodes.map((node) => node.id));
    for (const link of preLinks) {
      let newLink = link;
      let { fromId, toId } = newLink;
      const isFromInNode = nodeIdSet.has(fromId);
      const isToInNode = nodeIdSet.has(toId);
      if (!isFromInNode || !isToInNode) {
        if (!isFromInNode) {
          const fromNode = nodeMap.get(fromId);
          const fromParentId = fromNode?.clusterId;
          if (!isFromInNode && fromParentId && nodeIdSet.has(fromParentId)) {
            fromId = fromParentId;
          }
        }
        if (!isToInNode) {
          const toNode = nodeMap.get(toId);
          const toParentId = toNode?.clusterId;
          if (!isToInNode && toParentId && nodeIdSet.has(toParentId)) {
            toId = toParentId;
          }
        }
        newLink = {
          ...link,
          fromId,
          toId,
          id: getUUid(),
        };
      }
      newLink.zoom = zoom;
      addLinkToMap(newLink, fromId, toId, linkListMap);
    }
    // const linkMap = new Map();
    linkListMap.forEach((linkList, key) => {
      const { fromId, toId } = linkList[0];
      if (fromId === toId) {
        return;
      }
      const link =
        linkList.length === 1 ? linkList[0] : createFlowClusterItem(fromId, toId, linkList, zoom);
      const { lng: fromLng, lat: fromLat } = nodeMap.get(link.fromId)!;
      const { lng: toLng, lat: toLat } = nodeMap.get(link.toId)!;
      Object.assign(link, {
        fromLng,
        fromLat,
        toLng,
        toLat,
      });
      links.push(link);
    });
    linkLevels.push({
      zoom,
      links: links.sort((a, b) => a.weight - b.weight),
    });
    preLinks = links;
    preZoom = zoom;
    // console.log(linkListMap, nodes);
  }
  return linkLevels;
}
