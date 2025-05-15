<script lang="ts" setup>
import { Page, useVbenModal, useVbenDrawer } from '@vben/common-ui';
import { $t } from '#/locales';
import type { VbenFormProps } from '@vben/common-ui';
import { type VxeGridProps, useVbenVxeGrid } from '#/adapter/vxe-table';
import { POSITION, useToast } from 'vue-toastification';
import { getDutyGroupListApi, createDutyGroupApi } from '#/api';
import { formatDateTime } from '@vben/utils';
import { ElButton, ElDivider } from 'element-plus';
import { ref } from 'vue';
import { LucideFilePenLine, LucideTrash2, LucideLayoutList } from '@vben/icons';
import { h } from 'vue';
import DutyGroupDrawer from './duty-group-drawer.vue';
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

// 打开抽屉 创建/编辑
function openGroupDrawer(create: boolean, row?: any) {
  groupDrawerApi.setData({
    create,
    row,
  });
  groupDrawerApi.open();
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
        <el-button
          class="mr-2"
          v-permission="['monitor:oncall-duty-group:create']"
          type="primary"
          @click="handleCreate"
        >
          {{ $t('page.monitor.oncall-duty-group.button.create') }}
        </el-button>
      </template>

      <template #rotationPeriod="{ row }">
        {{ row.rotationPeriod }}天
      </template>

      <template #startTime="{ row }"> {{ row.startTime }}</template>
      <template #endTime="{ row }"> {{ row.endTime }} </template>
      <template #scheduleStatus="{ row }">
        {{ row.scheduleStatus }}
      </template>

      <template #createdAt="{ row }">
        {{ formatDateTime(row.createdAt) }}
      </template>
      <template #updatedAt="{ row }">
        {{ formatDateTime(row.updatedAt) }}
      </template>
      <template #action="{ row }">
        <ElButton type="success" link :icon="h(LucideLayoutList)"></ElButton>
        <ElDivider direction="vertical" />
        <ElButton
          type="primary"
          link
          v-permission="['monitor:oncall-duty-group:edit']"
          :icon="h(LucideFilePenLine)"
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
  </Page>
</template>
