<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal, z } from '@vben/common-ui';
import { useVbenForm } from '#/adapter/form';
import { $t } from '#/locales';
import { useToast, POSITION } from 'vue-toastification';

import { createStreeNodeApi } from '#/api/stree/streenode';

defineOptions({
  name: 'CreateStreeNodeModal',
});

const data = ref();

const toast = useToast();

const [Form, formApi] = useVbenForm({
  handleSubmit: onSubmit, // 提交表单
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
  ],
  showDefaultActions: false, // 不显示默认的表单按钮
});

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  title: $t('page.stree.node.button.createTop'),
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      modalApi.setState({ loading: true }); // 可选，会自动设置
      await formApi.validateAndSubmitForm();
      modalApi.close();
    } catch (error) {
      toast.error($t('page.stree.node.notification.createFailed'));
      // 不关闭模态框，允许用户修改
    } finally {
      modalApi.setState({ loading: false });
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 重置表单
      formApi.resetForm();
      // 获取父组件传递的数据
      data.value = modalApi.getData<{
        isCreateTop: boolean;
        pId?: number;
        level?: number;
      }>();
    }
  },
});

async function onSubmit(values: Record<string, any>) {
  try {
    setLoading(true);
    if (data.value?.isCreateTop) {
      // 顶级节点
      values.pId = 0;
      values.level = 1;
    } else {
      values.pId = data.value?.pId;
      values.level = data.value?.level;
    }
    // 调用新增节点API
    await createStreeNodeApi(values);
    // 关闭模态框
    modalApi.close();
    // 刷新树
    modalApi.setData({ needRefresh: true });
  } catch {
    toast.error($t('page.stree.node.notification.createFailed'), {
      timeout: 1000,
      position: POSITION.TOP_RIGHT,
    });
  } finally {
    setLoading(false);
  }
}

function setLoading(loading: boolean) {
  modalApi.setState({ loading });
}
</script>
<template>
  <Modal>
    <Form />
  </Modal>
</template>
