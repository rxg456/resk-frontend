<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import type Node from 'element-plus/es/components/tree/src/model/node';
import {
  getTopStreeNodesApi,
  getNextLevelStreeNodesApi,
  deleteStreeNodeApi,
} from '#/api';
import { $t } from '#/locales';
import { useToast, POSITION } from 'vue-toastification';
import { ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus';
import { Icon } from '@iconify/vue';

// 提示
const toast = useToast();

// 存储顶级节点数据
const treeData = ref([]);
const isLoading = ref(true);

const treeProps = {
  label: 'title',
  isLeaf: (data: any) => data?.isLeaf === 1,
};

// 添加props定义，接收父组件传递的方法
const compProps = defineProps({
  onCreateNode: {
    type: Function,
    required: false,
  },
});

// 加载顶级节点的函数
const loadTopNodes = async () => {
  isLoading.value = true;
  try {
    // 调用API获取顶级节点
    const response = await getTopStreeNodesApi();
    treeData.value = response || [];
  } catch (error) {
    toast.error($t('page.stree.node.notification.load_failed'), {
      timeout: 1000,
      position: POSITION.TOP_CENTER,
    });
  } finally {
    isLoading.value = false;
  }
};

// 事件发射
const emit = defineEmits(['node-click']);

// 节点点击处理函数
const handleNodeClick = (data: any) => {
  emit('node-click', data);
};

// 对外暴露刷新树的方法
const refreshTree = async () => {
  await loadTopNodes();
};

// 导出刷新方法给父组件使用
defineExpose({
  refreshTree,
});

// 页面加载时自动请求顶级节点
onMounted(loadTopNodes);

// 懒加载子节点函数
const loadNode = async (node: Node, resolve: (data: any[]) => void) => {
  isLoading.value = true;
  // 如果是根节点，返回已加载的顶级节点
  if (node.level === 0) {
    return resolve(treeData.value);
  }

  try {
    // 使用实际API获取子节点数据
    const response = await getNextLevelStreeNodesApi(node.data.id.toString());
    resolve(response || []);
  } catch (error) {
    toast.error($t('page.stree.node.notification.load_failed'), {
      timeout: 1000,
      position: POSITION.TOP_CENTER,
    });
    resolve([]);
  } finally {
    isLoading.value = false;
  }
};

const handleCommand = async (command: string, node: Node) => {
  if (command === 'add') {
    // 调用父组件传入的方法
    if (compProps.onCreateNode) {
      // false表示不是创建顶级节点，传入父节点ID和下一级level
      compProps.onCreateNode(false, node.data.id, node.data.level + 1);
    }
  } else if (command === 'delete') {
    await deleteStreeNodeApi(node.data.id);
    // 刷新树
    refreshTree();
  }
};
</script>

<template>
  <div>
    <!-- 树组件 -->
    <el-tree
      v-loading="isLoading"
      :data="treeData"
      :load="loadNode"
      node-key="id"
      :props="treeProps"
      lazy
      highlight-current
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <!-- 将整个节点内容包装在el-dropdown中 -->
        <el-dropdown
          trigger="contextmenu"
          @command="(cmd) => handleCommand(cmd, node)"
        >
          <!-- 节点内容作为触发元素 -->
          <div class="flex w-full items-center">
            <Icon
              v-if="data.isLeaf == 0"
              icon="tabler:box-multiple"
              class="mr-1 size-4"
            />
            <Icon v-else icon="tabler:box" class="mr-1 size-4" />
            <span>{{ data.title }}</span>
          </div>

          <!-- 右键菜单 -->
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="data.isLeaf == 0" command="add">
                <Icon icon="mdi:plus" class="mr-1" />
                新增节点
              </el-dropdown-item>
              <el-dropdown-item
                command="delete"
                style="color: var(--el-color-danger)"
              >
                <Icon icon="mdi:delete" class="mr-1" />
                删除节点
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </el-tree>
  </div>
</template>
