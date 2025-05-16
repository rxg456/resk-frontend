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

/**
 * 删除值班组
 * @param id
 */
export const deleteDutyGroupApi = async (id: string) => {
  return requestClient.delete(`/oncall/duty/group/${id}`);
};

/**
 * 获取值班组详情
 * @param id
 */
export const getDutyGroupDetailApi = async (id: string) => {
  return requestClient.get(`/oncall/duty/group/${id}`);
};

/**
 * 获取值班组值班数据
 * @param id 值班组ID
 * @param params 查询参数，支持startDate和endDate
 */
export const getDutyGroupDutyDataApi = async (
  id: string,
  params?: { endDate?: string; startDate?: string },
) => {
  return requestClient.getWithParams(
    `/oncall/duty/group/${id}/calendar`,
    params,
  );
};
