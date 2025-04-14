<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useVbenDrawer, z, VbenLoading } from '@vben/common-ui';
import { useVbenForm } from '#/adapter/form';
import { $t } from '#/locales';
import {
  getAllNonLeafStreeNodesApi,
  getUserListApi,
  updateStreeNodeApi,
} from '#/api';
import { useToast, POSITION } from 'vue-toastification';

const toast = useToast();
const data = ref();
const drawerTitle = computed(() => {
  return $t('page.stree.node.editTitle');
});

// 添加loading状态
const isLoading = ref(true);

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  async onOpened() {
    isLoading.value = true;
    data.value = drawerApi.getData<Record<string, any>>();
    // 为表单赋值
    nodeFormApi.setValues(data.value.data);

    // 添加延时，确保加载状态至少显示300毫秒，否则后续的loading状态不会显示
    await new Promise((resolve) => setTimeout(resolve, 300));
    isLoading.value = false;
  },
  async onConfirm() {
    setLoading(true);
    // 校验输入的数据
    const validate = await nodeFormApi.validate();
    if (!validate.valid) {
      return;
    }

    // 获取表单数据
    const values = await nodeFormApi.getValues();

    try {
      if (data.value.data.id) {
        await updateStreeNodeApi(data.value.data.id, values);
      }
      // 需要刷新tree的标志
      drawerApi.setData({ needRefresh: true });
    } catch {

    } finally {
      drawerApi.close();
      setLoading(false);
    }
  },
});

const [NodeForm, nodeFormApi] = useVbenForm({
  // 不显示默认操作按钮
  showDefaultActions: false,
  // 所有表单项共用，可单独在表单内覆盖
  commonConfig: {
    // 所有表单项
    componentProps: {
      class: 'w-full',
    },
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'title',
      label: $t('page.stree.node.title'),
      componentProps: {
        placeholder: $t('page.stree.node.prompt.title'),
      },
      rules: z.string().min(1, { message: $t('ui.formRules.required') }),
    },
    {
      component: 'Input',
      fieldName: 'desc',
      label: $t('page.stree.node.desc'),
      componentProps: {
        placeholder: $t('page.stree.node.prompt.desc'),
      },
      rules: z.string().min(1, { message: $t('ui.formRules.required') }),
    },
    {
      component: 'Switch',
      fieldName: 'isLeaf',
      defaultValue: 0,
      label: $t('page.stree.node.isLeaf'),
      componentProps: {
        activeValue: 1,
        inactiveValue: 0,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'pId',
      label: $t('page.stree.node.pId'),
      componentProps: {
        placeholder: $t('page.stree.node.prompt.pId'),
        api: async () => {
          const result = await getAllNonLeafStreeNodesApi();
          return result;
        },
        labelField: 'title',
        valueField: 'id',
        filterable: true,
      },
      rules: 'selectRequired',
    },
    {
      component: 'Input',
      fieldName: 'level',
      label: $t('page.stree.node.tabs.treeLevel'),
      componentProps: {
        placeholder: $t('page.stree.node.prompt.treeLevel'),
        disabled: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'ops_admin_users_ids',
      label: $t('page.stree.node.tabs.opsAdmin'),
      componentProps: {
        placeholder: $t('page.stree.node.prompt.opsAdmin'),
        api: async () => {
          const result = await getUserListApi({
            page: 1,
            pageSize: 1000,
          });
          return result.items;
        },
        labelField: 'username',
        valueField: 'id',
        multiple: true,
        collapseTags: true,
        filterable: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'dev_manager_users_ids',
      label: $t('page.stree.node.tabs.devManager'),
      componentProps: {
        placeholder: $t('page.stree.node.prompt.devManager'),
        api: async () => {
          const result = await getUserListApi({
            page: 1,
            pageSize: 1000,
          });
          return result.items;
        },
        labelField: 'username',
        valueField: 'id',
        multiple: true,
        collapseTags: true,
        filterable: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'developers_ids',
      label: $t('page.stree.node.tabs.developers'),
      componentProps: {
        placeholder: $t('page.stree.node.prompt.developers'),
        api: async () => {
          const result = await getUserListApi({
            page: 1,
            pageSize: 1000,
          });
          return result.items;
        },
        labelField: 'username',
        valueField: 'id',
        multiple: true,
        collapseTags: true,
        filterable: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'testers_ids',
      label: $t('page.stree.node.tabs.testers'),
      componentProps: {
        placeholder: $t('page.stree.node.prompt.testers'),
        api: async () => {
          const result = await getUserListApi({
            page: 1,
            pageSize: 1000,
          });
          return result.items;
        },
        labelField: 'username',
        valueField: 'id',
        multiple: true,
        collapseTags: true,
        filterable: true,
      },
    },
  ],
});

function setLoading(loading: boolean) {
  drawerApi.setState({ loading });
  isLoading.value = loading;
}
</script>

<template>
  <Drawer :title="drawerTitle">
    <NodeForm>
      <!-- 使用vben的Loading组件 -->
      <VbenLoading :spinning="isLoading" text="加载中..." />
    </NodeForm>
  </Drawer>
</template>
