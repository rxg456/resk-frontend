<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDate } from '@vben/utils';

import dayjs from 'dayjs';

import { getDutyGroupDutyDataApi } from '#/api';

// 父组件传入的数据
const data = ref();
// 值班数据
const dutyData = ref<any>({});
// 当前值班和下一班值班数据（独立存储）
const currentAndNextDutyData = ref<any>({});
// 当前日期
const currentDate = ref(new Date());
// 加载状态
const loading = ref(false);
// 标题
const title = computed(() => `${data.value?.name}-值班信息`);

// 获取对应日期的值班人员
const getDutyUsers = (dateCell: any) => {
  // 将日期转换为与后端格式一致的字符串 YYYY-MM-DD
  const dateStr = formatDate(dateCell.day, 'YYYY-MM-DD');
  return dutyData.value?.calendar?.[dateStr] || null;
};

// 获取当前月份的开始和结束日期
const getMonthRange = (date: Date) => {
  // (YYYY-MM-DDT00:00:00+08:00)
  const startDate = dayjs(date)
    .startOf('month')
    .format('YYYY-MM-DD[T]00:00:00+08:00');
  const endDate = dayjs(date)
    .endOf('month')
    .format('YYYY-MM-DD[T]23:59:59+08:00');
  return { startDate, endDate };
};

// 获取当前和下一班值班信息
const fetchCurrentAndNextDuty = async () => {
  if (!data.value?.id) return;

  try {
    loading.value = true;
    // 获取今天和未来30天的数据来确保能找到下一班值班人
    const startDate = dayjs().format('YYYY-MM-DD[T]00:00:00+08:00');
    const endDate = dayjs()
      .add(30, 'day')
      .format('YYYY-MM-DD[T]23:59:59+08:00');

    const response = await getDutyGroupDutyDataApi(data.value.id, {
      startDate,
      endDate,
    });
    if (response) {
      currentAndNextDutyData.value = response;
    }
  } finally {
    loading.value = false;
  }
};

// 获取值班日历数据
const fetchDutyData = async () => {
  if (!data.value?.id) return;

  try {
    loading.value = true;

    // 获取当前月份的开始和结束日期
    const { startDate, endDate } = getMonthRange(currentDate.value);

    const response = await getDutyGroupDutyDataApi(data.value.id, {
      startDate,
      endDate,
    });
    if (response) {
      dutyData.value = response;
    }
  } finally {
    loading.value = false;
  }
};

// 获取当前值班人员信息
const currentDutyUser = computed(() => {
  if (!currentAndNextDutyData.value?.calendar) return null;

  const today = formatDate(dayjs().format('YYYY-MM-DD'), 'YYYY-MM-DD');
  return currentAndNextDutyData.value.calendar[today]?.[0] || null;
});

// 获取下一班值班人员信息
const nextDutyUser = computed(() => {
  if (!currentAndNextDutyData.value?.calendar) return null;

  // 获取所有日期
  const dates = Object.keys(currentAndNextDutyData.value.calendar).sort();
  // 找到今天的日期
  const today = formatDate(dayjs().format('YYYY-MM-DD'), 'YYYY-MM-DD');
  const todayIndex = dates.findIndex((date) => date > today);

  // 如果找到今天之后的日期，返回对应的值班人员
  if (todayIndex !== -1 && dates[todayIndex]) {
    const nextDate = dates[todayIndex];
    return {
      date: nextDate,
      user: currentAndNextDutyData.value.calendar[nextDate]?.[0] || null,
    };
  }

  return null;
});

// 监听日期变化重新获取数据
watch(
  currentDate,
  () => {
    fetchDutyData();
  },
  { immediate: false },
);

// 在模态框打开时加载数据
const [Modal, modalApi] = useVbenModal({
  footer: false,
  onCancel() {
    modalApi.close();
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      // 获取父组件传入的数据
      data.value = modalApi.getData<Record<string, any>>().row;
      await fetchDutyData();
      await fetchCurrentAndNextDuty();
    }
  },
});

