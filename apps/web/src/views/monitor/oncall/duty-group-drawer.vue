<script lang="ts" setup>
import { computed, ref } from 'vue';
import { POSITION, useToast } from 'vue-toastification';

import { useVbenDrawer, z } from '@vben/common-ui';

import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';
import { createDutyGroupApi, getUserListApi, updateDutyGroupApi } from '#/api';
import { $t } from '#/locales';
// 接受父组件传递的数据
const data = ref();
const toast = useToast();

const isCreate = computed(() => data.value?.create);
const getTitle = computed(() =>
  isCreate.value
    ? $t('ui.modal.create', {
        moduleName: $t('page.monitor.oncall-duty-group.module'),
      })
    : $t('ui.modal.update', {
        moduleName: $t('page.monitor.oncall-duty-group.module'),
      }),
);

const [dutyGroupForm, dutyGroupFormApi] = useVbenForm({
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
  // 字段映射：将datePicker的范围值映射到startTime和endTime字段，使用RFC3339格式
  fieldMappingTime: [
    [
      'datePicker',
      ['startTime', 'endTime'],
      (date, field) => {
        // 使用自定义函数转换为符合Go time.Time的RFC3339格式
        if (!date) return '';
        const d = dayjs(date);
        return field === 'startTime'
          ? `${d.format('YYYY-MM-DD')}T00:00:00+08:00`
          : `${d.format('YYYY-MM-DD')}T23:59:59+08:00`;
      },
    ],
  ],
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('page.monitor.oncall-duty-group.columns.name'),
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.oncall-duty-group.columns.name'),
        }),
        allowClear: true,
      },
      rules: z.string().min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.oncall-duty-group.columns.name'),
        }),
      }),
    },
    {
      component: 'InputNumber',
      fieldName: 'rotationPeriod',
      label: $t('page.monitor.oncall-duty-group.columns.rotationPeriod'),
      defaultValue: 1,
      componentProps: {
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.oncall-duty-group.columns.rotationPeriod'),
        }),
        allowClear: true,
      },
      rules: z.number().min(1, { message: $t('ui.formRules.numberRequired') }),
    },
    {
      component: 'DatePicker',
      fieldName: 'datePicker',
      label: $t('page.monitor.oncall-duty-group.columns.datePicker'),
      componentProps: {
        type: 'daterange',
        placeholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.oncall-duty-group.columns.datePicker'),
        }),
        startPlaceholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.oncall-duty-group.columns.startTime'),
        }),
        endPlaceholder: $t('ui.placeholder.input', {
          label: $t('page.monitor.oncall-duty-group.columns.endTime'),
        }),
        rangeSeparator: '至',
        allowClear: true,
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD',
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'members',
      label: $t('page.monitor.oncall-duty-group.columns.members'),
      componentProps: {
        placeholder: $t('page.monitor.oncall-duty-group.prompt.members'),
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
      rules: z.array(z.number()).min(1, {
        message: $t('ui.formRules.required', {
          label: $t('page.monitor.oncall-duty-group.columns.members'),
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
      data.value?.row &&
      data.value.row.startTime &&
      data.value.row.endTime
    ) {
      // 如果是编辑模式且有startTime和endTime，将它们组合成datePicker数组
      data.value.row.datePicker = [
        data.value.row.startTime,
        data.value.row.endTime,
      ];
    }

    // 处理members字段，后端返回的是对象数组，提取出id数组
    if (
      !isCreate.value &&
      data.value?.row?.members &&
      Array.isArray(data.value.row.members) &&
      data.value.row.members.length > 0
    ) {
      // 检查第一个元素是否为对象且包含id属性，如果是则进行转换
      const firstItem = data.value.row.members[0];
      if (
        typeof firstItem === 'object' &&
        firstItem !== null &&
        'id' in firstItem
      ) {
        // 将成员对象数组转换为id数组
        data.value.row.members = data.value.row.members.map(
          (member: any) => member.id,
        );
      }
    }

    // 为表单赋值
    dutyGroupFormApi.setValues(data.value?.row);
    // 添加延时，确保加载状态至少显示300毫秒，否则后续的loading状态不会显示
    await new Promise((resolve) => setTimeout(resolve, 300));
    setLoading(false);
  },
  async onConfirm() {
    // 校验输入的数据
    const validate = await dutyGroupFormApi.validate();
    if (!validate.valid) {
      toast.error($t('ui.notification.validate_failed'), {
        timeout: 2000,
        position: POSITION.TOP_CENTER,
      });
      return;
    }

    setLoading(true);

    // 获取表单数据
    const values = await dutyGroupFormApi.getValues();

    try {
      await (data.value?.create
        ? createDutyGroupApi(values)
        : updateDutyGroupApi(data.value.row.id, values));
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
    <dutyGroupForm />
  </Drawer>
</template>
