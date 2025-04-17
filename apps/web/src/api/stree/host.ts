import { requestClient } from '#/api/request';

/**
 * 获取主机列表
 * @param param
 * @returns
 */
export const getHostListApi = async (param: any) => {
  return requestClient.getWithParams('/host/list', param);
};

/**
 * 获取树节点主机列表
 * @param nodeId
 * @param param
 * @returns
 */
export const getHostListByNodeIdApi = async (nodeId: number, param: any) => {
  return requestClient.get(`/host/stree-node/${nodeId}/list`, param);
};

/**
 * 获取树节点可用主机列表(包括已分配到此节点的主机)
 * @param nodeId
 * @param param
 * @returns
 */
export const getStreeNodeAvailableHostsApi = async (
  nodeId: number,
  param: any,
) => {
  return requestClient.get(`/host/stree-node/${nodeId}/available-list`, param);
};

/**
 * 删除主机
 * @param hostId
 */
export const deleteHostApi = async (hostId: string) => {
  return requestClient.delete(`/host/${hostId}`);
};

/**
 * 更新主机
 * @param hostId
 */
export const updateHostApi = async (hostId: string, param: any) => {
  return requestClient.put(`/host/${hostId}`, param);
};

/**
 * 新增主机
 * @param param
 */
export const createHostApi = async (param: any) => {
  return requestClient.post('/host', param);
};
