<script lang="ts" setup>
import { computed, ref } from 'vue';
import { POSITION, useToast } from 'vue-toastification';

import { useVbenDrawer, z } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createHostApi, updateHostApi } from '#/api';
import { $t } from '#/locales';

import {
  envList,
  osTypeList,
  statusList,
  vendorList,
  vmTypeList,
} from './consts';

const toast = useToast();
const data = ref();
const isCreate = computed(() => data.value?.create);
const getTitle = computed(() =>
  isCreate.value
    ? $t('ui.modal.create', { moduleName: $t('page.stree.host.module') })
    : $t('ui.modal.update', { moduleName: $t('page.stree.host.module') }),
);

const [HostForm, hostFormApi] = useVbenForm({
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
      fieldName: 'hostName',
      label: $t('page.stree.host.columns.hostName'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
      rules: z.string().min(1, { message: $t('ui.formRules.required') }),
    },
    {
      component: 'Input',
      fieldName: 'hostIp',
      label: $t('page.stree.host.columns.hostIp'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
      rules: z.string().min(1, { message: $t('ui.formRules.required') }),
    },
    {
      component: 'Input',
      fieldName: 'cpu',
      label: $t('page.stree.host.columns.cpu'),
      defaultValue: 1,
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
      rules: z.number().min(1, { message: $t('ui.formRules.required') }),
    },
    {
      component: 'Input',
      fieldName: 'memory',
      label: $t('page.stree.host.columns.memory'),
      defaultValue: 1,
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
      rules: z.number().min(1, { message: $t('ui.formRules.required') }),
    },
    {
      component: 'Input',
      fieldName: 'nodeExporterPort',
      label: $t('page.stree.host.columns.nodeExporterPort'),
      defaultValue: 9100,
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
      rules: z.number().min(1, { message: $t('ui.formRules.required') }),
    },
    {
      component: 'Select',
      fieldName: 'osType',
      label: $t('page.stree.host.columns.osType'),
      defaultValue: 1,
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        allowClear: true,
        options: osTypeList,
      },
      rules: z.number().min(1, { message: $t('ui.formRules.required') }),
    },
    {
      component: 'Input',
      fieldName: 'osInfo',
      label: $t('page.stree.host.columns.osInfo'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'vmType',
      label: $t('page.stree.host.columns.vmType'),
      defaultValue: 1,
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        allowClear: true,
        options: vmTypeList,
      },
      rules: z.number().min(1, { message: $t('ui.formRules.required') }),
    },
    {
      component: 'Select',
      fieldName: 'env',
      label: $t('page.stree.host.columns.env'),
      defaultValue: 1,
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        allowClear: true,
        options: envList,
      },
      rules: z.number().min(1, { message: $t('ui.formRules.required') }),
    },
    {
      component: 'Select',
      fieldName: 'vendor',
      label: $t('page.stree.host.columns.vendor'),
      defaultValue: 1,
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        allowClear: true,
        options: vendorList,
      },
      rules: z.number().min(1, { message: $t('ui.formRules.required') }),
    },
    {
      component: 'Input',
      fieldName: 'zone',
      label: $t('page.stree.host.columns.zone'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('page.stree.host.columns.status'),
      defaultValue: 1,
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        allowClear: true,
        options: statusList,
      },
      rules: z.number().min(1, { message: $t('ui.formRules.required') }),
    },
    {
      component: 'Input',
      fieldName: 'streeNodePath',
      label: $t('page.stree.host.columns.streeNodePath'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        disabled: true,
      },
      dependencies: {
        triggerFields: ['isCreate'],
        if: () => !isCreate.value,
      },
    },
    {
      component: 'Input',
      fieldName: 'description',
      label: $t('page.stree.host.columns.description'),
      componentProps: {
        placeholder: $t('ui.placeholder.input'),
        allowClear: true,
        type: 'textarea',
        autosize: { minRows: 2, maxRows: 6 },
      },
    },
  ],
});

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  async onConfirm() {
    // 校验输入的数据
    const validate = await hostFormApi.validate();
    if (!validate.valid) {
      return;
    }

    setLoading(true);

    // 获取表单数据
    const values = await hostFormApi.getValues();

    try {
      await (data.value?.create
        ? createHostApi(values)
        : updateHostApi(data.value.row.id, values));

      drawerApi.setData({ needRefresh: true });
    } catch {
      toast.error(
        data.value?.create
          ? $t('ui.notification.create_failed')
          : $t('ui.notification.update_failed'),
        {
          timeout: 2000,
          position: POSITION.TOP_CENTER,
        },
      );
    } finally {
      drawerApi.close();
      setLoading(false);
    }
  },

  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 获取传入的数据
      data.value = drawerApi.getData<Record<string, any>>();

      // 为表单赋值
      hostFormApi.setValues(data.value?.row);

      setLoading(false);
    }
  },
});

function setLoading(loading: boolean) {
  drawerApi.setState({ loading });
}
</script>

<template>
  <Drawer :title="getTitle">
    <HostForm />
  </Drawer>
</template>