// 处理日历月份变化
const handleDateChange = (val: Date) => {
  currentDate.value = val;
};
</script>

<template>
  <Modal :title="title" :loading="loading" class="max-h-[100vh] min-w-[1200px]">
    <!-- 值班信息卡片 -->
    <div class="mb-4 grid grid-cols-2 gap-4">
      <!-- 当前值班 -->
      <ElCard shadow="hover" class="duty-card">
        <template #header>
          <div class="duty-card-header">
            当前值班: 现在 ~
            {{
              currentDutyUser
                ? `${formatDate(dayjs().format('YYYY-MM-DD'), 'M月D日')} 23:59`
                : '无'
            }}
          </div>
        </template>
        <div v-if="currentDutyUser" class="duty-card-content">
          <ElAvatar class="mr-2" :style="{ backgroundColor: '#1890ff' }">
            {{ currentDutyUser.displayName.slice(0, 1) }}
          </ElAvatar>
          <div class="duty-info">
            <div class="duty-name">{{ currentDutyUser.displayName }}</div>
          </div>
        </div>
        <div v-else class="no-duty">暂无值班信息</div>
      </ElCard>

      <!-- 下次值班 -->
      <ElCard shadow="hover" class="duty-card">
        <template #header>
          <div class="duty-card-header">
            下一值班:
            {{
              nextDutyUser
                ? `${formatDate(nextDutyUser.date, 'M月D日')} 00:00` +
                  ` ~ ${formatDate(nextDutyUser.date, 'M月D日')} 23:59`
                : '无'
            }}
          </div>
        </template>
        <div v-if="nextDutyUser && nextDutyUser.user" class="duty-card-content">
          <ElAvatar class="mr-2" :style="{ backgroundColor: '#faad14' }">
            {{ nextDutyUser.user.displayName.slice(0, 1) }}
          </ElAvatar>
          <div class="duty-info">
            <div class="duty-name">{{ nextDutyUser.user.displayName }}</div>
          </div>
        </div>
        <div v-else class="no-duty">暂无值班信息</div>
      </ElCard>
    </div>

    <ElCalendar v-model="currentDate" @input="handleDateChange">
      <!-- 自定义日期单元格 -->
      <template #date-cell="{ data: dateCell }">
        <div class="calendar-day">
          <!-- 日期格式 -->
          <div class="calendar-day-number">
            {{ dateCell.day.split('-').slice(1).join('-') }}
          </div>

          <!-- 值班人信息 -->
          <div v-if="getDutyUsers(dateCell)" class="duty-user-container">
            <div
              v-for="user in getDutyUsers(dateCell)"
              :key="user.userId"
              class="duty-user"
              :class="{ 'is-substituted': user.isSubstituted }"
              :title="`${user.displayName} (${user.dutyStartTime}-${user.dutyEndTime})`"
            >
              {{ user.displayName }}
              <span class="duty-time">
                {{ user.dutyStartTime }}-{{ user.dutyEndTime }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </ElCalendar>
  </Modal>
</template>

<style scoped>
.calendar-day {
  height: 100%;
  padding: 4px;
  display: flex;
  flex-direction: column;
}

.calendar-day-number {
  font-size: 16px;
  margin-bottom: 8px;
  text-align: center;
}

.duty-user-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  flex: 1;
}

.duty-user {
  padding: 4px 4px;
  border-radius: 4px;
  font-size: 14px;
  background-color: #19b552;
  color: white;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.duty-user.is-substituted {
  background-color: #f0ad4e;
}

.duty-time {
  font-size: 10px;
  display: block;
  margin-top: 2px;
  opacity: 0.8;
}

/* 值班信息卡片样式 */
.duty-card {
  height: 100%;
}

.duty-card-header {
  font-weight: bold;
  font-size: 14px;
}

.duty-card-content {
  display: flex;
  align-items: center;
}

.duty-info {
  display: flex;
  flex-direction: column;
}

.duty-name {
  font-size: 16px;
  font-weight: 500;
}

.no-duty {
  font-size: 14px;
  color: #909399;
  text-align: center;
  padding: 10px 0;
}
</style>
