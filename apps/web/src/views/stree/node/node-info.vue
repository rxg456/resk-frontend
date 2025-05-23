<script lang="ts" setup>
import { EllipsisText, useVbenDrawer, VbenButton } from '@vben/common-ui';

import { Icon } from '@iconify/vue';
import { ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus';

import { $t } from '#/locales';

import EditStreeNodeDrawer from './drawer.vue';

// props定义，接收节点数据
const props = defineProps({
  nodeData: {
    type: Object,
    default: () => null,
  },
});

// emit事件定义
const emit = defineEmits(['refresh-tree']);

const isValidArray = (arr: any[]) => Array.isArray(arr) && arr.length > 0;

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: EditStreeNodeDrawer,
  // 监听drawer关闭事件
  onOpenChange: (open) => {
    if (!open) {
      // drawer关闭时检查是否需要刷新
      const drawerData = drawerApi.getData();
      if (drawerData?.needRefresh) {
        // 通知父组件刷新树
        emit('refresh-tree');
      }
    }
  },
});

function openDrawer() {
  drawerApi.setData({
    data: props.nodeData,
  });
  drawerApi.open();
}
</script>

<template>
  <div v-if="nodeData">
    <ElDescriptions :column="3" size="large" border>
      <template #title>
        <VbenButton size="sm" @click="openDrawer">
          <Icon icon="mdi:pencil" />
          {{ $t('page.stree.node.button.edit') }}
        </VbenButton>
        <Drawer />
      </template>
      <ElDescriptionsItem
        :label="$t('page.stree.node.tabs.nodePath')"
        label-align="center"
        align="center"
        width="300px"
      >
        <ElTag type="primary">{{ nodeData.node_path }}</ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :label="$t('page.stree.node.tabs.nodeDesc')"
        label-align="center"
        align="center"
        width="300px"
      >
        <span>{{ nodeData.desc }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :label="$t('page.stree.node.tabs.treeLevel')"
        label-align="center"
        align="center"
        width="300px"
      >
        <span>{{ nodeData.level }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :label="$t('page.stree.node.tabs.opsAdmin')"
        label-align="center"
        align="left"
      >
        <EllipsisText :max-width="300">
          <template v-if="isValidArray(nodeData.ops_admin_users)">
            <ElTag
              v-for="user in nodeData.ops_admin_users"
              :key="user"
              type="success"
              class="mr-2"
            >
              {{ user }}
            </ElTag>
          </template>
          <ElTag type="info" v-else>未分配运维人员</ElTag>
        </EllipsisText>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :label="$t('page.stree.node.tabs.devManager')"
        label-align="center"
        align="left"
      >
        <EllipsisText :max-width="300">
          <template v-if="isValidArray(nodeData.dev_manager_users)">
            <ElTag
              v-for="user in nodeData.dev_manager_users"
              :key="user"
              type="success"
              class="mr-2"
            >
              {{ user }}
            </ElTag>
          </template>
          <ElTag type="info" v-else>未分配研发负责人</ElTag>
        </EllipsisText>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :label="$t('page.stree.node.tabs.developers')"
        label-align="center"
        align="left"
      >
        <EllipsisText :max-width="300">
          <template v-if="isValidArray(nodeData.developers)">
            <ElTag
              v-for="user in nodeData.developers"
              :key="user"
              type="success"
              class="mr-2"
            >
              {{ user }}
            </ElTag>
          </template>
          <ElTag type="info" v-else>未分配研发人员</ElTag>
        </EllipsisText>
      </ElDescriptionsItem>
      <ElDescriptionsItem
        :label="$t('page.stree.node.tabs.testers')"
        label-align="center"
        align="left"
      >
        <EllipsisText :max-width="300">
          <template v-if="isValidArray(nodeData.testers)">
            <ElTag
              v-for="user in nodeData.testers"
              :key="user"
              type="success"
              class="mr-2"
            >
              {{ user }}
            </ElTag>
          </template>
          <ElTag type="info" v-else>未分配测试人员</ElTag>
        </EllipsisText>
      </ElDescriptionsItem>
    </ElDescriptions>
  </div>
  <div v-else class="p-4 text-center text-gray-500">
    {{ $t('page.stree.prompt.noNode') }}
  </div>
</template>
