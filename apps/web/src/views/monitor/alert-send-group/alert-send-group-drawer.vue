<script lang="ts" setup>
import { computed, ref } from 'vue';
import { POSITION, useToast } from 'vue-toastification';

import { useVbenDrawer, z } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createAlertSendGroupApi,
  getAlertPoolListApi,
  getDutyGroupListApi,
  getUserListApi,
  updateAlertSendGroupApi,
} from '#/api';
import { $t } from '#/locales';

import { needUpgradeList, sendResolvedList } from './consts';

// 接受父组件传递的数据
const data = ref();
const toast = useToast();

const isCreate = computed(() => data.value?.create);
const getTitle = computed(() =>
  isCreate.value
    ? $t('ui.modal.create', {
        moduleName: $t('page.monitor.alertSendGroup.module'),
      })
    : $t('ui.modal.update', {
        moduleName: $t('page.monitor.alertSendGroup.module'),
      }),
);

const [Form, formApi] = useVbenForm({
  // 不显示默认操作按钮
  showDefaultActions: false,

  // 所有表单项共用，可单独在表单内覆盖
  commonConfig: {
    // labelWidth: 140, // 设置标签宽度
    // 所有表单项
    componentProps: {
      class: 'w-full',
    },
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('page.monitor.alertSendGroup.columns.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.alertSendGroup.columns.name'),
        }),
        allowClear: true,
      },
      rules: z
        .string()
        .min(1, {
          message: $t('ui.formRules.required', {
            label: $t('page.monitor.alertSendGroup.columns.name'),
          }),
        })
        .regex(/^[a-z]([a-z-]*[a-z])?$/i, {
          message: $t('ui.rules.name'),
        })
        .min(2, { message: $t('ui.rules.name_length') })
        .max(63, { message: $t('ui.rules.name_max_length') }),
    },
    {
      component: 'Input',
      fieldName: 'nameZh',
      label: $t('page.monitor.alertSendGroup.columns.nameZh'),
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.alertSendGroup.columns.nameZh'),
        }),
        allowClear: true,
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertSendGroup.columns.nameZh'),
        }),
      }),
    },
    {
      component: 'ApiSelect',
      fieldName: 'poolId',
      label: $t('page.monitor.alertSendGroup.columns.poolId'),
      componentProps: {
        placeholder: $t('ui.placeholder.select', {
          label: $t('page.monitor.alertSendGroup.columns.poolId'),
        }),
        api: async () => {
          const result = await getAlertPoolListApi({
            page: 1,
            pageSize: 1000,
          });
          return result.items;
        },
        labelField: 'name',
        valueField: 'id',
        multiple: false,
        collapseTags: true,
        filterable: true,
        clearable: true,
        allowClear: true,
      },
      rules: z.number().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertSendGroup.columns.poolId'),
        }),
      }),
    },
    {
      component: 'ApiSelect',
      fieldName: 'onDutyGroupId',
      label: $t('page.monitor.alertSendGroup.columns.onDutyGroupId'),
      componentProps: {
        placeholder: $t('ui.placeholder.select', {
          label: $t('page.monitor.alertSendGroup.columns.onDutyGroupId'),
        }),
        api: async () => {
          const result = await getDutyGroupListApi({
            page: 1,
            pageSize: 1000,
          });
          return result.items;
        },
        labelField: 'name',
        valueField: 'id',
        multiple: false,
        collapseTags: true,
        filterable: true,
      },
      rules: z.number().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertSendGroup.columns.onDutyGroupId'),
        }),
      }),
    },
    {
      component: 'Input',
      fieldName: 'repeatInterval',
      label: $t('page.monitor.alertSendGroup.columns.repeatInterval'),
      defaultValue: '10m',
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.alertSendGroup.columns.repeatInterval'),
        }),
        allowClear: true,
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertSendGroup.columns.repeatInterval'),
        }),
      }),
    },
    {
      component: 'RadioGroup',
      fieldName: 'sendResolved',
      defaultValue: 1,
      label: $t('page.monitor.alertSendGroup.columns.sendResolved'),
      rules: 'selectRequired',
      componentProps: {
        optionType: 'button',
        class: 'flex flex-wrap',
        options: sendResolvedList,
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'needUpgrade',
      defaultValue: 1,
      label: $t('page.monitor.alertSendGroup.columns.needUpgrade'),
      rules: 'selectRequired',
      componentProps: {
        optionType: 'button',
        class: 'flex flex-wrap',
        options: needUpgradeList,
      },
    },
    {
      component: 'Input',
      fieldName: 'upgradeMinutes',
      label: $t('page.monitor.alertSendGroup.columns.upgradeMinutes'),
      defaultValue: 10,
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.alertSendGroup.columns.upgradeMinutes'),
        }),
        allowClear: true,
      },
      // 只有当needUpgrade为1时才显示
      dependencies: {
        // 触发依赖的字段
        triggerFields: ['needUpgrade'],
        // 动态判断是否显示
        if: (values) => values.needUpgrade === 1, // 完全不渲染组件
      },
      rules: z.number().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertSendGroup.columns.upgradeMinutes'),
        }),
      }),
    },
    {
      component: 'ApiSelect',
      fieldName: 'firstUpgradeUserIds',
      label: $t('page.monitor.alertSendGroup.columns.firstUpgradeUserIds'),
      componentProps: {
        placeholder: $t('ui.placeholder.select', {
          label: $t('page.monitor.alertSendGroup.columns.firstUpgradeUserIds'),
        }),
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
        collapseTags: false,
        filterable: true,
      },
      // 只有当needUpgrade为1时才显示
      dependencies: {
        // 触发依赖的字段
        triggerFields: ['needUpgrade'],
        // 动态判断是否显示
        if: (values) => values.needUpgrade === 1, // 完全不渲染组件
      },
      rules: z.array(z.number()).min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertSendGroup.columns.firstUpgradeUserIds'),
        }),
      }),
    },
  ],
});

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  async onOpened() {
    setLoading(true);
    data.value = drawerApi.getData<Record<string, any>>();

    const formData = { ...data.value?.row };

    if (isCreate.value) {
      // 并行获取
      const [poolResult, dutyResult] = await Promise.allSettled([
        getAlertPoolListApi({ page: 1, pageSize: 1000 }),
        getDutyGroupListApi({ page: 1, pageSize: 1000 }),
      ]);

      // 设置关联告警池默认值 第一个
      if (
        poolResult.status === 'fulfilled' &&
        poolResult.value.items.length > 0 &&
        (!formData.poolId || formData.poolId === 0)
      ) {
        formData.poolId = poolResult.value.items[0].id;
      }

      // 设置关联值班组默认值 第一个
      if (
        dutyResult.status === 'fulfilled' &&
        dutyResult.value.items.length > 0 &&
        (!formData.onDutyGroupId || formData.onDutyGroupId === 0)
      ) {
        formData.onDutyGroupId = dutyResult.value.items[0].id;
      }
    }

    // 为表单赋值
    formApi.setValues(formData);

    // 添加延时，确保加载状态至少显示300毫秒，否则后续的loading状态不会显示
    await new Promise((resolve) => setTimeout(resolve, 300));
    setLoading(false);
  },
  async onConfirm() {
    // 校验输入的数据
    const validate = await formApi.validate();
    if (!validate.valid) {
      toast.error($t('ui.notification.validate_failed'), {
        timeout: 2000,
        position: POSITION.TOP_CENTER,
      });
      return;
    }

    setLoading(true);

    try {
      const values = await formApi.getValues();
      await (data.value?.create
        ? createAlertSendGroupApi(values)
        : updateAlertSendGroupApi(data.value.row.id, values));
      drawerApi.setData({ needRefresh: true });
    } finally {
      drawerApi.close();
      setLoading(false);
    }
  },
});

async function setLoading(loading: boolean) {
  drawerApi.setState({ loading });
}
</script>

<template>
  <Drawer :title="getTitle">
    <Form />
  </Drawer>
</template>
