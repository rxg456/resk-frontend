<script lang="ts" setup>
import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { ElCard } from 'element-plus';
import Tree from './tree.vue';
import { Icon } from '@iconify/vue';
import CreateStreeNodeModal from './modal.vue';
import { ref } from 'vue';
import { ReskTabs } from '@vben/common-ui';
import type { TabOption } from '@vben/types';
import { $t } from '#/locales';
import NodeInfo from './node-info.vue';
import HostList from './host-list.vue';

// 创建树组件引用
const treeRef = ref();

// 选中节点状态
const selectedNode = ref<any>();

const chartTabs: TabOption[] = [
  {
    label: $t('page.stree.node.tabs.nodeDetail'),
    value: 'nodeDetail',
  },
  {
    label: $t('page.stree.node.tabs.hostList'),
    value: 'hostList',
  },
];

const [Modal, modalApi] = useVbenModal({
  // 连接抽离的组件
  connectedComponent: CreateStreeNodeModal,
  // 监听打开状态变化
  onOpenChange: (open) => {
    if (!open) {
      // 模态框关闭时检查是否需要刷新
      const modalData = modalApi.getData();
      if (modalData?.needRefresh) {
        // 调用树组件的刷新方法
        refreshTree();
      }
    }
  },
});

// 节点点击处理函数
function handleNodeClick(nodeData: any) {
  selectedNode.value = nodeData;
}

function handleCreate(isCreateTop: boolean, pId?: number, level?: number) {
  modalApi.setData({ isCreateTop, pId, level });
  modalApi.open();
}

function refreshTree() {
  treeRef.value?.refreshTree();
  selectedNode.value = '';
}
</script>

<template>
  <Page :title="$t('page.stree.pageTitle')">
    <!-- 在extra插槽中添加按钮 -->
    <template #extra>
      <VbenButton @click="handleCreate(true)">
        <Icon icon="mdi:plus" class="mr-1" />
        {{ $t('page.stree.node.button.createTop') }}
      </VbenButton>
      <Modal />
    </template>
    <div class="flex gap-5">
      <ElCard class="mb-5 w-[400px] self-start">
        <Tree
          ref="treeRef"
          :onCreateNode="handleCreate"
          @node-click="handleNodeClick"
        />
      </ElCard>
      <ElCard class="mb-5 flex-1 self-start">
        <ReskTabs :tabs="chartTabs">
          <template #nodeDetail>
            <!-- 传递节点数据给NodeInfo -->
            <NodeInfo :node-data="selectedNode" @refresh-tree="refreshTree" />
          </template>
          <template #hostList>
            <HostList :node-data="selectedNode" />
          </template>
        </ReskTabs>
      </ElCard>
    </div>
  </Page>
</template>
