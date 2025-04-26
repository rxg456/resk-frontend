import { useAccessStore } from '@vben/stores';
import { ref } from 'vue';
import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import { POSITION, useToast } from 'vue-toastification';

const toast = useToast();
const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

// WebSocket状态
const wsStatus = ref<'connecting' | 'open' | 'closed' | 'error'>('closed');
// WebSocket实例
let ws: WebSocket | null = null;
// 重连计时器
let reconnectTimer: NodeJS.Timeout | null = null;
// 心跳计时器
let heartbeatTimer: NodeJS.Timeout | null = null;
// 重连次数
let reconnectCount = 0;
// 最大重连次数
const MAX_RECONNECT_COUNT = 5;
// 重连间隔(ms)
const RECONNECT_INTERVAL = 5000;
// 心跳间隔(ms)
const HEARTBEAT_INTERVAL = 30000;

// 消息处理函数集合
const messageHandlers: Record<string, ((data: any) => void) | undefined> = {};

/**
 * 创建WebSocket连接
 */
export function createWebSocketConnection() {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    console.log('WebSocket连接已存在');
    return;
  }

  try {
    wsStatus.value = 'connecting';

    // 获取认证token
    const accessStore = useAccessStore();
    const token = accessStore.accessToken;

    // 转换API URL为WebSocket URL (http -> ws, https -> wss)
    const wsUrl = apiURL.replace(/^http/, 'ws');
    const url = new URL('/ws', wsUrl);

    // 添加认证token
    if (token) {
      url.searchParams.append('token', token);
    }

    // 添加语言参数
    url.searchParams.append('lang', preferences.app.locale);

    // 创建WebSocket实例
    ws = new WebSocket(url.toString());

    // 连接打开
    ws.onopen = handleOpen;
    // 接收消息
    ws.onmessage = handleMessage;
    // 错误处理
    ws.onerror = handleError;
    // 连接关闭
    ws.onclose = handleClose;

    return ws;
  } catch (error) {
    console.error('创建WebSocket连接失败:', error);
    wsStatus.value = 'error';
    scheduleReconnect();
  }
}

/**
 * 关闭WebSocket连接
 */
export function closeWebSocketConnection() {
  clearTimers();

  if (ws) {
    // 正常关闭连接
    ws.close(1000, '用户主动关闭连接');
    ws = null;
  }

  wsStatus.value = 'closed';
}

/**
 * 处理连接打开事件
 */
function handleOpen() {
  wsStatus.value = 'open';
  reconnectCount = 0;
  console.log('WebSocket连接已打开');

  // 开始发送心跳
  startHeartbeat();

  // 通知连接成功
  toast.success('实时连接已建立', {
    timeout: 2000,
    position: POSITION.BOTTOM_RIGHT,
  });
}

/**
 * 处理接收消息事件
 */
function handleMessage(event: MessageEvent) {
  try {
    const data = JSON.parse(event.data);
    console.log('收到WebSocket消息:', data);

    // 处理心跳响应
    if (data.type === 'pong') {
      return;
    }

    // 根据消息类型分发到对应的处理函数
    if (data.type && typeof messageHandlers[data.type] === 'function') {
      const handler = messageHandlers[data.type] as (data: any) => void;
      handler(data);
    }

    // 触发全局消息事件
    document.dispatchEvent(new CustomEvent('ws-message', { detail: data }));
  } catch (error) {
    console.error('处理WebSocket消息失败:', error);
  }
}

/**
 * 处理错误事件
 */
function handleError(event: Event) {
  console.error('WebSocket错误:', event);
  wsStatus.value = 'error';

  toast.error('WebSocket连接出错', {
    timeout: 3000,
    position: POSITION.BOTTOM_RIGHT,
  });
}

/**
 * 处理连接关闭事件
 */
function handleClose(event: CloseEvent) {
  wsStatus.value = 'closed';
  ws = null;

  // 清除定时器
  clearTimers();

  console.log(`WebSocket连接已关闭: 代码=${event.code}, 原因=${event.reason}`);

  // 如果不是正常关闭，尝试重连
  if (event.code !== 1000) {
    scheduleReconnect();
  }
}

/**
 * 发送消息
 */
export function sendWebSocketMessage(data: any) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error('WebSocket未连接，无法发送消息');
    return false;
  }

  try {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    ws.send(message);
    return true;
  } catch (error) {
    console.error('发送WebSocket消息失败:', error);
    return false;
  }
}

/**
 * 注册消息处理函数
 */
export function registerMessageHandler(
  type: string,
  handler: (data: any) => void,
) {
  messageHandlers[type] = handler;
}

/**
 * 取消注册消息处理函数
 */
export function unregisterMessageHandler(type: string) {
  delete messageHandlers[type];
}

/**
 * 启动心跳检测
 */
function startHeartbeat() {
  clearTimers();

  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      sendWebSocketMessage({
        type: 'ping',
        timestamp: new Date().toISOString(),
      });
    }
  }, HEARTBEAT_INTERVAL);
}

/**
 * 安排重连
 */
function scheduleReconnect() {
  if (reconnectTimer || reconnectCount >= MAX_RECONNECT_COUNT) {
    if (reconnectCount >= MAX_RECONNECT_COUNT) {
      console.log('达到最大重连次数，停止重连');
      toast.error('无法建立WebSocket连接，请刷新页面重试', {
        timeout: 0, // 不自动关闭
        position: POSITION.BOTTOM_RIGHT,
      });
    }
    return;
  }

  reconnectCount++;
  console.log(`安排重连 (${reconnectCount}/${MAX_RECONNECT_COUNT})...`);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    createWebSocketConnection();
  }, RECONNECT_INTERVAL);
}

/**
 * 清除所有定时器
 */
function clearTimers() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

/**
 * 获取WebSocket连接状态
 */
export function getWebSocketStatus() {
  return wsStatus;
}

/**
 * 检查WebSocket是否已连接
 */
export function isWebSocketConnected() {
  return wsStatus.value === 'open';
}
