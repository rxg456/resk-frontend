import { requestClient } from '#/api/request';

/**
 * 获取告警发送组列表
 * @param param
 * @returns
 */
export const getAlertSendGroupListApi = async (param: any) => {
  return requestClient.getWithParams('/alert/send/group/list', param);
};

/**
 * 删除告警发送组
 * @param groupId
 */
export const deleteAlertSendGroupApi = async (groupId: string) => {
  return requestClient.delete(`/alert/send/group/${groupId}`);
};

/**
 * 更新告警发送组
 * @param groupId
 */
export const updateAlertSendGroupApi = async (groupId: string, param: any) => {
  return requestClient.put(`/alert/send/group/${groupId}`, param);
};

/**
 * 新增告警发送组
 * @param param
 */
export const createAlertSendGroupApi = async (param: any) => {
  return requestClient.post('/alert/send/group', param);
};
