<script lang="ts" setup>
import { useVbenModal, z } from '@vben/common-ui';
import { useVbenForm } from '#/adapter/form';
import { resetPasswordApi } from '#/api/core/user';
import { $t } from '#/locales';
import { useToast, POSITION } from 'vue-toastification';
import { ref } from 'vue';

defineOptions({
  name: 'ResetPasswordModal',
});

const toast = useToast();
// 用户ID
const userId = ref('');

const [Form, formApi] = useVbenForm({
  handleSubmit: onSubmit,
  schema: [
    {
      component: 'VbenInputPassword',
      fieldName: 'password',
      label: $t('page.system.user.newPassword'),
      componentProps: {
        passwordStrength: true, // 启用密码强度指示
        placeholder: $t('ui.placeholder.input'),
      },
      rules: z.string().min(6, $t('page.system.user.passwordMinLength')),
    },
    {
      component: 'VbenInputPassword',
      fieldName: 'confirmPassword',
      label: $t('page.system.user.confirmPassword'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
      },
      dependencies: {
        triggerFields: ['password'],
        rules: (values) => {
          return z.string().refine(
            (val) => val === values.password,
            {
              message: $t('page.system.user.passwordNotMatch'),
            },
          );
        },
      },
    },
  ],
  showDefaultActions: false, // 不显示默认的表单按钮
});

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  title: $t('page.system.user.resetPassword'),
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    await formApi.validateAndSubmitForm();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 获取传入的用户ID
      const data = modalApi.getData<{ id: string }>();
      if (data && data.id) {
        userId.value = data.id;
        // 重置表单
        formApi.resetForm();
      }
    }
  },
});

async function onSubmit(values: Record<string, any>) {
  try {
    setLoading(true);
    // 调用重置密码API
    await resetPasswordApi(userId.value, { password: values.password });

    toast.success($t('page.system.user.resetPasswordSuccess'), {
      timeout: 1000,
      position: POSITION.TOP_RIGHT,
      toastClassName: 'toastification-success',
    });

    // 关闭模态框
    modalApi.close();
  } catch {
    toast.error($t('page.system.user.resetPasswordFailed'), {
      timeout: 1000,
      position: POSITION.TOP_RIGHT,
      toastClassName: 'toastification-error',
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