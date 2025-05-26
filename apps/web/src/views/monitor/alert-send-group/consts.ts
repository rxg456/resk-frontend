import { computed } from 'vue';

import { $t } from '#/locales';

export const sendResolvedList = computed(() => [
  { value: 1, label: $t('page.monitor.alertSendGroup.sendResolved.1') },
  { value: 2, label: $t('page.monitor.alertSendGroup.sendResolved.2') },
]);

export const needUpgradeList = computed(() => [
  { value: 1, label: $t('page.monitor.alertSendGroup.needUpgrade.1') },
  { value: 2, label: $t('page.monitor.alertSendGroup.needUpgrade.2') },
]);
