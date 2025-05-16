<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { computed, h, ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { LucideFilePenLine, LucideTrash2 } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteScrapeJobApi,
  getScrapeJobListByPoolIdApi,
  updateScrapeJobStatusApi,
} from '#/api';
import { $t } from '#/locales';
import { enableList } from '#/store';

import JobModal from './job-modal.vue';

// 接受父组件传递的数据
const data = ref();
// 获取父组件传递的poolId
const poolId = ref();
const poolName = computed(() => data.value?.row?.name);
const getTitle = computed(() =>
  $t('page.monitor.scrapeJob.title', {
    name: poolName.value,
  }),
);

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
      label: $t('page.monitor.scrapeJob.columns.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          name: $t('page.monitor.scrapeJob.columns.name'),
        }),
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'enable',
      label: $t('page.monitor.scrapeJob.columns.enable'),
      componentProps: {
        placeholder: $t('ui.placeholder.select', {
          name: $t('page.monitor.scrapeJob.columns.enable'),
        }),
        options: enableList,
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
        return await getScrapeJobListByPoolIdApi(data.value.row.id, {
          page: page.currentPage,
          pageSize: page.pageSize,
          name: formValues.name,
          enable: formValues.enable,
        });
      },
    },
  },

  columns: [
    {
      title: $t('page.monitor.scrapeJob.columns.name'),
      field: 'name',
      width: 240,
    },
    {
      title: $t('page.monitor.scrapeJob.columns.scrapeInterval'),
      field: 'scrapeInterval',
      slots: { default: 'scrapeInterval' },
      width: 120,
    },
    {
      title: $t('page.monitor.scrapeJob.columns.scrapeTimeout'),
      field: 'scrapeTimeout',
      slots: { default: 'scrapeTimeout' },
      width: 120,
    },
    {
      title: $t('page.monitor.scrapeJob.columns.enable'),
      field: 'enable',
      slots: { default: 'enable' },
      width: 120,
    },
    {
      title: $t('page.monitor.scrapeJob.columns.serviceDiscoveryType'),
      field: 'serviceDiscoveryType',
      width: 120,
      slots: { default: 'serviceDiscoveryType' },
    },
    {
      title: $t('page.monitor.scrapeJob.columns.scheme'),
      field: 'scheme',
      width: 120,
    },
    {
      title: $t('page.monitor.scrapeJob.columns.metricsPath'),
      field: 'metricsPath',
      width: 120,
    },
    {
      title: $t('page.monitor.scrapeJob.columns.port'),
      field: 'port',
      width: 120,
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

const [Drawer, drawerApi] = useVbenDrawer({
  footer: false,
  onCancel() {
    drawerApi.close();
  },
  async onOpened() {
    gridApi.setLoading(true);
    data.value = drawerApi.getData<Record<string, any>>();
    poolId.value = data.value?.row?.id;
    gridApi.query();
    // 添加延时，确保加载状态至少显示300毫秒，否则后续的loading状态不会显示
    await new Promise((resolve) => setTimeout(resolve, 300));
    gridApi.setLoading(false);
  },
});

const [Modal, modalApi] = useVbenModal({
  connectedComponent: JobModal,
  onClosed() {
    const data = modalApi.getData();
    if (data.needRefresh) {
      gridApi.query();
    }
    modalApi.close();
  },
});

// 修改状态
async function handleStatusChanged(row: any, checked: boolean) {
  // 设置加载状态
  row.pending = true;
  // 转换状态值：布尔值 -> 数值(1/2)
  row.enable = checked ? 1 : 2;
  try {
    await updateScrapeJobStatusApi(row.id, row);
  } catch {
    // 错误处理
  } finally {
    // 恢复加载状态
    row.pending = false;
    // 重新查询
    gridApi.query();
  }
}

function openJobModal(create: boolean, row?: any, poolId?: any) {
  modalApi.setData({
    create,
    row,
    poolId,
  });
  modalApi.open();
}

// 新增采集Job
function handleCreate(poolId: any) {
  openJobModal(true, null, poolId);
}
// 编辑采集Job
function handleEdit(row: any) {
  openJobModal(false, row);
}
// 删除采集Job
async function handleDelete(row: any) {
  try {
    await deleteScrapeJobApi(row.id);
  } catch {
    // 错误处理
  } finally {
    gridApi.query();
  }
}
</script>

<template>
  <Drawer append-to-main :title="getTitle">
    <Grid>
      <template #toolbar-tools>
        <!-- v-permission="['monitor:scrape-job:create']" -->
        <el-button class="mr-2" type="primary" @click="handleCreate(poolId)">
          {{ $t('page.monitor.scrapeJob.button.create') }}
        </el-button>
      </template>
      <template #scrapeInterval="{ row }"> {{ row.scrapeInterval }}s </template>
      <template #scrapeTimeout="{ row }"> {{ row.scrapeTimeout }}s </template>
      <template #enable="{ row }">
        <!-- :disabled="!hasPermission(['monitor:scrapeJob:edit'])" -->
        <el-switch
          :model-value="row.enable === 1"
          :loading="row.pending"
          :inline-prompt="true"
          :active-text="$t('ui.switch.active')"
          :inactive-text="$t('ui.switch.inactive')"
          @change="(checked: boolean) => handleStatusChanged(row, checked)"
        />
      </template>
      <template #serviceDiscoveryType="{ row }">
        {{
          row.serviceDiscoveryType === 'stree-http'
            ? $t('enum.serviceDiscoveryType.STREE_HTTP')
            : $t('enum.serviceDiscoveryType.KUBERNETES')
        }}
      </template>
      <template #createdAt="{ row }">
        {{ formatDateTime(row.createdAt) }}
      </template>
      <template #updatedAt="{ row }">
        {{ formatDateTime(row.updatedAt) }}
      </template>
      <template #action="{ row }">
        <!-- TODO: v-permission="['monitor:scrape-job:edit']" -->
        <ElButton
          type="primary"
          link
          :icon="h(LucideFilePenLine)"
          @click="() => handleEdit(row)"
        />
        <!-- TODO: v-permission="['monitor:scrape-job:delete']" -->
        <el-popconfirm
          placement="top"
          :title="
            $t('ui.text.do_you_want_delete', {
              moduleName: $t('page.monitor.scrapeJob.module'),
            })
          "
          :confirm-button-text="$t('ui.button.ok')"
          :cancel-button-text="$t('ui.button.cancel')"
          @confirm="() => handleDelete(row)"
        >
          <template #reference>
            <ElButton type="danger" link :icon="LucideTrash2" />
          </template>
        </el-popconfirm>
      </template>
    </Grid>
  </Drawer>
  <Modal />
</template>
