<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import {
  LucideCalendarCheck2,
  LucideFilePenLine,
  LucideTrash2,
} from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { ElButton, ElDivider } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDutyGroupApi, getDutyGroupListApi } from '#/api';
import { $t } from '#/locales';

import { scheduleStatus } from './consts';
import DutyCalendarModal from './duty-calendar-modal.vue';
import DutyGroupDrawer from './duty-group-drawer.vue';

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
      label: $t('page.monitor.oncall-duty-group.columns.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
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
  },
  stripe: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getDutyGroupListApi({
          page: page.currentPage,
          pageSize: page.pageSize,
          name: formValues.name,
        });
      },
    },
  },

  columns: [
    {
      title: $t('page.monitor.oncall-duty-group.columns.name'),
      field: 'name',
      width: 240,
    },
    {
      title: $t('page.monitor.oncall-duty-group.columns.rotationPeriod'),
      field: 'rotationPeriod',
      slots: { default: 'rotationPeriod' },
      width: 120,
    },
    {
      title: $t('page.monitor.oncall-duty-group.columns.startTime'),
      field: 'startTime',
      slots: { default: 'startTime' },
      width: 200,
    },
    {
      title: $t('page.monitor.oncall-duty-group.columns.endTime'),
      field: 'endTime',
      slots: { default: 'endTime' },
      width: 200,
    },
    {
      title: $t('page.monitor.oncall-duty-group.columns.scheduleStatus'),
      field: 'scheduleStatus',
      slots: { default: 'scheduleStatus' },
      width: 200,
    },
    {
      title: $t('page.monitor.oncall-duty-group.columns.createdAt'),
      field: 'createdAt',
      slots: { default: 'createdAt' },
      width: 200,
    },

    {
      title: $t('page.monitor.oncall-duty-group.columns.updatedAt'),
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

const [GroupDrawer, groupDrawerApi] = useVbenDrawer({
  connectedComponent: DutyGroupDrawer,
  onClosed() {
    const data = groupDrawerApi.getData();
    if (data.needRefresh) {
      gridApi.query();
    }
  },
});

const [Modal, modalApi] = useVbenModal({
  connectedComponent: DutyCalendarModal,
});

// 打开查看配置模态框
function openModal(row: any) {
  modalApi.setData({
    row,
  });
  modalApi.open();
}

// 打开抽屉 创建/编辑
function openGroupDrawer(create: boolean, row?: any) {
  groupDrawerApi.setData({
    create,
    row,
  });
  groupDrawerApi.open();
}

async function handleDelete(row: any) {
  row.pending = true;
  try {
    await deleteDutyGroupApi(row.id);
  } finally {
    row.pending = false;
    gridApi.query();
  }
}

/* 编辑 */
function handleEdit(row: any) {
  openGroupDrawer(false, row);
}

/* 创建 */
function handleCreate() {
  openGroupDrawer(true);
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('page.monitor.oncall-duty-group.title')">
      <template #toolbar-tools>
        <ElButton
          class="mr-2"
          v-permission="['monitor:oncall-duty-group:create']"
          type="primary"
          @click="handleCreate"
        >
          {{ $t('page.monitor.oncall-duty-group.button.create') }}
        </ElButton>
      </template>

      <template #rotationPeriod="{ row }">
        {{ row.rotationPeriod }}天
      </template>

      <template #startTime="{ row }">
        {{ formatDateTime(row.startTime) }}
      </template>
      <template #endTime="{ row }">
        {{ formatDateTime(row.endTime) }}
      </template>

      <template #scheduleStatus="{ row }">
        <el-tag type="primary" size="large">
          {{
            scheduleStatus.find(
              (item: any) => item.value === row.scheduleStatus,
            )?.label || $t('ui.text.unknown')
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
          type="success"
          link
          :icon="h(LucideCalendarCheck2)"
          @click="openModal(row)"
        />
        <ElDivider direction="vertical" />
        <ElButton
          type="primary"
          link
          v-permission="['monitor:oncall-duty-group:edit']"
          :icon="h(LucideFilePenLine)"
          @click="handleEdit(row)"
        />
        <el-popconfirm
          placement="top"
          :title="
            $t('ui.text.do_you_want_delete', {
              moduleName: $t('page.monitor.oncall-duty-group.module'),
            })
          "
          :confirm-button-text="$t('ui.button.ok')"
          :cancel-button-text="$t('ui.button.cancel')"
          @confirm="() => handleDelete(row)"
        >
          <template #reference>
            <ElButton
              type="danger"
              v-permission="['monitor:oncall-duty-group:delete']"
              link
              :icon="LucideTrash2"
            />
          </template>
        </el-popconfirm>
      </template>
    </Grid>
    <!-- 值班组抽屉 -->
    <GroupDrawer />
    <!-- 值班组信息 -->
    <Modal />
  </Page>
</template>
