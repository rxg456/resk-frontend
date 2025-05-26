/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { POSITION, useToast } from 'vue-toastification';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { useAuthStore } from '#/store';

import { refreshTokenApi } from './core';

const toast = useToast();

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired. ');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();

    // 显示通用401错误消息
    toast.error('认证失败或权限不足，请重新登录', {
      timeout: 2000,
      position: POSITION.TOP_CENTER,
    });

    accessStore.setAccessToken(null);
    // 延迟执行登出操作
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        if (
          preferences.app.loginExpiredMode === 'modal' &&
          accessStore.isAccessChecked
        ) {
          accessStore.setLoginExpired(true);
        } else {
          await authStore.logout();
        }
        resolve();
      }, 2000); // 延迟2秒执行登出，确保错误消息能显示
    });
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi();
    const newToken = resp.data;
    accessStore.setAccessToken(newToken);
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  // 添加成功响应的处理拦截器
  // code 为 0 时且 msg 存在时，显示成功提示
  client.addResponseInterceptor({
    fulfilled: (response) => {
      try {
        const { data: responseData } = response;
        // 检查原始响应中的data部分
        const originalData = responseData;
        if (responseData.code === 0 && responseData.msg) {
          // 显示成功提示
          toast.success(originalData.msg, {
            timeout: 3000,
            position: POSITION.TOP_RIGHT,
          });
        }
      } catch {
        toast.error('处理成功响应提示时出错:', {
          timeout: 5000,
          position: POSITION.TOP_RIGHT,
        });
      }
      return response;
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 这里可以根据业务进行定制,你可以拿到 error 内的信息进行定制化处理，根据不同的 code 做不同的提示，而不是直接使用 message.error 提示 msg
      // 当前接口返回的错误字段是 error 或者 message 或者 msg
      const responseData = error?.response?.data ?? {};
      const errorMessage =
        responseData?.error ?? responseData?.message ?? responseData?.msg ?? '';
      const code = responseData.code ?? 0;

      // 如果没有错误信息，则会根据状态码进行提示
      toast.error(errorMessage || msg, {
        timeout: 3000,
        position: POSITION.TOP_CENTER,
      });

      if (code === 10_005) {
        setTimeout(() => {
          doReAuthenticate();
        }, 3000);
      }
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
