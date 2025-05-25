import { requestClient } from '#/api/request';

/**
 * 获取告警池列表
 * @param param
 * @returns
 */
export const getAlertPoolListApi = async (param: any) => {
  return requestClient.getWithParams('/alert/pool/list', param);
};

/**
 * 删除告警池
 * @param poolId
 */
export const deleteAlertPoolApi = async (poolId: string) => {
  return requestClient.delete(`/alert/pool/${poolId}`);
};

/**
 * 更新告警池
 * @param poolId
 */
export const updateAlertPoolApi = async (poolId: string, param: any) => {
  return requestClient.put(`/alert/pool/${poolId}`, param);
};

/**
 * 新增告警池
 * @param param
 */
export const createAlertPoolApi = async (param: any) => {
  return requestClient.post('/alert/pool', param);
};

/**
 * 获取告警池实例配置
 * @param param
 */
export const getAlertPoolInstanceConfigApi = async (param: any) => {
  return requestClient.getWithParams(`/alert/alertmanager/main`, param);
};
