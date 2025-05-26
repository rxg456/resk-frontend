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
  deleteAlertSendGroupApi,
  getAlertPoolListApi,
  getAlertSendGroupListApi,
  getDutyGroupListApi,
} from '#/api';
import { $t } from '#/locales';

import AlertSendGroupDrawer from './alert-send-group-drawer.vue';

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
      label: $t('page.monitor.alertSendGroup.columns.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'poolId',
      label: $t('page.monitor.alertSendGroup.columns.poolId'),
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        api: async () => {
          const result = await getAlertPoolListApi({
            page: 1,
            pageSize: 1000,
          });
          return result.items;
        },
        labelField: 'name',
        valueField: 'id',
        filterable: true,
        allowClear: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'onDutyGroupId',
      label: $t('page.monitor.alertSendGroup.columns.onDutyGroupId'),
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        api: async () => {
          const result = await getDutyGroupListApi({
            page: 1,
            pageSize: 1000,
          });
          return result.items;
        },
        labelField: 'name',
        valueField: 'id',
        multiple: false,
        collapseTags: false,
        filterable: true,
        allowClear: true,
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
    height: 100,
  },
  stripe: true,

  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getAlertSendGroupListApi({
          page: page.currentPage,
          pageSize: page.pageSize,
          name: formValues.name,
          poolId: formValues.poolId,
          onDutyGroupId: formValues.onDutyGroupId,
        });
      },
    },
  },

  columns: [
    {
      title: $t('page.monitor.alertSendGroup.columns.name'),
      field: 'name',
      width: 120,
    },
    {
      title: $t('page.monitor.alertSendGroup.columns.nameZh'),
      field: 'nameZh',
      width: 240,
    },
    {
      title: $t('page.monitor.alertSendGroup.columns.poolId'),
      field: 'poolId',
      slots: { default: 'poolId' },
      width: 120,
    },
    {
      title: $t('page.monitor.alertSendGroup.columns.onDutyGroupId'),
      field: 'onDutyGroupId',
      slots: { default: 'onDutyGroupId' },
      width: 120,
    },
    {
      title: $t('page.monitor.alertSendGroup.columns.repeatInterval'),
      field: 'repeatInterval',
      width: 100,
    },
    {
      title: $t('page.monitor.alertSendGroup.columns.sendResolved'),
      field: 'sendResolved',
      slots: { default: 'sendResolved' },
      width: 100,
    },
    {
      title: $t('page.monitor.alertSendGroup.columns.needUpgrade'),
      field: 'needUpgrade',
      slots: { default: 'needUpgrade' },
      width: 100,
    },
    {
      title: $t('page.monitor.scrapePool.columns.createdAt'),
      field: 'createdAt',
      slots: { default: 'createdAt' },
      width: 200,
    },
    {
      title: $t('page.monitor.scrapePool.columns.updatedAt'),
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
    await deleteAlertSendGroupApi(row.id);
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

const [SendGroupDrawer, sendGroupDrawerApi] = useVbenDrawer({
  connectedComponent: AlertSendGroupDrawer,
  onClosed() {
    const data = sendGroupDrawerApi.getData();
    if (data.needRefresh) {
      gridApi.query();
    }
  },
});

// 打开抽屉 创建/编辑
function openPoolDrawer(create: boolean, row?: any) {
  sendGroupDrawerApi.setData({
    create,
    row,
  });
  sendGroupDrawerApi.open();
}

/* 编辑 */
function handleEdit(row: any) {
  openPoolDrawer(false, row);
}

/* 创建 */
function handleCreate() {
  openPoolDrawer(true);
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('page.monitor.alertSendGroup.title')">
      <template #toolbar-tools>
        <ElButton
          class="mr-2"
          v-permission="['monitor:alert-send-group:create']"
          type="primary"
          @click="handleCreate"
        >
          {{ $t('page.monitor.alertSendGroup.button.create') }}
        </ElButton>
      </template>

      <template #poolId="{ row }">
        {{ row.poolName }}
      </template>

      <template #onDutyGroupId="{ row }">
        {{ row.onDutyGroupName }}
      </template>

      <template #sendResolved="{ row }">
        <el-tag
          :type="row.sendResolved === 1 ? 'success' : 'danger'"
          size="large"
        >
          {{
            row.sendResolved === 1
              ? $t('page.monitor.alertSendGroup.sendResolved.1')
              : $t('page.monitor.alertSendGroup.sendResolved.2')
          }}
        </el-tag>
      </template>

      <template #needUpgrade="{ row }">
        <el-tag
          :type="row.needUpgrade === 1 ? 'success' : 'danger'"
          size="large"
        >
          {{
            row.needUpgrade === 1
              ? $t('page.monitor.alertSendGroup.needUpgrade.1')
              : $t('page.monitor.alertSendGroup.needUpgrade.2')
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
          v-permission="['monitor:alert-send-group:edit']"
          :icon="h(LucideFilePenLine)"
          @click="() => handleEdit(row)"
        />
        <el-popconfirm
          placement="top"
          :title="
            $t('ui.text.do_you_want_delete', {
              moduleName: $t('page.monitor.alertSendGroup.module'),
            })
          "
          :confirm-button-text="$t('ui.button.ok')"
          :cancel-button-text="$t('ui.button.cancel')"
          @confirm="() => handleDelete(row)"
        >
          <template #reference>
            <ElButton
              type="danger"
              v-permission="['monitor:alert-send-group:delete']"
              link
              :icon="LucideTrash2"
            />
          </template>
        </el-popconfirm>
      </template>
    </Grid>
    <!-- 创建/编辑 pool抽屉 -->
    <SendGroupDrawer />
  </Page>
</template>
