<script lang="ts" setup>
import {
  type VbenFormProps,
  useVbenModal,
  useVbenDrawer,
} from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { h, watch } from 'vue';
import { POSITION, useToast } from 'vue-toastification';
import { Icon } from '@iconify/vue';

import { LucideFilePenLine, LucideTrash2 } from '@vben/icons';

import { ElButton } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteHostApi, getHostListByNodeIdApi } from '#/api';
import { $t } from '#/locales';

import {
  envList,
  nodeStatusList,
  osTypeList,
  statusList,
} from '../host/consts';
import HostDrawer from '../host/drawer.vue';
// 绑定主机模态框组件
import HostBindModal from './host-bind-modal.vue';

const props = defineProps({
  nodeData: {
    type: Object,
    default: () => null,
  },
});

const toast = useToast();

const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  // 控制表单是否显示折叠按钮
  showCollapseButton: false,
  // 按下回车时是否提交表单
  submitOnEnter: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'hostName',
      label: $t('page.stree.host.hostName'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'hostIp',
      label: $t('page.stree.host.hostIp'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('page.stree.host.status.title'),
      componentProps: {
        options: statusList,
        placeholder: $t('ui.placeholder.select'),
      },
    },
    {
      component: 'Select',
      fieldName: 'env',
      label: $t('page.stree.host.env.title'),
      componentProps: {
        options: envList,
        placeholder: $t('ui.placeholder.select'),
      },
    },
  ],
};

const gridOptions: VxeGridProps = {
  height: '900px',
  toolbarConfig: {
    custom: true,
    export: true,
    refresh: true,
    zoom: true,
  },
  exportConfig: {},
  pagerConfig: {},
  rowConfig: {
    isHover: true,
  },
  stripe: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getHostListByNodeIdApi(props.nodeData.id, {
          page: page.currentPage,
          pageSize: page.pageSize,
          hostName: formValues.hostName,
          hostIp: formValues.hostIp,
          status: formValues.status,
          env: formValues.env,
        });
      },
    },
  },

  columns: [
    {
      title: $t('ui.table.seq'),
      type: 'seq',
      width: 70,
    },
    {
      title: $t('page.stree.host.columns.hostName'),
      field: 'hostName',
    },
    {
      title: $t('page.stree.host.columns.hostIp'),
      field: 'hostIp',
    },
    {
      title: $t('page.stree.host.columns.cpu'),
      field: 'cpu',
    },
    {
      title: $t('page.stree.host.columns.memory'),
      field: 'memory',
    },
    {
      title: $t('page.stree.host.columns.nodeExporterPort'),
      field: 'nodeExporterPort',
    },
    {
      title: $t('page.stree.host.columns.osType'),
      field: 'osType',
      slots: { default: 'osType' },
    },
    {
      title: $t('page.stree.host.columns.status'),
      field: 'status',
      slots: { default: 'status' },
    },
    {
      title: $t('page.stree.host.columns.env'),
      field: 'env',
      slots: { default: 'env' },
    },
    // {
    //   title: $t('ui.table.createTime'),
    //   field: 'createdAt',
    //   slots: { default: 'createdAt' },
    // },
    {
      title: $t('ui.table.action'),
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      width: 120,
    },
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
  formOptions,
});

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: HostDrawer,
  onClosed() {
    const data = drawerApi.getData();
    if (data.needRefresh) {
      gridApi.query();
    }
  },
});

// 绑定主机抽屉
const [BindHostModal, bindHostModalApi] = useVbenModal({
  connectedComponent: HostBindModal,
  onClosed() {
    const data = bindHostModalApi.getData();
    if (data?.needRefresh) {
      // 刷新主机列表
      gridApi.query();
    }
  },
});

// 打开抽屉 创建/编辑
function openDrawer(create: boolean, row?: any) {
  drawerApi.setData({
    create,
    row,
  });
  drawerApi.open();
}

// 打开绑定主机模态框
function openBindHostModal() {
  bindHostModalApi.setData({
    nodeId: props.nodeData.id,
  });
  bindHostModalApi.open();
}

/* 编辑 */
function handleEdit(row: any) {
  openDrawer(false, row);
}

/* 删除 */
async function handleDelete(row: any) {
  row.pending = true;
  try {
    await deleteHostApi(row.id);
  } catch {
    toast.error($t('ui.notification.delete_failed'), {
      timeout: 2000,
      position: POSITION.TOP_CENTER,
    });
  } finally {
    row.pending = false;
    gridApi.query();
  }
}

// 监听nodeData的变化
watch(
  () => props.nodeData,
  () => {
    gridApi.query();
    gridApi.setLoading(true);
    setTimeout(() => {
      gridApi.setLoading(false);
    }, 500);
  },
);
</script>

<template>
  <ElButton color="#626aef" class="mb-4" @click="openBindHostModal">
    <Icon icon="gg:style" class="mr-1" />
    {{ $t('page.stree.node.bindHost') }}
  </ElButton>
  <Grid>
    <template #osType="{ row }">
      <el-tag type="primary" size="large">
        {{
          osTypeList.find((item: any) => item.value === row.osType)?.label ||
          $t('ui.text.unknown')
        }}
      </el-tag>
    </template>

    <template #status="{ row }">
      <el-tag
        :type="
          row.status === 1
            ? 'success'
            : row.status === 2
              ? 'danger'
              : row.status === 3
                ? 'warning'
                : row.status === 4
                  ? 'info'
                  : 'danger'
        "
        size="large"
      >
        {{
          statusList.find((item: any) => item.value === row.status)?.label ||
          $t('ui.text.unknown')
        }}
      </el-tag>
    </template>

    <template #env="{ row }">
      <el-tag type="primary" size="large">
        {{
          envList.find((item: any) => item.value === row.env)?.label ||
          $t('ui.text.unknown')
        }}
      </el-tag>
    </template>

    <template #assignNodeStatus="{ row }">
      <el-tag type="primary" size="large">
        {{
          nodeStatusList.find(
            (item: any) => item.value === row.assignNodeStatus,
          )?.label || $t('ui.text.unknown')
        }}
      </el-tag>
    </template>

    <template #streeNodePath="{ row }">
      <el-tag type="primary" size="large">
        {{ row.streeNodePath }}
      </el-tag>
    </template>

    <template #action="{ row }">
      <ElButton
        type="primary"
        link
        v-permission="['cmdb:host:edit']"
        :icon="h(LucideFilePenLine)"
        @click="() => handleEdit(row)"
      />
      <el-popconfirm
        :title="
          $t('ui.text.do_you_want_delete', {
            moduleName: $t('page.stree.host.module'),
          })
        "
        :confirm-button-text="$t('ui.button.ok')"
        :cancel-button-text="$t('ui.button.cancel')"
        @confirm="() => handleDelete(row)"
      >
        <template #reference>
          <ElButton
            type="danger"
            v-permission="['cmdb:host:delete']"
            link
            :icon="LucideTrash2"
          />
        </template>
      </el-popconfirm>
    </template>
  </Grid>
  <!-- 绑定主机模态框 -->
  <BindHostModal />
  <!-- 编辑主机抽屉 -->
  <Drawer />
</template>
