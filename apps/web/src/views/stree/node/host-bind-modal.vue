<script lang="ts" setup>
import { computed, ref } from 'vue';
import { POSITION, useToast } from 'vue-toastification';

import { useVbenModal } from '@vben/common-ui';

import { ElTransfer } from 'element-plus';

import {
  bindHostToStreeNodeApi,
  getHostListByNodeIdApi,
  getStreeNodeAvailableHostsApi,
} from '#/api';
import { $t } from '#/locales';

// 父组件传入的数据
const data = ref();
// 绑定主机ID
const transferValue = ref<number[]>([]);
// 可用主机列表
const hostList = ref<any[]>([]);
// 加载状态
const loading = ref(false);
// 标题
const title = computed(() => $t('page.stree.node.bindHost'));

const toast = useToast();

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    loading.value = true;
    try {
      // 执行绑定主机操作
      await bindHostToStreeNodeApi(data.value.nodeId, transferValue.value);

      // 设置需要刷新标志
      modalApi.setData({ needRefresh: true });
      modalApi.close();
    } catch {
      toast.error($t('ui.notification.save_failed'), {
        timeout: 2000,
        position: POSITION.TOP_CENTER,
      });
    } finally {
      loading.value = false;
    }
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      // 获取传入的数据
      data.value = modalApi.getData<Record<string, any>>();

      loading.value = true;
      try {
        // 获取所有节点可用主机 包括已绑定主机
        const { items } = await getStreeNodeAvailableHostsApi(
          data.value.nodeId,
          { assignNodeStatus: 1 },
        );

        // 转换为传输框需要的格式
        hostList.value = items.map((item: any) => ({
          key: Number(item.id),
          label: `${item.hostName} (${item.hostIp})`,
          disabled: false,
        }));

        // 获取当前已绑定的主机ID
        const boundHosts = await getHostListByNodeIdApi(data.value.nodeId, {
          page: 1,
          pageSize: 2000,
        });
        // 设置已绑定的主机
        transferValue.value = boundHosts.items.map((host: any) =>
          Number(host.id),
        );
      } catch {
        toast.error($t('ui.notification.fetch_failed'), {
          timeout: 2000,
          position: POSITION.TOP_CENTER,
        });
      } finally {
        loading.value = false;
      }
    }
  },
});
</script>

<template>
  <Modal :title="title" :loading="loading" class="w-full max-w-3xl">
    <div class="flex h-full min-h-[400px] items-center justify-center">
      <ElTransfer
        v-model="transferValue"
        :data="hostList"
        :titles="[
          $t('page.stree.host.availableHosts'),
          $t('page.stree.host.boundHosts'),
        ]"
        :format="{
          noChecked: '${total}',
          hasChecked: '${checked}/${total}',
        }"
        filterable
        filter-placeholder="搜索主机"
        class="transfer-custom w-full"
      />
    </div>
  </Modal>
</template>

<style scoped>
.transfer-custom :deep(.el-transfer-panel) {
  width: 290px;
  min-height: 400px;
}

.transfer-custom :deep(.el-transfer-panel__body) {
  height: 350px;
}

.transfer-custom :deep(.el-transfer-panel__list) {
  height: 300px;
}
</style>
