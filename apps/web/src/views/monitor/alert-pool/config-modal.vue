<script lang="ts" setup>
import type { TabOption } from '@vben/types';

import { computed, ref } from 'vue';
import { POSITION, useToast } from 'vue-toastification';

import { ReskTabs, useVbenModal } from '@vben/common-ui';

import hljs from 'highlight.js';

import { getAlertPoolInstanceConfigApi } from '#/api';
import { $t } from '#/locales';

import 'highlight.js/styles/a11y-light.css'; // 可以选择其他样式

const toast = useToast();

// 父组件传入的数据
const data = ref();
// 加载状态
const loading = ref(false);
// 标题
const title = computed(() => `${data.value?.host_ip}配置详情`);

// 存储主配置YAML
const mainConfigYaml = ref('');
// 存储规则配置YAML
const ruleConfigYaml = ref('');
// 存储格式化后的HTML内容
const mainConfigHtml = ref('');
const ruleConfigHtml = ref('');

// 配置详情
const configTabs: TabOption[] = [
  {
    label: $t('page.monitor.scrapePool.config.tabs.mainConfig'),
    value: 'main-config',
  },
];

// 加载配置数据
async function loadConfigData() {
  try {
    loading.value = true;

    // 加载主配置数据
    const mainConfig = await getAlertPoolInstanceConfigApi({
      ip: data.value.host_ip,
    });
    mainConfigYaml.value = mainConfig || '';

    // 使用highlight.js格式化YAML
    mainConfigHtml.value = hljs.highlight(mainConfigYaml.value, {
      language: 'yaml',
    }).value;

    // 加载规则配置数据
    const ruleConfig = await getAlertPoolInstanceConfigApi({
      ip: data.value.host_ip,
    });

    ruleConfigYaml.value = ruleConfig || '';
    ruleConfigHtml.value = hljs.highlight(ruleConfigYaml.value, {
      language: 'yaml',
    }).value;
  } catch {
    toast.error('获取配置失败', {
      timeout: 3000,
      position: POSITION.TOP_CENTER,
    });
  } finally {
    loading.value = false;
  }
}

// 复制到剪贴板
function copyToClipboard(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.success('配置已复制到剪贴板', {
        timeout: 1000,
        position: POSITION.TOP_RIGHT,
      });
    })
    .catch(() => {
      toast.error('无法复制文本: ', {
        timeout: 3000,
        position: POSITION.TOP_CENTER,
      });
    });
}

// 在模态框打开时加载数据
const [Modal, modalApi] = useVbenModal({
  footer: false,
  onCancel() {
    modalApi.close();
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      // 获取传入的数据
      data.value = modalApi.getData<Record<string, any>>().instance;

      // 加载配置数据
      await loadConfigData();
    }
  },
});
</script>

<template>
  <Modal :title="title" :loading="loading" class="max-h-[60vh] min-w-[1200px]">
    <ReskTabs :tabs="configTabs">
      <template #main-config>
        <div v-if="loading" class="p-4 text-center">加载配置中...</div>
        <div v-else-if="!mainConfigYaml" class="p-4 text-center text-gray-500">
          暂无配置数据
        </div>
        <div v-else>
          <div class="flex items-center justify-between">
            <div class="mb-1 flex items-center">
              <ElButton
                type="primary"
                size="small"
                @click="copyToClipboard(mainConfigYaml)"
              >
                复制YAML
              </ElButton>
            </div>
          </div>
          <div class="code-container">
            <pre><code class="hljs yaml" v-html="mainConfigHtml"></code></pre>
          </div>
        </div>
      </template>

      <template #rule-config>
        <div v-if="loading" class="p-4 text-center">加载配置中...</div>
        <div v-else-if="!ruleConfigYaml" class="p-4 text-center text-gray-500">
          暂无规则配置数据
        </div>
      </template>
    </ReskTabs>
  </Modal>
</template>

<style>
.code-container {
  display: flex;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  overflow: auto;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
}
</style>
