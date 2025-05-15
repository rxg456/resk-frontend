<script lang="ts" setup>
import { Page, useVbenModal, useVbenDrawer } from '@vben/common-ui';
import { $t } from '#/locales';
import type { VbenFormProps } from '@vben/common-ui';
import { type VxeGridProps, useVbenVxeGrid } from '#/adapter/vxe-table';
import { POSITION, useToast } from 'vue-toastification';
import { getScrapePoolListApi, deleteScrapePoolApi } from '#/api';
import { formatDateTime } from '@vben/utils';
import { ElButton, ElDivider } from 'element-plus';
import ConfigModal from './config-modal.vue';
import { ref } from 'vue';
import { LucideFilePenLine, LucideTrash2, LucideLayoutList } from '@vben/icons';
import { h } from 'vue';
import ScrapePoolDrawer from './scrape-pool-drawer.vue';
import ScrapeJobDrawer from './scrape-job-drawer.vue';
const toast = useToast();
const popoverRef = ref();
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
      label: $t('page.monitor.scrapePool.columns.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'remoteWriteUrl',
      label: $t('page.monitor.scrapePool.columns.remoteWriteUrl'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'remoteReadUrl',
      label: $t('page.monitor.scrapePool.columns.remoteReadUrl'),
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
    height: 100,
  },
  stripe: true,

  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getScrapePoolListApi({
          page: page.currentPage,
          pageSize: page.pageSize,
          name: formValues.name,
          remoteWriteUrl: formValues.remoteWriteUrl,
          remoteReadUrl: formValues.remoteReadUrl,
        });
      },
    },
  },

  columns: [
    {
      title: $t('page.monitor.scrapePool.columns.name'),
      field: 'name',
      width: 240,
    },
    {
      title: $t('page.monitor.scrapePool.columns.scrapeInterval'),
      field: 'scrapeInterval',
      slots: { default: 'scrapeInterval' },
      width: 120,
    },
    {
      title: $t('page.monitor.scrapePool.columns.scrapeTimeout'),
      field: 'scrapeTimeout',
      slots: { default: 'scrapeTimeout' },
      width: 120,
    },
    {
      title: $t('page.monitor.scrapePool.columns.remoteWriteUrl'),
      field: 'remoteWriteUrl',
      width: 360,
    },
    {
      title: $t('page.monitor.scrapePool.columns.remoteReadUrl'),
      field: 'remoteReadUrl',
      width: 360,
    },
    {
      title: $t('page.monitor.scrapePool.columns.prometheusInstances'),
      field: 'prometheusInstances',
      slots: { default: 'prometheusInstances' },
      width: 240,
    },
    {
      title: $t('page.monitor.scrapePool.columns.externalLabels'),
      field: 'externalLabels',
      slots: { default: 'externalLabels' },
      width: 240,
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

const [Modal, modalApi] = useVbenModal({
  connectedComponent: ConfigModal,
});

// 打开查看配置模态框
function openConfigModal(instance: any) {
  // 先关闭Popover
  popoverRef.value?.hide();
  modalApi.setData({
    instance: instance,
  });
  modalApi.open();
}

async function handleDelete(row: any) {
  row.pending = true;
  try {
    await deleteScrapePoolApi(row.id);
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

const [PoolDrawer, poolDrawerApi] = useVbenDrawer({
  connectedComponent: ScrapePoolDrawer,
  onClosed() {
    const data = poolDrawerApi.getData();
    if (data.needRefresh) {
      gridApi.query();
    }
  },
});

const [JobDrawer, jobDrawerApi] = useVbenDrawer({
  connectedComponent: ScrapeJobDrawer,
});

function openJobDrawer(row: any) {
  jobDrawerApi.setData({
    row,
  });
  jobDrawerApi.setState({ class: 'w-full', placement: 'right' }).open();
}
// 打开抽屉 创建/编辑
function openPoolDrawer(create: boolean, row?: any) {
  poolDrawerApi.setData({
    create,
    row,
  });
  poolDrawerApi.open();
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
    <Grid :table-title="$t('page.monitor.scrapePool.menu')">
      <template #toolbar-tools>
        <el-button
          class="mr-2"
          v-permission="['monitor:scrape-pool:create']"
          type="primary"
          @click="handleCreate"
        >
          {{ $t('page.monitor.scrapePool.button.create') }}
        </el-button>
      </template>

      <template #scrapeInterval="{ row }"> {{ row.scrapeInterval }}s </template>
      <template #scrapeTimeout="{ row }"> {{ row.scrapeTimeout }}s </template>
      <template #externalLabels="{ row }">
        <!-- popper-style 设置width为 max-content 根据内容自适应宽度，popover 可能会超出屏幕宽度 设置max-width为500px限制一下 -->
        <el-popover
          placement="right"
          trigger="hover"
          :popper-style="{ width: 'max-content', maxWidth: '500px' }"
        >
          <template #reference>
            <div>
              <div
                v-for="(label, index) in row.externalLabels.slice(0, 2)"
                :key="label"
                class="mb-1"
              >
                <el-tag type="primary" size="large">
                  {{ label }}
                </el-tag>
                <br v-if="index < Math.min(1, row.externalLabels.length - 1)" />
              </div>
              <div v-if="row.externalLabels.length > 2">
                +{{ row.externalLabels.length - 2 }}...
              </div>
            </div>
          </template>
          <div>
            <div v-for="label in row.externalLabels" :key="label" class="mb-1">
              <el-tag type="primary" size="large">
                {{ label }}
              </el-tag>
            </div>
          </div>
        </el-popover>
      </template>

      <template #prometheusInstances="{ row }">
        <el-popover
          ref="popoverRef"
          placement="right"
          trigger="hover"
          :popper-style="{ width: 'max-content', maxWidth: '500px' }"
        >
          <template #reference>
            <div>
              <div
                v-for="(instance, index) in row.prometheusInstances.slice(0, 2)"
                :key="instance.host_id"
                class="mb-1"
              >
                <el-tag
                  :type="
                    instance.heartbeat_status === 1
                      ? 'success'
                      : instance.heartbeat_status === 2
                        ? 'danger'
                        : instance.heartbeat_status === 3
                          ? 'warning'
                          : 'danger'
                  "
                  size="large"
                >
                  {{
                    instance.heartbeat_status === 1
                      ? '在线'
                      : instance.heartbeat_status === 2
                        ? '离线'
                        : instance.heartbeat_status === 3
                          ? '新增'
                          : '未知'
                  }}
                </el-tag>
                {{ instance.host_ip }}
                <br
                  v-if="index < Math.min(1, row.prometheusInstances.length - 1)"
                />
              </div>
              <div v-if="row.prometheusInstances.length > 2">
                +{{ row.prometheusInstances.length - 2 }}...
              </div>
            </div>
          </template>
          <div>
            <div
              v-for="instance in row.prometheusInstances"
              :key="instance.host_id"
              class="mb-1"
            >
              <el-tag
                :type="
                  instance.heartbeat_status === 1
                    ? 'success'
                    : instance.heartbeat_status === 2
                      ? 'danger'
                      : instance.heartbeat_status === 3
                        ? 'warning'
                        : 'danger'
                "
                size="large"
              >
                {{
                  instance.heartbeat_status === 1
                    ? '在线'
                    : instance.heartbeat_status === 2
                      ? '离线'
                      : instance.heartbeat_status === 3
                        ? '新增'
                        : '未知'
                }}
              </el-tag>
              {{ instance.host_ip }}
              <ElButton
                v-if="instance.heartbeat_status !== 2"
                color="#626aef"
                size="small"
                class="ml-1"
                @click="openConfigModal(instance)"
              >
                查看配置
              </ElButton>
            </div>
          </div>
        </el-popover>
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
          :icon="h(LucideLayoutList)"
          @click="openJobDrawer(row)"
        ></ElButton>
        <ElDivider direction="vertical" />
        <ElButton
          type="primary"
          link
          v-permission="['monitor:scrape-pool:edit']"
          :icon="h(LucideFilePenLine)"
          @click="() => handleEdit(row)"
        />
        <el-popconfirm
          placement="top"
          :title="
            $t('ui.text.do_you_want_delete', {
              moduleName: $t('page.monitor.scrapePool.module'),
            })
          "
          :confirm-button-text="$t('ui.button.ok')"
          :cancel-button-text="$t('ui.button.cancel')"
          @confirm="() => handleDelete(row)"
        >
          <template #reference>
            <ElButton
              type="danger"
              v-permission="['monitor:scrape-pool:delete']"
              link
              :icon="LucideTrash2"
            />
          </template>
        </el-popconfirm>
      </template>
    </Grid>
    <!-- 查看配置 Modal -->
    <Modal />
    <!-- 创建/编辑 pool抽屉 -->
    <PoolDrawer />
    <!-- 查看job列表抽屉 -->
    <JobDrawer />
  </Page>
</template>
