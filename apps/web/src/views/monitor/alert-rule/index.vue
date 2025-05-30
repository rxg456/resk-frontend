<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { h } from 'vue';
import { POSITION, useToast } from 'vue-toastification';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { LucideFilePenLine, LucideTrash2 } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { ElButton } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchUpdateAlertRuleStatusApi,
  deleteAlertRuleApi,
  getAlertRuleListApi,
  getAlertSendGroupListApi,
  getAllStreeNodesApi,
  getScrapePoolListApi,
} from '#/api';
import { $t } from '#/locales';

import AlertRuleDrawer from './alert-rule-drawer.vue';
import { enableList, severityList } from './consts';

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
      fieldName: 'name',
      label: $t('page.monitor.alertRule.columns.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        clearable: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'poolId',
      label: $t('page.monitor.alertRule.columns.poolId'),
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        api: async () => {
          const result = await getScrapePoolListApi({
            page: 1,
            pageSize: 1000,
          });
          return result.items;
        },
        labelField: 'name',
        valueField: 'id',
        filterable: true,
        clearable: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'sendGroupId',
      label: $t('page.monitor.alertRule.columns.sendGroupId'),
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        api: async () => {
          const result = await getAlertSendGroupListApi({
            page: 1,
            pageSize: 1000,
          });
          return result.items;
        },
        labelField: 'name',
        valueField: 'id',
        filterable: true,
        clearable: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'enable',
      label: $t('page.monitor.alertRule.columns.enable'),
      componentProps: {
        options: enableList,
        placeholder: $t('ui.placeholder.select'),
        clearable: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'severity',
      label: $t('page.monitor.alertRule.columns.severity'),
      componentProps: {
        options: severityList,
        placeholder: $t('ui.placeholder.select'),
        clearable: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'treeNodeId',
      label: $t('page.monitor.alertRule.columns.treeNodeId'),
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        api: async () => {
          const result = await getAllStreeNodesApi();
          return result;
        },
        labelField: 'node_path',
        valueField: 'id',
        filterable: true,
        clearable: true,
      },
    },
  ],
};

const gridOptions: VxeGridProps = {
  toolbarConfig: {
    custom: true,
    export: true,
    refresh: true,
    zoom: true,
  },
  height: 'auto',
  exportConfig: {},
  pagerConfig: {},
  rowConfig: {
    isHover: true,
  },
  stripe: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getAlertRuleListApi({
          page: page.currentPage,
          pageSize: page.pageSize,
          name: formValues.name,
          poolId: formValues.poolId,
          sendGroupId: formValues.sendGroupId,
          enable: formValues.enable,
          severity: formValues.severity,
          treeNodeId: formValues.treeNodeId,
        });
      },
    },
  },
  columns: [
    {
      type: 'checkbox',
    },
    {
      title: $t('page.monitor.alertRule.columns.severity'),
      field: 'severity',
      slots: { default: 'severity' },
      width: 100,
    },
    {
      title: $t('page.monitor.alertRule.columns.name'),
      field: 'name',
      width: 120,
    },
    {
      title: $t('page.monitor.alertRule.columns.poolId'),
      field: 'poolId',
      slots: { default: 'poolId' },
      width: 200,
    },
    {
      title: $t('page.monitor.alertRule.columns.sendGroupId'),
      field: 'sendGroupId',
      slots: { default: 'sendGroupId' },
      width: 200,
    },
    {
      title: $t('page.monitor.alertRule.columns.treeNodeId'),
      field: 'treeNodeId',
      slots: { default: 'treeNodeId' },
      width: 200,
    },
    {
      title: $t('page.monitor.alertRule.columns.enable'),
      field: 'enable',
      slots: { default: 'enable' },
      width: 100,
    },
    {
      title: $t('page.monitor.alertRule.columns.createdAt'),
      field: 'createdAt',
      slots: { default: 'createdAt' },
      width: 200,
    },
    {
      title: $t('page.monitor.alertRule.columns.updatedAt'),
      field: 'updatedAt',
      slots: { default: 'updatedAt' },
      width: 200,
    },
    {
      title: $t('ui.table.action'),
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      minWidth: 120,
    },
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions, formOptions });

