<script lang="ts" setup>
import { computed, ref } from 'vue';
import { POSITION, useToast } from 'vue-toastification';

import { useVbenDrawer, z } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  checkAlertRuleExprApi,
  createAlertRuleApi,
  getAlertSendGroupListApi,
  getAllStreeNodesApi,
  getScrapePoolListApi,
  updateAlertRuleApi,
} from '#/api';
import { $t } from '#/locales';

import { enableList, severityList } from './consts';

// 接受父组件传递的数据
const data = ref();
const exprSuccess = ref(false);
const toast = useToast();

const isCreate = computed(() => data.value?.create);
const getTitle = computed(() =>
  isCreate.value
    ? $t('ui.modal.create', {
        moduleName: $t('page.monitor.alertRule.module'),
      })
    : $t('ui.modal.update', {
        moduleName: $t('page.monitor.alertRule.module'),
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
      label: $t('page.monitor.alertRule.columns.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.alertRule.columns.name'),
        }),
        allowClear: true,
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertRule.columns.name'),
        }),
      }),
    },
    {
      component: 'RadioGroup',
      fieldName: 'enable',
      defaultValue: 1,
      label: $t('page.monitor.alertRule.columns.enable'),
      rules: 'selectRequired',
      componentProps: {
        optionType: 'button',
        class: 'flex flex-wrap',
        options: enableList,
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'severity',
      defaultValue: 1,
      label: $t('page.monitor.alertRule.columns.severity'),
      rules: 'selectRequired',
      componentProps: {
        optionType: 'button',
        class: 'flex flex-wrap',
        options: severityList,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'poolId',
      label: $t('page.monitor.alertRule.columns.poolId'),
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        api: async () => {
          const result = await getScrapePoolListApi({
            page: 1,
            pageSize: 1000,
            supportAlert: 1, // 支持告警的prometheus池
          });
          return result.items;
        },
        labelField: 'name',
        valueField: 'id',
        filterable: true,
        clearable: true,
      },
      rules: z.number().min(1, {
        message: $t('ui.formRules.selectRequired', {
          label: $t('page.monitor.alertRule.columns.poolId'),
        }),
      }),
    },
    {
      component: 'ApiSelect',
      fieldName: 'sendGroupId',
      label: $t('page.monitor.alertRule.columns.sendGroupId'),
      componentProps: {
        placeholder: $t('ui.placeholder.select', {
          label: $t('page.monitor.alertRule.columns.sendGroupId'),
        }),
        api: async () => {
          const result = await getAlertSendGroupListApi({
            page: 1,
            pageSize: 1000,
          });
          return result.items;
        },
        labelField: 'name',
        valueField: 'id',
        filterable: true,
        clearable: true,
      },
      rules: z.number().min(1, {
        message: $t('ui.formRules.selectRequired', {
          label: $t('page.monitor.alertRule.columns.sendGroupId'),
        }),
      }),
    },
    {
      component: 'ApiSelect',
      fieldName: 'treeNodeId',
      label: $t('page.monitor.alertRule.columns.treeNodeId'),
      componentProps: {
        placeholder: $t('ui.placeholder.select', {
          label: $t('page.monitor.alertRule.columns.treeNodeId'),
        }),
        api: async () => {
          const result = await getAllStreeNodesApi();
          return result;
        },
        labelField: 'node_path',
        valueField: 'id',
        filterable: true,
        clearable: true,
      },
      rules: z.number().min(1, {
        message: $t('ui.formRules.selectRequired', {
          label: $t('page.monitor.alertRule.columns.treeNodeId'),
        }),
      }),
    },
    {
      component: 'Input',
      fieldName: 'forTime',
      label: $t('page.monitor.alertRule.columns.forTime'),
      defaultValue: '1m',
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.alertRule.columns.forTime'),
        }),
        clearable: true,
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertRule.columns.forTime'),
        }),
      }),
    },
    {
      component: 'Input',
      fieldName: 'grafanaLink',
      label: $t('page.monitor.alertRule.columns.grafanaLink'),
      defaultValue: '',
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.alertRule.columns.grafanaLink'),
        }),
        clearable: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'labelsStr',
      label: $t('page.monitor.alertRule.columns.labels'),
      componentProps: {
        placeholder: $t('page.monitor.alertRule.prompt.labelsPlaceholder'),
        type: 'textarea',
        autosize: { minRows: 2, maxRows: 6 },
      },
      // 使用自定义规则验证标签格式
      rules: z.string().refine(validateLabelsPerLine, {
        message: $t('page.monitor.alertRule.prompt.labelsFormat'),
      }),
      help: $t('page.monitor.alertRule.prompt.labelsHelp'),
    },
    {
      component: 'Input',
      fieldName: 'annotationsStr',
      label: $t('page.monitor.alertRule.columns.annotations'),
      componentProps: {
        placeholder: $t('page.monitor.alertRule.prompt.annotationsPlaceholder'),
        type: 'textarea',
        autosize: { minRows: 2, maxRows: 6 },
      },
      // 使用自定义规则验证标签格式
      rules: z.string().refine(validateLabelsPerLine, {
        message: $t('page.monitor.alertRule.prompt.annotationsFormat'),
      }),
      help: $t('page.monitor.alertRule.prompt.annotationsHelp'),
    },
    {
      component: 'Input',
      fieldName: 'expr',
      label: $t('page.monitor.alertRule.columns.expr'),
      componentProps: {
        placeholder: $t('page.monitor.alertRule.prompt.exprPlaceholder'),
        type: 'textarea',
        autosize: { minRows: 2, maxRows: 6 },
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.alertRule.columns.expr'),
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

    // 创建时，设置关联prometheus池和发送组默认值
    if (isCreate.value) {
      // 并行获取
      const [poolResult, sendGroupResult, treeNodeResult] =
        await Promise.allSettled([
          getScrapePoolListApi({ page: 1, pageSize: 1000, supportAlert: 1 }),
          getAlertSendGroupListApi({ page: 1, pageSize: 1000 }),
          getAllStreeNodesApi(),
        ]);

      // 设置关联prometheus池默认值 第一个
      if (
        poolResult.status === 'fulfilled' &&
        poolResult.value.items.length > 0 &&
        (!formData.poolId || formData.poolId === 0)
      ) {
        formData.poolId = poolResult.value.items[0].id;
      }

      // 设置关联发送组默认值 第一个
      if (
        sendGroupResult.status === 'fulfilled' &&
        sendGroupResult.value.items.length > 0 &&
        (!formData.sendGroupId || formData.sendGroupId === 0)
      ) {
        formData.sendGroupId = sendGroupResult.value.items[0].id;
      }

      // 设置关联树节点默认值 第一个
      if (
        treeNodeResult.status === 'fulfilled' &&
        treeNodeResult.value.length > 0 &&
        (!formData.treeNodeId || formData.treeNodeId === 0)
      ) {
        formData.treeNodeId = treeNodeResult.value[0].id;
      }
    }
    // 处理labels，将数组转换为每行一个标签的格式
    if (
      !isCreate.value &&
      formData &&
      formData.labels &&
      Array.isArray(formData.labels)
    ) {
      formData.labelsStr = formData.labels.join('\n');
    }
    // 处理annotations，将数组转换为每行一个标签的格式
    if (
      !isCreate.value &&
      formData &&
      formData.annotations &&
      Array.isArray(formData.annotations)
    ) {
      formData.annotationsStr = formData.annotations.join('\n');
    }

    // 为表单赋值
    formApi.setValues(formData);

    // 添加延时，确保加载状态至少显示300毫秒，否则后续的loading状态不会显示
    await new Promise((resolve) => setTimeout(resolve, 300));
    setLoading(false);
  },
  async onConfirm() {
    // 表单验证
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

      // 验证告警表达式
      const expr = values.expr?.trim();
      if (expr) {
        try {
          const exprValidationResult = await checkAlertRuleExprApi({ expr });
          exprSuccess.value = exprValidationResult.valid;

          if (exprValidationResult.valid !== true) {
            // 表达式验证失败
            toast.error(
              $t('page.monitor.alertRule.prompt.exprFailed', {
                msg:
                  exprValidationResult.error ||
                  $t('page.monitor.alertRule.prompt.exprFailedMsg'),
              }),
              {
                timeout: 3000,
                position: POSITION.TOP_CENTER,
              },
            );

            setLoading(false);
            return; // 阻止提交，不关闭drawer
          }
        } catch {
          // 表达式验证API调用失败
          toast.error('表达式验证服务异常，请稍后重试', {
            timeout: 3000,
            position: POSITION.TOP_CENTER,
          });

          setLoading(false);
          return; // 阻止提交
        }
      }

      // 处理labels和annotations的转换
      if (values?.labelsStr) {
        const labelsArray = values.labelsStr
          .split('\n')
          .map((line: string) => line.trim())
          .filter(Boolean);
        values.labels = labelsArray;
      }

      if (values?.annotationsStr) {
        const annotationsArray = values.annotationsStr
          .split('\n')
          .map((line: string) => line.trim())
          .filter(Boolean);
        values.annotations = annotationsArray;
      }

      // 提交数据
      await (isCreate.value
        ? createAlertRuleApi(values)
        : updateAlertRuleApi(data.value?.row.id, values));

      // 提交成功，设置刷新标志并关闭drawer
      drawerApi.setData({ needRefresh: true });
    } finally {
      if (exprSuccess.value) {
        drawerApi.close();
      }
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
