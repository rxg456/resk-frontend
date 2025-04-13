<script setup lang="ts">
import type { TabOption } from '@vben/types';

import { computed } from 'vue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@vben-core/shadcn-ui';

interface Props {
  tabs: TabOption[];
}

defineOptions({
  name: 'ReskTabs',
});

const props = withDefaults(defineProps<Props>(), {
  tabs: () => [],
});

const defaultValue = computed(() => {
  return props.tabs?.[0]?.value;
});
</script>

<template>
  <div class="w-full">
    <Tabs :default-value="defaultValue">
      <TabsList>
        <template v-for="tab in tabs" :key="tab.label">
          <TabsTrigger :value="tab.value"> {{ tab.label }} </TabsTrigger>
        </template>
      </TabsList>
      <template v-for="tab in tabs" :key="tab.label">
        <TabsContent :value="tab.value" class="pt-4">
          <slot :name="tab.value"></slot>
        </TabsContent>
      </template>
    </Tabs>
  </div>
</template>
