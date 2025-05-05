<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useVbenModal, z } from '@vben/common-ui';
import { useVbenForm } from '#/adapter/form';
import { $t } from '#/locales';
import {
  getScrapePoolListApi,
  getAllStreeNodesApi,
  createScrapeJobByPoolIdApi,
  updateScrapeJobApi,
} from '#/api';
import { enableList, serviceDiscoveryTypeList } from '#/store';
import { useToast, POSITION } from 'vue-toastification';

const toast = useToast();

// 父组件传入的数据
const data = ref();
// 获取父组件传递的poolId
const poolId = ref('');
// 加载状态
const loading = ref(false);
// 是否是创建
const isCreate = computed(() => data.value?.create);
// 标题
const getTitle = computed(() =>
  isCreate.value
    ? $t('ui.modal.create', {
        moduleName: $t('page.monitor.scrapeJob.module'),
      })
    : $t('ui.modal.update', {
        moduleName: $t('page.monitor.scrapeJob.module'),
      }),
);
// 在模态框打开时加载数据
const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen) {
    if (isOpen) {
      setLoading(true);
      // 获取传入的数据
      data.value = modalApi.getData<Record<string, any>>();
      poolId.value = data.value?.poolId;
      if (isCreate.value) {
        // 重置表单
        jobFormApi.resetForm();
      } else {
        // 为表单赋值
        jobFormApi.setValues(data.value?.row);
      }

      // 添加延时，确保加载状态至少显示300毫秒，否则后续的loading状态不会显示
      await new Promise((resolve) => setTimeout(resolve, 300));
      setLoading(false);
    }
  },
  onConfirm: async () => {
    // 校验输入的数据
    const validate = await jobFormApi.validate();
    if (!validate.valid) {
      toast.error($t('ui.notification.validate_failed'), {
        timeout: 2000,
        position: POSITION.TOP_CENTER,
      });
      return;
    }
    modalApi.setState({ loading: true });

    // 获取表单数据
    const values = await jobFormApi.getValues();

    try {
      await (isCreate.value
        ? createScrapeJobByPoolIdApi(poolId.value, values)
        : updateScrapeJobApi(data.value.row.id, values));
      modalApi.close();
      modalApi.setData({ needRefresh: true });
    } catch {
      // 不关闭模态框，允许用户修改
    } finally {
      modalApi.setState({ loading: false });
    }
  },
});

