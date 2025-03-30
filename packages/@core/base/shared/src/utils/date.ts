import dayjs from 'dayjs';

export function formatDate(time: number | string, format = 'YYYY-MM-DD') {
  try {
    const date = dayjs(time);
    if (!date.isValid()) {
      throw new Error('Invalid date');
    }

    return date.format(format);
  } catch (error) {
    console.error(`Error formatting date: ${error}`);
    return time;
  }
}

export function formatDateTime(time: number | string) {
  // 转换秒级时间戳为毫秒级
  if (typeof time === 'number' && time.toString().length === 10) {
    time = time * 1000;
  }
  return formatDate(time, 'YYYY-MM-DD HH:mm:ss');
}

export function isDate(value: any): value is Date {
  return value instanceof Date;
}

export function isDayjsObject(value: any): value is dayjs.Dayjs {
  return dayjs.isDayjs(value);
}
