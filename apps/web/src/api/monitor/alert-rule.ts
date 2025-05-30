import { requestClient } from '#/api/request';

/**
 * 获取告警规则列表
 * @param param
 * @returns
 */
export const getAlertRuleListApi = async (param: any) => {
  return requestClient.getWithParams('/alert/rule/list', param);
};

/**
 * 创建告警规则
 * @param param
 * @returns
 */
export const createAlertRuleApi = async (param: any) => {
  return requestClient.post('/alert/rule', param);
};
/**
 * 删除告警规则
 * @param ruleId
 */
export const deleteAlertRuleApi = async (ruleId: string) => {
  return requestClient.delete(`/alert/rule/${ruleId}`);
};

/**
 * 更新告警规则
 * @param ruleId
 */
export const updateAlertRuleApi = async (ruleId: string, param: any) => {
  return requestClient.put(`/alert/rule/${ruleId}`, param);
};

/**
 * 检测告警规则表达式
 * @param param
 */
export const checkAlertRuleExprApi = async (param: any) => {
  return requestClient.post('/alert/rule/check', param);
};

/**
 * 批量修改告警规则状态
 * @param param
 */
export const batchUpdateAlertRuleStatusApi = async (param: any) => {
  return requestClient.put('/alert/rule/batch/status', param);
};

/**
 * 批量创建告警规则
 * @param param
 */
export const batchCreateAlertRuleApi = async (param: any) => {
  return requestClient.post('/alert/rule/batch', param);
};
