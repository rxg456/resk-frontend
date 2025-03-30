<script lang="ts" setup>
import { useVbenDrawer, VbenTree, VbenLoading } from '@vben/common-ui';

import { ref, nextTick, watch } from 'vue';
import {
  MenuApi,
  getMenuTreeApi,
  buildMenuTree,
  updateRoleAuthApi,
  getRoleInfoApi,
  getApiListApi,
  buildApiTree,
} from '#/api';
import type { TreeKey } from 'element-plus/es/components/tree/src/tree.type.mjs';
import { useToast, POSITION } from 'vue-toastification';
import { $t } from '@vben/locales';
import { IconifyIcon } from '@vben/icons';

const toast = useToast();
const data = ref();
// 添加激活的标签页
const activeTab = ref('menu');

// 添加loading状态
const isLoading = ref(true);

// 添加API树相关数据
const apiTreeData = ref<any[]>([]);

// VbenTree引用
const vbenTreeRef = ref();
const vbenApiTreeRef = ref();

// 选中的数据
const selectedMenuIds = ref<(string | number)[]>([]);
const selectedApiIds = ref<(string | number)[]>([]);

const [Drawer, drawerApi] = useVbenDrawer({
  async onOpened() {
    isLoading.value = true;
    data.value = drawerApi.getData<Record<string, any>>();

    // 同时获取菜单树和API树
    const [menuResult, apiResult] = await Promise.all([
      getMenuTreeApi(null),
      getApiListApi(null),
    ]);

    menuTreeData.value = buildMenuTree(menuResult.items);
    apiTreeData.value = buildApiTree(apiResult.items);

    if (data.value?.row?.id) {
      const roleAuth = await getRoleInfoApi(data.value.row.id);
      await nextTick();

      // VbenTree设置选中状态 - 使用v-model绑定
      if (roleAuth?.menuIds) {
        // 先展开所有节点以确保DOM更新
        if (vbenTreeRef.value) {
          vbenTreeRef.value.expandAll();
        }

        // 设置选中状态
        setTimeout(() => {
          selectedMenuIds.value = roleAuth.menuIds;
        }, 100);
      }

      // VbenTree设置API选中状态
      if (roleAuth?.apiIds) {
        // 先展开所有节点以确保DOM更新
        if (vbenApiTreeRef.value) {
          vbenApiTreeRef.value.expandAll();
        }

        // 设置选中状态
        setTimeout(() => {
          selectedApiIds.value = roleAuth.apiIds;
          // 等所有数据加载完成后关闭loading
          setTimeout(() => {
            isLoading.value = false;
          }, 100);
        }, 100);
      } else {
        // 如果没有API权限数据
        setTimeout(() => {
          isLoading.value = false;
        }, 100);
      }
    } else {
      // 如果没有角色ID，直接关闭loading
      isLoading.value = false;
    }
  },

  async onConfirm() {
    let menuIds: TreeKey[] = [];
    let apiIds: TreeKey[] = [];

    // 直接使用v-model绑定的值
    menuIds = selectedMenuIds.value as TreeKey[];
    apiIds = selectedApiIds.value as TreeKey[];

    if (menuIds.length <= 0 && apiIds.length <= 0) {
      toast.error($t('ui.notification.no_auth'), {
        timeout: 2000,
        position: POSITION.TOP_CENTER,
      });
      return;
    }

    setLoading(true);
    try {
      // 更新权限，同时提交菜单权限和API权限
      await updateRoleAuthApi(data.value.row.id, { menuIds, apiIds });

      toast.success($t('ui.notification.update_success'), {
        timeout: 1000,
        position: POSITION.TOP_RIGHT,
        toastClassName: 'toastification-success',
      });
      drawerApi.setData({ needRefresh: true });
    } catch {
      // 错误处理
    } finally {
      drawerApi.close();
      setLoading(false);
    }
  },

  // 添加关闭时的钩子
  async onClosed() {
    // 清空选中状态
    selectedMenuIds.value = [];
    selectedApiIds.value = [];
  },
});

const menuTreeData = ref<MenuApi.MenuForm[]>([]);

// VbenTree操作函数 - 菜单树
function expandAllMenu() {
  if (vbenTreeRef.value) {
    vbenTreeRef.value.expandAll();
  }
}

function collapseAllMenu() {
  if (vbenTreeRef.value) {
    vbenTreeRef.value.collapseAll();
  }
}

function checkAllMenu() {
  selectedMenuIds.value = getAllKeys(menuTreeData.value);
}

function uncheckAllMenu() {
  selectedMenuIds.value = [];
}

// VbenTree操作函数 - API树
function expandAllApi() {
  if (vbenApiTreeRef.value) {
    vbenApiTreeRef.value.expandAll();
  }
}

function collapseAllApi() {
  if (vbenApiTreeRef.value) {
    vbenApiTreeRef.value.collapseAll();
  }
}

function checkAllApi() {
  selectedApiIds.value = getAllApiKeys(apiTreeData.value);
}

function uncheckAllApi() {
  selectedApiIds.value = [];
}

