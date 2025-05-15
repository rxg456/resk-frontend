import { requestClient } from '#/api/request';

/**
 * 获取值班组列表
 * @param param
 * @returns
 */
export const getDutyGroupListApi = async (param: any) => {
  return requestClient.getWithParams('/oncall/duty/group/list', param);
};

/**
 * 新增值班组
 * @param param
 */
export const createDutyGroupApi = async (param: any) => {
  return requestClient.post('/oncall/duty/group', param);
};

/**
 * 更新值班组
 * @param param
 */
export const updateDutyGroupApi = async (id: string, param: any) => {
  return requestClient.put(`/oncall/duty/group/${id}`, param);
};
