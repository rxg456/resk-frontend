<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { h, ref } from 'vue';
import { POSITION, useToast } from 'vue-toastification';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { LucideFilePenLine, LucideTrash2 } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { ElButton } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteAlertPoolApi, getAlertPoolListApi } from '#/api';
import { $t } from '#/locales';

import AlertPoolDrawer from './alert-pool-drawer.vue';
import ConfigModal from './config-modal.vue';

const toast = useToast();
// 使用 Map 来存储多个 popover 的引用
const popoverRefs = ref(new Map());
// 设置 popover ref 的方法
const setPopoverRef = (el: any, instanceId: string) => {
  if (el) {
    popoverRefs.value.set(instanceId, el);
  } else {
    popoverRefs.value.delete(instanceId);
  }
};
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
      label: $t('page.monitor.alertPool.columns.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.inputName', {
          name: $t('page.monitor.alertPool.columns.name'),
        }),
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
        return await getAlertPoolListApi({
          page: page.currentPage,
          pageSize: page.pageSize,
          name: formValues.name,
        });
      },
    },
  },

  columns: [
    {
      title: $t('page.monitor.alertPool.columns.name'),
      field: 'name',
      width: 240,
    },
    {
      title: $t('page.monitor.alertPool.columns.resolveTimeout'),
      field: 'resolveTimeout',
      width: 120,
    },

    {
      title: $t('page.monitor.alertPool.columns.groupWait'),
      field: 'groupWait',
      width: 120,
    },
    {
      title: $t('page.monitor.alertPool.columns.groupInterval'),
      field: 'groupInterval',
      width: 120,
    },
    {
      title: $t('page.monitor.alertPool.columns.repeatInterval'),
      field: 'repeatInterval',
      width: 120,
    },
    {
      title: $t('page.monitor.alertPool.columns.alertmanagerInstances'),
      field: 'alertmanagerInstances',
      slots: { default: 'alertmanagerInstances' },
      width: 240,
    },
    {
      title: $t('page.monitor.alertPool.columns.groupBy'),
      field: 'groupBy',
      slots: { default: 'groupBy' },
      width: 200,
    },
    {
      title: $t('page.monitor.alertPool.columns.receiver'),
      field: 'receiver',
      width: 200,
    },
    {
      title: $t('page.monitor.alertPool.columns.createdAt'),
      field: 'createdAt',
      slots: { default: 'createdAt' },
      width: 200,
    },
    {
      title: $t('page.monitor.alertPool.columns.updatedAt'),
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
  // 关闭所有 popover
  popoverRefs.value.forEach((popover) => {
    popover?.hide?.();
  });
  modalApi.setData({
    instance,
  });
  modalApi.open();
}

async function handleDelete(row: any) {
  row.pending = true;
  try {
    await deleteAlertPoolApi(row.id);
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
  connectedComponent: AlertPoolDrawer,
  onClosed() {
    const data = poolDrawerApi.getData();
    if (data.needRefresh) {
      gridApi.query();
    }
  },
});

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
    <Grid :table-title="$t('page.monitor.alertPool.title')">
      <template #toolbar-tools>
        <ElButton
          class="mr-2"
          v-permission="['monitor:alert-pool:create']"
          type="primary"
          @click="handleCreate"
        >
          {{ $t('page.monitor.alertPool.button.create') }}
        </ElButton>
      </template>
      <template #groupBy="{ row }">
        <!-- popper-style 设置width为 max-content 根据内容自适应宽度，popover 可能会超出屏幕宽度 设置max-width为500px限制一下 -->
        <el-popover
          placement="right"
          trigger="hover"
          :popper-style="{ width: 'max-content', maxWidth: '500px' }"
        >
          <template #reference>
            <div>
              <div
                v-for="(label, index) in row.groupBy.slice(0, 2)"
                :key="label"
                class="mb-1"
              >
                <el-tag type="primary" size="large">
                  {{ label }}
                </el-tag>
                <br v-if="index < Math.min(1, row.groupBy.length - 1)" />
              </div>
              <div v-if="row.groupBy.length > 2">
                +{{ row.groupBy.length - 2 }}...
              </div>
            </div>
          </template>
          <div>
            <div v-for="label in row.groupBy" :key="label" class="mb-1">
              <el-tag type="primary" size="large">
                {{ label }}
              </el-tag>
            </div>
          </div>
        </el-popover>
      </template>

      <template #alertmanagerInstances="{ row }">
        <el-popover
          :ref="(el: any) => setPopoverRef(el, `${row.id}`)"
          placement="right"
          trigger="hover"
          :popper-style="{ width: 'max-content', maxWidth: '500px' }"
        >
          <template #reference>
            <div>
              <div
                v-for="(instance, index) in row.alertmanagerInstances.slice(
                  0,
                  2,
                )"
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
                  v-if="
                    index < Math.min(1, row.alertmanagerInstances.length - 1)
                  "
                />
              </div>
              <div v-if="row.alertmanagerInstances.length > 2">
                +{{ row.alertmanagerInstances.length - 2 }}...
              </div>
            </div>
          </template>
          <div>
            <div
              v-for="instance in row.alertmanagerInstances"
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
          type="primary"
          link
          v-permission="['monitor:alert-pool:edit']"
          :icon="h(LucideFilePenLine)"
          @click="() => handleEdit(row)"
        />
        <el-popconfirm
          placement="top"
          :title="
            $t('ui.text.do_you_want_delete', {
              moduleName: $t('page.monitor.alertPool.module'),
            })
          "
          :confirm-button-text="$t('ui.button.ok')"
          :cancel-button-text="$t('ui.button.cancel')"
          @confirm="() => handleDelete(row)"
        >
          <template #reference>
            <ElButton
              type="danger"
              v-permission="['monitor:alert-pool:delete']"
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
  </Page>
</template>
