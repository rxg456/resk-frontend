import { requestClient } from '#/api/request';

/**
 * 获取采集池列表
 * @param param
 * @returns
 */
export const getScrapePoolListApi = async (param: any) => {
  return requestClient.getWithParams('/scrape/pool/list', param);
};

/**
 * 删除采集池
 * @param poolId
 */
export const deleteScrapePoolApi = async (poolId: string) => {
  return requestClient.delete(`/scrape/pool/${poolId}`);
};

/**
 * 更新采集池
 * @param poolId
 */
export const updateScrapePoolApi = async (poolId: string, param: any) => {
  return requestClient.put(`/scrape/pool/${poolId}`, param);
};

/**
 * 新增采集池
 * @param param
 */
export const createScrapePoolApi = async (param: any) => {
  return requestClient.post('/scrape/pool', param);
};

/**
 * 获取采集池实例配置
 * @param param
 */
export const getScrapePoolInstanceConfigApi = async (param: any) => {
  return requestClient.getWithParams(`/scrape/prometheus/main`, param);
};
