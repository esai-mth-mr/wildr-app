import { getStartAndEndDateInUTC } from '@verdzie/server/common';

describe('check start and end date for multiple timezones', () => {
  async function testCode(
    timezoneOffset: string,
    expectedHour: number,
    expectedMinutes?: number
  ) {
    const { startDate, endDate } = getStartAndEndDateInUTC(timezoneOffset);
    // console.log('timezoneOffset: ', timezoneOffset, {
    //   startDate,
    //   endDate,
    // });
    expect(startDate.getUTCHours()).toBe(expectedHour);
    expect(startDate.getUTCMinutes()).toBe(expectedMinutes ?? 0);
    if (timezoneOffset === '00:00') {
      expect(endDate.getUTCDate()).toBe(new Date().getUTCDate());
    }
  }

  it('tz-offset -14:00', async () => {
    const timezoneOffset = '-14:00';
    await testCode(timezoneOffset, 14);
  });
  it('tz-offset -7:00 [PST]', async () => {
    const timezoneOffset = '-07:00';
    await testCode(timezoneOffset, 7);
  });
  it('tz-offset -1:00', async () => {
    const timezoneOffset = '-01:00';
    await testCode(timezoneOffset, 1);
  });
  it('tz-offset 00:00 [UTC]', async () => {
    const timezoneOffset = '00:00';
    await testCode(timezoneOffset, 0);
  });
  it('tz-offset 07:00', async () => {
    const timezoneOffset = '07:00';
    await testCode(timezoneOffset, 17);
  });
  it('tz-offset 10:30', async () => {
    const timezoneOffset = '10:30';
    await testCode(timezoneOffset, 13, 30);
  });
  it('tz-offset 14:00', async () => {
    const timezoneOffset = '14:00';
    await testCode(timezoneOffset, 10, 0);
  });
});

describe('print start date of each timezone', () => {
  function formatTimeZoneOffset(offsetMinutes: number): string {
    const sign = offsetMinutes < 0 ? '-' : '+';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  }

  it('from, -14:00 to 14:00', async () => {
    for (
      let offsetMinutes = -14 * 60;
      offsetMinutes <= 14 * 60;
      offsetMinutes += 30
    ) {
      const timeZoneOffset: string = formatTimeZoneOffset(offsetMinutes);
      const { startDate, endDate } = getStartAndEndDateInUTC(timeZoneOffset);
      const startDateTime =
        'Date: ' +
        startDate.getUTCDate() +
        '; ' +
        startDate.getUTCHours() +
        ':' +
        startDate.getUTCMinutes();
      const endDateTime =
        'Date: ' +
        endDate.getUTCDate() +
        '; ' +
        endDate.getUTCHours() +
        ':' +
        endDate.getUTCMinutes();
      // console.log({
      //   timeZoneOffset,
      //   startDateTime,
      //   endDateTime,
      // });
    }
  });
});
