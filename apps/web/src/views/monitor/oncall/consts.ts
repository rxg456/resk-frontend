import { computed } from 'vue';

import { $t } from '#/locales';

export const scheduleStatus = computed(() => [
  { value: 0, label: $t('page.monitor.oncall-duty-group.scheduleStatus.0') },
  { value: 1, label: $t('page.monitor.oncall-duty-group.scheduleStatus.1') },
  { value: 2, label: $t('page.monitor.oncall-duty-group.scheduleStatus.2') },
  { value: 3, label: $t('page.monitor.oncall-duty-group.scheduleStatus.3') },
]);
