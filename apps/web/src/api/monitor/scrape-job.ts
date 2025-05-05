import { requestClient } from '#/api/request';

/**
 * 获取采集任务列表
 * @param poolId 采集池ID
 * @param param 查询参数
 * @returns
 */
export const getScrapeJobListByPoolIdApi = async (
  poolId: string,
  param: any,
) => {
  return requestClient.getWithParams(`/scrape/pool/${poolId}/job/list`, param);
};

/**
 * 删除采集任务
 * @param jobId 采集任务ID
 */
export const deleteScrapeJobApi = async (jobId: string) => {
  return requestClient.delete(`/scrape/job/${jobId}`);
};

/**
 * 更新采集任务
 * @param jobId 采集任务ID
 * @param param 更新参数
 */
export const updateScrapeJobApi = async (jobId: string, param: any) => {
  return requestClient.put(`/scrape/job/${jobId}`, param);
};

/**
 * 新增采集任务
 * @param poolId 采集池ID
 * @param param 新增参数
 */
export const createScrapeJobByPoolIdApi = async (
  poolId: string,
  param: any,
) => {
  return requestClient.post(`/scrape/pool/${poolId}/job`, param);
};

/**
 * 更新采集任务状态
 * @param jobId 采集任务ID
 * @param param 更新参数
 */
export const updateScrapeJobStatusApi = async (jobId: string, param: any) => {
  return requestClient.put(`/scrape/job/${jobId}/status`, param);
};