const [jobForm, jobFormApi] = useVbenForm({
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
  // 一行显示2个
  wrapperClass: 'grid-cols-2',
  // 垂直布局，label和input在不同行，值为vertical
  // 水平布局，label和input在同一行
  layout: 'horizontal',
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('page.monitor.scrapeJob.columns.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapeJob.columns.name'),
        }),
        allowClear: true,
      },
      rules: z
        .string()
        .min(1, {
          message: $t('ui.formRules.required', {
            label: $t('page.monitor.scrapePool.columns.name'),
          }),
        })
        .refine((value) => /^[a-z0-9-]+$/.test(value), {
          message: '只允许小写字母、数字和连字符(-)',
        }),
    },
    {
      component: 'ApiSelect',
      fieldName: 'poolId',
      label: $t('page.monitor.scrapeJob.columns.pool'),
      componentProps: {
        api: async () => {
          const result = await getScrapePoolListApi({
            page: 1,
            pageSize: 1000,
          });
          return result.items;
        },
        labelField: 'name',
        valueField: 'id',
        disabled: true,
      },
      dependencies: {
        triggerFields: ['isCreate'],
        // 根据isCreate计算属性决定是否显示
        if: () => !isCreate.value, // 完全不渲染组件
        // 或者用 show: () => isCreate.value // CSS隐藏但保留组件实例
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'enable',
      defaultValue: 1,
      label: $t('ui.table.status'),
      rules: 'selectRequired',
      // 占满2列空间
      formItemClass: 'col-span-2',
      componentProps: {
        optionType: 'button',
        class: 'flex flex-wrap', // 如果选项过多，可以添加class来自动折叠
        options: enableList,
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'scrapeInterval',
      label: $t('page.monitor.scrapeJob.columns.scrapeInterval'),
      defaultValue: 30,
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapeJob.columns.scrapeInterval'),
        }),
        allowClear: true,
      },
      rules: z.number().min(1, { message: $t('ui.formRules.numberRequired') }),
    },

    {
      component: 'InputNumber',
      fieldName: 'scrapeTimeout',
      label: $t('page.monitor.scrapeJob.columns.scrapeTimeout'),
      defaultValue: 10,
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapeJob.columns.scrapeTimeout'),
        }),
        allowClear: true,
      },
      rules: z.number().min(1, { message: $t('ui.formRules.numberRequired') }),
    },
    {
      component: 'Input',
      fieldName: 'metricsPath',
      label: $t('page.monitor.scrapeJob.columns.metricsPath'),
      defaultValue: '/metrics',
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapeJob.columns.metricsPath'),
        }),
        allowClear: true,
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.scrapeJob.columns.metricsPath'),
        }),
      }),
    },
    {
      component: 'Input',
      fieldName: 'scheme',
      label: $t('page.monitor.scrapeJob.columns.scheme'),
      defaultValue: 'http',
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapeJob.columns.scheme'),
        }),
        allowClear: true,
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.scrapeJob.columns.scheme'),
        }),
      }),
    },
    {
      component: 'Input',
      fieldName: 'relabelConfigsYamlString',
      label: $t('page.monitor.scrapeJob.columns.relabelConfigsYamlString'),
      // 占满2列空间
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: $t(
          'page.monitor.scrapeJob.columns.relabelConfigsYamlString',
        ),
        type: 'textarea',
        autosize: { minRows: 3, maxRows: 8 },
        allowClear: true,
      },
      help: $t('page.monitor.scrapeJob.columns.relabelConfigsYamlStringHelp'),
    },
    {
      component: 'Select',
      fieldName: 'serviceDiscoveryType',
      label: $t('page.monitor.scrapeJob.columns.serviceDiscoveryType'),
      defaultValue: 'stree-http',
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        allowClear: true,
        options: serviceDiscoveryTypeList,
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.selectRequired'),
      }),
    },
    {
      component: 'InputNumber',
      fieldName: 'port',
      label: $t('page.monitor.scrapeJob.columns.port'),
      formItemClass: 'col-start-1',
      defaultValue: 9100,
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapeJob.columns.port'),
        }),
        allowClear: true,
      },
      // 只有当serviceDiscoveryType为stree-http时才显示
      dependencies: {
        // 触发依赖的字段
        triggerFields: ['serviceDiscoveryType'],
        // 动态判断是否显示
        if: (values) => values.serviceDiscoveryType === 'stree-http', // if不正确的话完全不渲染组件
      },
      rules: z.number().min(1, { message: $t('ui.formRules.numberRequired') }),
    },
    {
      component: 'InputNumber',
      fieldName: 'refreshInterval',
      label: $t('page.monitor.scrapeJob.columns.refreshInterval'),
      defaultValue: 30,
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.scrapeJob.columns.refreshInterval'),
        }),
        allowClear: true,
      },
      // 只有当serviceDiscoveryType为stree-http时才显示
      dependencies: {
        // 触发依赖的字段
        triggerFields: ['serviceDiscoveryType'],
        // 动态判断是否显示
        if: (values) => values.serviceDiscoveryType === 'stree-http', // if不正确的话完全不渲染组件
      },
      rules: z.number().min(1, { message: $t('ui.formRules.numberRequired') }),
    },
    {
      component: 'ApiSelect',
      fieldName: 'treeNodeIds',
      label: $t('page.monitor.scrapeJob.columns.treeNodeIds'),
      componentProps: {
        placeholder: $t('ui.placeholder.select'),
        api: async () => {
          const result = await getAllStreeNodesApi();
          return result;
        },
        labelField: 'node_path',
        valueField: 'id',
        // 多选
        multiple: true,
        // 折叠标签
        collapseTags: false,
        // 可搜索
        filterable: true,
      },
      // 只有当serviceDiscoveryType为stree-http时才显示
      dependencies: {
        // 触发依赖的字段
        triggerFields: ['serviceDiscoveryType'],
        // 动态判断是否显示
        if: (values) => values.serviceDiscoveryType === 'stree-http', // if不正确的话完全不渲染组件
      },
      rules: z.array(z.number()).min(1, {
        message: $t('ui.formRules.selectRequired'),
      }),
    },
  ],
});

async function setLoading(loading: boolean) {
  modalApi.setState({ loading });
}
</script>

<template>
  <Modal
    :title="getTitle"
    class="max-h-[60vh] min-w-[1200px]"
    :loading="loading"
  >
    <jobForm />
  </Modal>
</template>
