import { computed } from 'vue';

import { $t } from '#/locales';

export const enableList = computed(() => [
  { value: 1, label: $t('enum.enable.ON') },
  { value: 2, label: $t('enum.enable.OFF') },
]);

export const severityList = computed(() => [
  { value: 1, label: $t('enum.severity.CRITICAL') },
  { value: 2, label: $t('enum.severity.WARNING') },
  { value: 3, label: $t('enum.severity.INFO') },
]);
