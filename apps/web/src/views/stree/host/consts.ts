import { computed } from 'vue';

import { $t } from '#/locales';

export const osTypeList = computed(() => [
  { value: 1, label: $t('page.stree.host.osType.linux') },
  { value: 2, label: $t('page.stree.host.osType.windows') },
]);

export const statusList = computed(() => [
  { value: 1, label: $t('page.stree.host.status.1') },
  { value: 2, label: $t('page.stree.host.status.2') },
  { value: 3, label: $t('page.stree.host.status.3') },
  { value: 4, label: $t('page.stree.host.status.4') },
]);

export const envList = computed(() => [
  { value: 1, label: $t('page.stree.host.env.1') },
  { value: 2, label: $t('page.stree.host.env.2') },
  { value: 3, label: $t('page.stree.host.env.3') },
  { value: 4, label: $t('page.stree.host.env.4') },
]);

export const nodeStatusList = computed(() => [
  { value: 1, label: $t('page.stree.host.nodeStatus.1') },
  { value: 2, label: $t('page.stree.host.nodeStatus.2') },
]);

export const vmTypeList = computed(() => [
  { value: 1, label: $t('page.stree.host.vmType.cloud') },
  { value: 2, label: $t('page.stree.host.vmType.virtual') },
  { value: 3, label: $t('page.stree.host.vmType.physical') },
]);

export const vendorList = computed(() => [
  { value: 1, label: $t('page.stree.host.vendor.aliyun') },
  { value: 2, label: $t('page.stree.host.vendor.huawei') },
  { value: 3, label: $t('page.stree.host.vendor.tencent') },
  { value: 4, label: $t('page.stree.host.vendor.aws') },
  { value: 5, label: $t('page.stree.host.vendor.VMware') },
  { value: 6, label: $t('page.stree.host.vendor.other') },
]);