async function handleDelete(row: any) {
  row.pending = true;
  try {
    await deleteAlertRuleApi(row.id);
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

const [RuleDrawer, ruleDrawerApi] = useVbenDrawer({
  connectedComponent: AlertRuleDrawer,
  onClosed() {
    const data = ruleDrawerApi.getData();
    if (data.needRefresh) {
      gridApi.query();
    }
  },
});

// 打开抽屉 创建/编辑
function openRuleDrawer(create: boolean, row?: any) {
  ruleDrawerApi.setData({
    create,
    row,
  });
  ruleDrawerApi.open();
}

/* 编辑 */
function handleEdit(row: any) {
  openRuleDrawer(false, row);
}

/* 创建 */
function handleCreate() {
  openRuleDrawer(true);
}

// 批量启用/禁用
async function handleBatchEnable(enable: boolean) {
  const selectedRows = gridApi.grid?.getCheckboxRecords();

  if (!selectedRows || selectedRows.length === 0) {
    toast.warning($t('ui.notification.please_select_data'), {
      timeout: 2000,
      position: POSITION.TOP_CENTER,
    });
    return;
  }

  try {
    await batchUpdateAlertRuleStatusApi({
      ruleIds: selectedRows.map((row) => row.id),
      enable: enable ? 1 : 2,
    });
  } finally {
    gridApi.query();
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('page.monitor.alertRule.title')">
      <template #toolbar-tools>
        <ElButton
          v-permission="['monitor:alert-rule:create']"
          type="primary"
          @click="handleCreate"
        >
          {{ $t('page.monitor.alertRule.button.create') }}
        </ElButton>
        <ElButton
          type="success"
          v-permission="['monitor:alert-rule:edit']"
          @click="() => handleBatchEnable(true)"
        >
          启用
        </ElButton>

        <ElButton
          v-permission="['monitor:alert-rule:edit']"
          @click="() => handleBatchEnable(false)"
        >
          禁用
        </ElButton>
      </template>

      <template #poolId="{ row }">
        {{ row.poolName }}
      </template>

      <template #sendGroupId="{ row }">
        {{ row.sendGroupName }}
      </template>

      <template #treeNodeId="{ row }">
        {{ row.nodePath }}
      </template>

      <template #enable="{ row }">
        <el-tag :type="row.enable === 1 ? 'success' : 'danger'" size="large">
          {{ row.enable === 1 ? $t('enum.enable.ON') : $t('enum.enable.OFF') }}
        </el-tag>
      </template>

      <template #severity="{ row }">
        <el-tag
          :type="
            row.severity === 1
              ? 'danger'
              : row.severity === 2
                ? 'warning'
                : row.severity === 3
                  ? 'info'
                  : 'danger'
          "
          size="large"
        >
          {{
            severityList.find((item: any) => item.value === row.severity)
              ?.label || $t('ui.text.unknown')
          }}
        </el-tag>
      </template>

      <template #createdAt="{ row }">
        {{ formatDateTime(row.createdAt) }}
      </template>
      <template #updatedAt="{ row }">
        {{ formatDateTime(row.updatedAt) }}
      </template>
      <template #action="{ row }">
        <ElButton
          type="primary"
          link
          v-permission="['monitor:alert-rule:edit']"
          :icon="h(LucideFilePenLine)"
          @click="() => handleEdit(row)"
        />
        <el-popconfirm
          placement="top"
          :title="
            $t('ui.text.do_you_want_delete', {
              moduleName: $t('page.monitor.alertRule.module'),
            })
          "
          :confirm-button-text="$t('ui.button.ok')"
          :cancel-button-text="$t('ui.button.cancel')"
          @confirm="() => handleDelete(row)"
        >
          <template #reference>
            <ElButton
              type="danger"
              v-permission="['monitor:alert-rule:delete']"
              link
              :icon="LucideTrash2"
            />
          </template>
        </el-popconfirm>
      </template>
    </Grid>
    <!-- 创建/编辑 alertRule抽屉 -->
    <RuleDrawer />
  </Page>
</template>
