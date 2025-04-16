<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { ElTransfer } from 'element-plus';
import { POSITION, useToast } from 'vue-toastification';
import { $t } from '#/locales';
import {
  getHostListApi,
  bindHostToStreeNodeApi,
  getHostListByNodeIdApi,
} from '#/api';

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
        // 获取所有可用主机
        const { items } = await getHostListApi({ assignNodeStatus: 1 });

        // 转换为传输框需要的格式
        hostList.value = items.map((item: any) => ({
          key: item.id,
          label: `${item.hostName} (${item.hostIp})`,
          disabled: false,
        }));

        // 获取当前已绑定的主机ID
        const boundHosts = await getHostListByNodeIdApi(data.value.nodeId, {
          page: 1,
          pageSize: 2000,
        });
        console.log(boundHosts.items);
        // 设置已绑定的主机
        transferValue.value = boundHosts.items.map((host: any) => host.id);
        console.log(transferValue.value);
      } catch (error) {
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
  <Modal :title="title" :loading="loading" width="700px">
    <ElTransfer
      v-model="transferValue"
      :data="hostList"
      :titles="[
        $t('page.stree.host.availableHosts'),
        $t('page.stree.host.boundHosts'),
      ]"
      :button-texts="[
        $t('page.stree.host.button.unbind'),
        $t('page.stree.host.button.bind'),
      ]"
      :format="{
        noChecked: '${total}',
        hasChecked: '${checked}/${total}',
      }"
      filterable
      filter-placeholder="搜索主机"
      class="w-full"
    />
  </Modal>
</template>
