<script lang="ts" setup>
import { computed, ref } from 'vue';
import { POSITION, useToast } from 'vue-toastification';

import { useVbenDrawer, z } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createAlertPoolApi, getHostListApi, updateAlertPoolApi } from '#/api';
import { $t } from '#/locales';

// 接受父组件传递的数据
const data = ref();
const toast = useToast();

const isCreate = computed(() => data.value?.create);
const getTitle = computed(() =>
  isCreate.value
    ? $t('ui.modal.create', {
        moduleName: $t('page.monitor.alertPool.module'),
      })
    : $t('ui.modal.update', {
        moduleName: $t('page.monitor.alertPool.module'),
      }),
);

// 验证每行标签格式
const validateLabelsPerLine = (value: string) => {
  if (!value) return true;

  // 按行分割输入
  const lines = value.split('\n');
  // 验证每行都是非空字符串
  const isValid = lines.every((line) => {
    // 忽略空行
    if (!line.trim()) return true;
    // 只要不是空字符串就是有效的
    return line.trim().length > 0;
  });

  return isValid;
};

const [poolForm, poolFormApi] = useVbenForm({
  // 不显示默认操作按钮
  showDefaultActions: false,

  // 所有表单项共用，可单独在表单内覆盖
  commonConfig: {
    labelWidth: 140, // 设置标签宽度
    // 所有表单项
    componentProps: {
      class: 'w-full',
    },
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('page.monitor.alertPool.columns.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.alertPool.columns.name'),
        }),
        allowClear: true,
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertPool.columns.name'),
        }),
      }),
    },
    {
      component: 'Input',
      fieldName: 'resolveTimeout',
      label: $t('page.monitor.alertPool.columns.resolveTimeout'),
      defaultValue: '1h',
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.alertPool.columns.resolveTimeout'),
        }),
        allowClear: true,
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertPool.columns.resolveTimeout'),
        }),
      }),
    },
    {
      component: 'Input',
      fieldName: 'groupWait',
      label: $t('page.monitor.alertPool.columns.groupWait'),
      defaultValue: '1m',
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.alertPool.columns.groupWait'),
        }),
        allowClear: true,
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertPool.columns.groupWait'),
        }),
      }),
    },
    {
      component: 'Input',
      fieldName: 'groupInterval',
      label: $t('page.monitor.alertPool.columns.groupInterval'),
      defaultValue: '1m',
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.alertPool.columns.groupInterval'),
        }),
        allowClear: true,
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertPool.columns.groupInterval'),
        }),
      }),
    },
    {
      component: 'Input',
      fieldName: 'repeatInterval',
      label: $t('page.monitor.alertPool.columns.repeatInterval'),
      defaultValue: '1h',
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.alertPool.columns.repeatInterval'),
        }),
        allowClear: true,
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertPool.columns.repeatInterval'),
        }),
      }),
    },
    {
      component: 'ApiSelect',
      fieldName: 'alertmanagerInstancesIds',
      label: $t('page.monitor.alertPool.columns.alertmanagerInstances'),
      componentProps: {
        placeholder: $t('page.monitor.alertPool.prompt.alertmanagerInstances'),
        api: async () => {
          const result = await getHostListApi({
            page: 1,
            pageSize: 1000,
          });
          return result.items;
        },
        labelField: 'hostIp',
        valueField: 'id',
        multiple: true,
        collapseTags: false,
        filterable: true,
      },
      rules: z.array(z.number()).min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertPool.columns.alertmanagerInstances'),
        }),
      }),
    },
    {
      component: 'Input',
      fieldName: 'groupByStr',
      label: $t('page.monitor.alertPool.columns.groupBy'),
      defaultValue: 'alertname',
      componentProps: {
        placeholder: $t('page.monitor.alertPool.prompt.groupBy'),
        type: 'textarea',
        autosize: { minRows: 3, maxRows: 6 },
      },
      // 使用自定义规则验证标签格式
      rules: z
        .string()
        .min(1, {
          message: $t('ui.formRules.required', {
            label: $t('page.monitor.alertPool.columns.groupBy'),
          }),
        })
        .refine(validateLabelsPerLine, {
          message: $t('page.monitor.alertPool.prompt.groupByFormat'),
        }),
      help: $t('page.monitor.alertPool.prompt.groupByHelp'),
    },
    {
      component: 'Input',
      fieldName: 'receiver',
      label: $t('page.monitor.alertPool.columns.receiver'),
      defaultValue: 'default-webhook',
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.alertPool.columns.receiver'),
        }),
        allowClear: true,
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertPool.columns.receiver'),
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

    if (
      !isCreate.value &&
      data.value?.row && // 处理externalLabels，将数组转换为每行一个标签的格式
      data.value.row.groupBy &&
      Array.isArray(data.value.row.groupBy)
    ) {
      data.value.row.groupByStr = data.value.row.groupBy.join('\n');
    }
    // 为表单赋值
    poolFormApi.setValues(data.value?.row);
    // 添加延时，确保加载状态至少显示300毫秒，否则后续的loading状态不会显示
    await new Promise((resolve) => setTimeout(resolve, 300));
    setLoading(false);
  },
  async onConfirm() {
    // 校验输入的数据
    const validate = await poolFormApi.validate();
    if (!validate.valid) {
      toast.error($t('ui.notification.validate_failed'), {
        timeout: 2000,
        position: POSITION.TOP_CENTER,
      });
      return;
    }

    setLoading(true);

    // 获取表单数据
    const values = await poolFormApi.getValues();
    // 将多行文本转换为数组
    if (values?.groupByStr) {
      const labelsArray = values.groupByStr
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean); // 过滤空行

      values.groupBy = labelsArray;
    }
    try {
      await (data.value?.create
        ? createAlertPoolApi(values)
        : updateAlertPoolApi(data.value.row.id, values));
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
  <Drawer :title="getTitle" class="min-w-[600px]">
    <poolForm />
  </Drawer>
</template>
