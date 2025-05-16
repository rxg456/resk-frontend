<script lang="ts" setup>
import { computed, ref } from 'vue';
import { POSITION, useToast } from 'vue-toastification';

import { useVbenDrawer, z } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createScrapePoolApi,
  getHostListApi,
  updateScrapePoolApi,
} from '#/api';
import { $t } from '#/locales';

// 接受父组件传递的数据
const data = ref();
const toast = useToast();

const isCreate = computed(() => data.value?.create);
const getTitle = computed(() =>
  isCreate.value
    ? $t('ui.modal.create', {
        moduleName: $t('page.monitor.scrapePool.module'),
      })
    : $t('ui.modal.update', {
        moduleName: $t('page.monitor.scrapePool.module'),
      }),
);

// 验证每行标签格式
const validateLabelsPerLine = (value: string) => {
  if (!value) return true;

  // 按行分割输入
  const lines = value.split('\n');
  // 验证每行都符合key=value格式
  const isValid = lines.every((line) => {
    // 忽略空行
    if (!line.trim()) return true;
    return /^\w+=.+$/.test(line.trim());
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
      label: $t('page.monitor.scrapePool.columns.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapePool.columns.name'),
        }),
        allowClear: true,
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.scrapePool.columns.name'),
        }),
      }),
    },
    {
      component: 'InputNumber',
      fieldName: 'scrapeInterval',
      label: $t('page.monitor.scrapePool.columns.scrapeInterval'),
      defaultValue: 30,
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapePool.columns.scrapeInterval'),
        }),
        allowClear: true,
      },
      rules: z.number().min(1, { message: $t('ui.formRules.numberRequired') }),
    },
    {
      component: 'InputNumber',
      fieldName: 'scrapeTimeout',
      label: $t('page.monitor.scrapePool.columns.scrapeTimeout'),
      defaultValue: 10,
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapePool.columns.scrapeTimeout'),
        }),
        allowClear: true,
      },
      rules: z.number().min(1, { message: $t('ui.formRules.numberRequired') }),
    },
    {
      component: 'Input',
      fieldName: 'externalLabelsStr',
      label: $t('page.monitor.scrapePool.columns.externalLabels'),
      componentProps: {
        placeholder: $t('page.monitor.scrapePool.prompt.externalLabels'),
        type: 'textarea',
        autosize: { minRows: 3, maxRows: 6 },
      },
      // 使用自定义规则验证标签格式
      rules: z
        .string()
        .min(1, {
          message: $t('ui.formRules.required', {
            label: $t('page.monitor.scrapePool.columns.externalLabels'),
          }),
        })
        .refine(validateLabelsPerLine, {
          message: $t('page.monitor.scrapePool.prompt.externalLabelsFormat'),
        }),
      help: $t('page.monitor.scrapePool.prompt.externalLabelsHelp'),
    },
    {
      component: 'ApiSelect',
      fieldName: 'prometheusInstancesIds',
      label: $t('page.monitor.scrapePool.columns.prometheusInstances'),
      componentProps: {
        placeholder: $t('page.monitor.scrapePool.prompt.prometheusInstances'),
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
          label: $t('page.monitor.scrapePool.columns.prometheusInstances'),
        }),
      }),
    },
    {
      component: 'Input',
      fieldName: 'remoteWriteUrl',
      label: $t('page.monitor.scrapePool.columns.remoteWriteUrl'),
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapePool.columns.remoteWriteUrl'),
        }),
        allowClear: true,
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'remoteTimeoutSeconds',
      label: $t('page.monitor.scrapePool.columns.remoteTimeoutSeconds'),
      defaultValue: 10,
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapePool.columns.remoteTimeoutSeconds'),
        }),
        allowClear: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'remoteReadUrl',
      label: $t('page.monitor.scrapePool.columns.remoteReadUrl'),
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapePool.columns.remoteReadUrl'),
        }),
        allowClear: true,
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'supportAlert',
      defaultValue: 1,
      label: $t('page.monitor.scrapePool.columns.supportAlert'),
      rules: 'selectRequired',
      componentProps: {
        optionType: 'button',
        class: 'flex flex-wrap', // 如果选项过多，可以添加class来自动折叠
        options: [
          { label: $t('ui.radio.support'), value: 1 },
          { label: $t('ui.radio.unsupport'), value: 2 },
        ],
      },
    },
    {
      component: 'Input',
      fieldName: 'alertManagerUrl',
      label: $t('page.monitor.scrapePool.columns.alertManagerUrl'),
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapePool.columns.alertManagerUrl'),
        }),
        allowClear: true,
      },
      // 只有当supportAlert为1时才显示
      dependencies: {
        // 触发依赖的字段
        triggerFields: ['supportAlert'],
        // 动态判断是否显示
        if: (values) => values.supportAlert === 1, // 完全不渲染组件
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.scrapePool.columns.alertManagerUrl'),
        }),
      }),
    },
    {
      component: 'Input',
      fieldName: 'ruleFilePath',
      label: $t('page.monitor.scrapePool.columns.ruleFilePath'),
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapePool.columns.ruleFilePath'),
        }),
        allowClear: true,
      },
      // 只有当supportAlert为1时才显示
      dependencies: {
        // 触发依赖的字段
        triggerFields: ['supportAlert'],
        // 动态判断是否显示
        if: (values) => values.supportAlert === 1, // 完全不渲染组件
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.scrapePool.columns.ruleFilePath'),
        }),
      }),
    },
    {
      component: 'RadioGroup',
      fieldName: 'supportRecord',
      defaultValue: 1,
      label: $t('page.monitor.scrapePool.columns.supportRecord'),
      rules: 'selectRequired',
      componentProps: {
        optionType: 'button',
        class: 'flex flex-wrap', // 如果选项过多，可以添加class来自动折叠
        options: [
          { label: $t('ui.radio.support'), value: 1 },
          { label: $t('ui.radio.unsupport'), value: 2 },
        ],
      },
    },
    {
      component: 'Input',
      fieldName: 'recordFilePath',
      label: $t('page.monitor.scrapePool.columns.recordFilePath'),
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapePool.columns.recordFilePath'),
        }),
        allowClear: true,
      },
      // 只有当supportAlert为1时才显示
      dependencies: {
        // 触发依赖的字段
        triggerFields: ['supportRecord'],
        // 动态判断是否显示
        if: (values) => values.supportRecord === 1, // 完全不渲染组件
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.scrapePool.columns.recordFilePath'),
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
      data.value.row.externalLabels &&
      Array.isArray(data.value.row.externalLabels)
    ) {
      data.value.row.externalLabelsStr =
        data.value.row.externalLabels.join('\n');
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
    if (values?.externalLabelsStr) {
      const labelsArray = values.externalLabelsStr
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean); // 过滤空行

      values.externalLabels = labelsArray;
    }
    try {
      await (data.value?.create
        ? createScrapePoolApi(values)
        : updateScrapePoolApi(data.value.row.id, values));
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
