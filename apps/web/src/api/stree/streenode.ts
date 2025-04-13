import { requestClient } from '#/api/request';

/**
 * 获取顶级节点
 */
export const getTopStreeNodesApi = async () => {
  return requestClient.get('/stree/getTopStreeNodes');
};

/**
 * 获取所有节点
 */
export const getAllStreeNodesApi = async () => {
  return requestClient.get('/stree/getAllStreeNodes');
};

/**
 * 获取所有非叶子节点
 */
export const getAllNonLeafStreeNodesApi = async () => {
  return requestClient.get('/stree/getAllNonLeafStreeNodes');
};

/**
 * 获取节点下一级信息
 */
export const getNextLevelStreeNodesApi = async (pid: string) => {
  return requestClient.get(`/stree/${pid}/nextLevel`);
};

/**
 * 新增节点
 *
 * @param data 数据
 * @returns
 */
export const createStreeNodeApi = async (data: any) => {
  return requestClient.post('/stree', data);
};

/**
 * 删除节点
 *
 * @param id 节点id
 * @returns
 */
export const deleteStreeNodeApi = async (id: number) => {
  return requestClient.delete(`/stree/${id}`);
};

/**
 * 更新节点
 *
 * @param id 节点id
 * @param data 数据
 * @returns
 */
export const updateStreeNodeApi = async (id: number, data: any) => {
  return requestClient.put(`/stree/${id}`, data);
};