// 递归获取所有节点的 key - 保留此函数用于全选功能
const getAllKeys = (data: MenuApi.MenuForm[]): number[] => {
  const keys: number[] = [];
  const traverse = (nodes: MenuApi.MenuForm[]) => {
    nodes.forEach((node) => {
      if (node.id !== undefined && node.id !== null) {
        keys.push(node.id);
      }
      if (node.children?.length) {
        traverse(node.children);
      }
    });
  };
  traverse(data);
  return keys;
};

// 递归获取所有API节点的key
const getAllApiKeys = (data: any[]): number[] => {
  const keys: number[] = [];
  const traverse = (nodes: any[]) => {
    nodes.forEach((node) => {
      if (node.id !== undefined && node.id !== null) {
        keys.push(node.id);
      }
      if (node.children?.length) {
        traverse(node.children);
      }
    });
  };
  traverse(data);
  return keys;
};

function setLoading(loading: boolean) {
  drawerApi.setState({ loading });
}

// 监听选择变化
watch(
  selectedApiIds,
  (newSelectedIds) => {
    if (!newSelectedIds) return;

    const updatedSelection = [...newSelectedIds];
    const addedIds = new Set();

    // 遍历选中的ID
    for (const id of newSelectedIds) {
      // 找到父节点并添加
      const parentIds = findParentIds(apiTreeData.value, id);
      for (const parentId of parentIds) {
        if (!updatedSelection.includes(parentId)) {
          updatedSelection.push(parentId);
          addedIds.add(parentId);
        }
      }
    }

    // 更新选中状态
    if (updatedSelection.length !== newSelectedIds.length) {
      selectedApiIds.value = updatedSelection;
    }
  },
  { deep: true },
);

// 查找节点的所有父节点ID
function findParentIds(
  nodes: any[],
  targetId: string | number,
  parentId: string | number | null = null,
  result: (string | number)[] = [],
  path: (string | number)[] = [],
): (string | number)[] {
  for (const node of nodes) {
    const currentPath = [...path, node.id];

    if (node.id === targetId) {
      return [...result, ...path.filter((id) => !!id)];
    }

    if (node.children && node.children.length > 0) {
      const found = findParentIds(
        node.children,
        targetId,
        node.id,
        result,
        currentPath,
      );
      if (found.length > 0) {
        return found;
      }
    }
  }

  return [];
}
</script>

<template>
  <Drawer :title="$t('page.system.role.button.auth')">
    <!-- 使用vben的Loading组件 -->
    <VbenLoading :spinning="isLoading" text="加载中..." />
    <el-tabs v-model="activeTab" class="mb-4" type="border-card">
      <!-- 菜单权限标签页 -->
      <el-tab-pane :label="$t('page.system.role.menuAuth')" name="menu">
        <div class="flex flex-col gap-4">
          <div class="flex gap-2">
            <el-button @click="expandAllMenu">{{
              $t('ui.tree.expand_all')
            }}</el-button>
            <el-button @click="collapseAllMenu">{{
              $t('ui.tree.collapse_all')
            }}</el-button>
            <el-button @click="checkAllMenu">{{
              $t('ui.tree.select_all')
            }}</el-button>
            <el-button @click="uncheckAllMenu">{{
              $t('ui.tree.unselect_all')
            }}</el-button>
          </div>

          <VbenTree
            ref="vbenTreeRef"
            v-model="selectedMenuIds"
            :tree-data="menuTreeData"
            multiple
            bordered
            :default-expanded-level="4"
            value-field="id"
            label-field="meta.name"
            icon-field="meta.icon"
            :children-field="'children'"
            class="w-full"
          >
            <template #node="{ value }">
              <IconifyIcon v-if="value.meta.icon" :icon="value.meta.icon" />
              <span>{{ value.meta.name }}</span>
            </template>
          </VbenTree>
        </div>
      </el-tab-pane>

      <!-- API权限标签页 -->
      <el-tab-pane :label="$t('page.system.role.apiAuth')" name="api">
        <div class="flex flex-col gap-4">
          <div class="flex gap-2">
            <el-button @click="expandAllApi">{{
              $t('ui.tree.expand_all')
            }}</el-button>
            <el-button @click="collapseAllApi">{{
              $t('ui.tree.collapse_all')
            }}</el-button>
            <el-button @click="checkAllApi">{{
              $t('ui.tree.select_all')
            }}</el-button>
            <el-button @click="uncheckAllApi">{{
              $t('ui.tree.unselect_all')
            }}</el-button>
          </div>

          <VbenTree
            ref="vbenApiTreeRef"
            v-model="selectedApiIds"
            :tree-data="apiTreeData"
            multiple
            bordered
            :default-expanded-level="4"
            value-field="id"
            label-field="description"
            :children-field="'children'"
            :check-strictly="false"
            class="w-full"
          >
            <template #node="{ value }">
              <div class="flex items-center">
                <span>{{ value.description }}</span>
                <span v-if="value.path" class="ml-2 text-xs text-gray-400">
                  {{ value.path }}
                </span>
              </div>
            </template>
          </VbenTree>
        </div>
      </el-tab-pane>
    </el-tabs>
  </Drawer>
</template>
