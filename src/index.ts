import accounting from 'accounting';
import formatLocation from 'format-location';
import getto from 'getto';
import _ from 'lodash';
import moment from 'moment';
import {Moment} from 'moment-timezone';

interface Card {
  type?: string;
  last4: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  exp_month: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  exp_year: string;
}

interface DateFormats {
  monthDay: string;
  longMonthDay: string;
  shortMonthDay: string;
  shortDate: string;
  mailChimpDate: string;
  shortDay: string;
  shorterDay: string;
  longDay: string;
  day: string;
  shoppingDay: string;
  shortShoppingDay: string;
  limitDay: string;
  shortTime(date: Date, tzid: string): string;
  shortDayTime(date: Date, tzid: string): string;
  clockDateTime: string;
  clockDate: string;
  clockTime: string;
  hour: string;
  iCalDay: string;
  iCalTime: string;
  iCalDate: string;
  raygunDate: string;
  longDayOfTheWeek: string;
  shortDayOfTheWeek: string;
  twoLetterDayOfTheWeek(date: Date, tzid: string): string;
  iCalWeekday(date: Date, tzid: string): string;
  humanDate(date: Date, tzid: string): string;
  humanWeekday(date: Date, tzid: string): string;
  humanDay(date: Date, tzid: string): string;
  humanShortDay(date: Date, tzid: string): string;
  humanShoppingDay(date: Date, tzid: string): string;
  humanShortShoppingDay(date: Date, tzid: string): string;
  humanTime: string;
  year: string;
  orderCutoffDateTime(date: Date, tzid: string): string;
}

type FormatString = keyof typeof dateFormats;

// Customize negative currency formatting: -$5.00
accounting.settings.currency.format = {
  pos: '%s%v',
  neg: '-%s%v',
  zero: '%s%v',
};

interface FormatMoneyOptions {
  wholeNumberPrecision?: number;
  precision?: number;
}

// Support parameter 'wholeNumberPrecision' to format 30 as $30 but 29.99 as $29.99
// http://josscrowcroft.github.com/accounting.js
const formatMoney = function (value: number, _options?: FormatMoneyOptions): string {
  const options = {
    precision: _options?.precision,
  };

  if (
    (options != null ? _options?.wholeNumberPrecision : undefined) != null &&
    Math.round(value * 100) % 100 === 0
  ) {
    options.precision = _options?.wholeNumberPrecision;
  }

  return accounting.formatMoney(value, options);
};

const roundTo2 = (amount: number): number => Math.round(amount * 100.0) / 100.0;

const formatPercentage = (number: number): number => parseInt(`${roundTo2(number)}%`);

const formatCardExpiration = (month: string, year: string): string =>
  `${`0${month}`.slice(-2)}/${`${year}`.slice(-2)}`;

const formatCreditCard = function (card: Card): string {
  let type;
  if (card.type != null) {
    type = `${card.type.toUpperCase()} `;
  }
  return `${type != null ? type : ''}${card.last4} exp ${formatCardExpiration(
    card.exp_month,
    card.exp_year,
  )}`;
};

const _isFunction = (fn: unknown) => typeof fn === 'function';

const _formatDate = (date: Date, format: string, tzid: string): string => {
  return moment(date).format(format);
};

const formatDate = function (
  date: Date | Moment,
  formatString: FormatString,
  tzid: string,
): string {
  if (tzid == null) {
    throw new Error('tzid is required');
  }
  if (date == null) {
    return '';
  }
  date = new Date(moment(date).toString());

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const format = dateFormats[formatString] != null ? dateFormats[formatString] : formatString;

  return (
    // eslint-disable-next-line @typescript-eslint/ban-types
    (_isFunction(format) && (format as Function)(date.getTime(), tzid)) ||
    _formatDate(new Date(date), format as string, tzid)
  );
};

const sameDay = (date1: Date | Moment, date2: Date | Moment, tzid: string) => {
  return formatDate(date1, 'clockDate', tzid) === formatDate(date2, 'clockDate', tzid);
};

const _isToday = (date: Date | Moment, tzid: string) => sameDay(date, new Date(Date.now()), tzid);

const _isTomorrow = function (date: Date | Moment, tzid: string) {
  // Can't use date math on client :(
  // Add one day
  const tomorrow = new Date(Date.now());
  tomorrow.setDate(tomorrow.getDate() + 1);
  return sameDay(date, tomorrow, tzid);
};

const dateFormats: DateFormats = {
  monthDay: 'M/D', // 3/22
  longMonthDay: '%B %-d', // March 22
  shortMonthDay: 'MMM D', // Mar 22
  shortDate: 'M/DD/YYYY', // 3/22/2008
  mailChimpDate: 'MM/DD/YYYY', // 03/22/2008
  shortDay: 'dddd, MMM DD', // Saturday, Mar 22
  shorterDay: '%a %b %-d', // Sat Mar 22
  longDay: '%A, %B %-d, %Y', // Saturday, March 22, 2008
  day: '%B %-d, %Y', // March 22, 2008
  shoppingDay: 'dddd M/D', // Monday 10/14
  shortShoppingDay: 'ddd M/D', // Mon 10/14
  limitDay: '%m-%d-%Y (%a)', // 06-01-2014 (Sun)
  shortTime(date, tzid) {
    // 5pm
    const str = _formatDate(date, 'h:mma', tzid);
    return str.replace('12:00pm', 'noon').replace('12:00am', 'midnight').replace(':00', '');
  },
  shortDayTime(date, tzid) {
    // Saturday, Mar 22, 5:00pm
    const str = _formatDate(date, 'dddd, MMM DD, Ha', tzid);
    return str.replace('12:00pm', 'noon').replace(':00', '');
  },
  clockDateTime: '%Y-%m-%d %H:%M', // 2008-03-22 17:00
  clockDate: 'YYYY/MM/DD', // 2008-03-22
  clockTime: '%H:%M', // 17:00
  hour: '%-l', // 5
  iCalDay: '%Y%m%d', // 20080327
  iCalTime: '%H%M%S', // 133000
  iCalDate: '%Y%m%dT%H%M%S', // 20080327T133000
  raygunDate: '%Y-%m-%dT%H:%M:%S+00:00', // 2013-10-11T01:09:01+00:00
  longDayOfTheWeek: '%A', // Tuesday
  shortDayOfTheWeek: '%a', // Tue
  twoLetterDayOfTheWeek(date, tzid) {
    // mo, tu, we
    return _formatDate(date, 'dd', tzid).slice(0, 2).toLowerCase();
  },
  iCalWeekday(date, tzid) {
    // MO, TU, WE
    return formatDate(date, 'twoLetterDayOfTheWeek', tzid).toUpperCase();
  },
  humanDate(date, tzid) {
    // March 22nd
    const str = _formatDate(new Date(date), 'MMMM Do', tzid);
    // str += inflect.ordinalize(_formatDate(new Date(date), 'O', tzid));
    return str;
  },
  humanWeekday(date, tzid) {
    // today / tomorrow / Monday
    if (_isToday(date, tzid)) {
      return 'today';
    }
    if (_isTomorrow(date, tzid)) {
      return 'tomorrow';
    }
    return _formatDate(new Date(date), 'dddd', tzid);
  },
  humanDay(date, tzid) {
    // Monday, March 22nd
    const str = _formatDate(new Date(date), '%A, %B ', tzid);
    // str += inflect.ordinalize(_formatDate(new Date(date), '%-d', tzid));
    return str;
  },
  humanShortDay(date, tzid) {
    // Monday, Mar 22nd
    const str = _formatDate(new Date(date), 'dddd, MMM Do', tzid);
    // str += inflect.ordinalize(_formatDate(new Date(date), '%-d', tzid));
    return str;
  },
  humanShoppingDay(date, tzid) {
    // today 7/25 / tomorrow 7/25 / Monday 7/25
    if (_isToday(date, tzid)) {
      return `today ${formatDate(date, 'monthDay', tzid)}`;
    }
    if (_isTomorrow(date, tzid)) {
      return `tomorrow ${formatDate(date, 'monthDay', tzid)}`;
    }
    return formatDate(date, 'shoppingDay', tzid);
  },
  humanShortShoppingDay(date, tzid) {
    // today 7/23 / tomorrow 7/24 / Mon 7/25
    if (_isToday(date, tzid)) {
      return `today ${formatDate(date, 'monthDay', tzid)}`;
    }
    if (_isTomorrow(date, tzid)) {
      return `tomorrow ${formatDate(date, 'monthDay', tzid)}`;
    }
    return formatDate(date, 'shortShoppingDay', tzid);
  },
  humanTime: '%-l:%M %P',
  year: '%Y', // 2014
  orderCutoffDateTime(date, tzid) {
    // permutations are [10am, noon, midnight] [..., tomorrow, Wednesday]
    const isMidnight = formatDate(date, 'shortTime', tzid) === 'midnight';
    if (isMidnight) {
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      date = yesterday;
    }
    if (_isToday(date, tzid)) {
      return formatDate(date, 'shortTime', tzid);
    }
    if (_isTomorrow(date, tzid)) {
      return `${formatDate(date, 'shortTime', tzid)} tomorrow`;
    }
    return `${formatDate(date, 'shortTime', tzid)} ${formatDate(
      date,
      'humanWeekday',
      tzid,
    )} ${formatDate(date, 'monthDay', tzid)}`;
  },
};

interface Time {
  startAt: string;
  endAt: string;
}

interface Options {
  format?: string;
  separator?: string;
}

const _formatDay = function (date: Date, tzid: string) {
  if (_isToday(date, tzid)) {
    return 'today';
  } else if (_isTomorrow(date, tzid)) {
    return 'tomorrow';
  }
  return `on ${formatDate(date, 'shortDay', tzid)}`;
};

const formatTimeRange = function (
  startAt: Date | Moment,
  endAt: Date | Moment,
  tzid: string | Time,
  options: string | Time | Options,
): string {
  if (startAt == null) {
    return '';
  }

  // Accept an object with startAt and endAt keys
  if (startAt != null && endAt != null) {
    options = tzid;
    tzid = endAt.toString();
  }

  const format =
    (options != null && typeof options === 'object' && (options as Options).format) || 'shortTime';

  const separator =
    (options != null && typeof options === 'object' && (options as Options).separator) || ' - ';

  const startStr = formatDate(startAt as Date, format as keyof typeof dateFormats, tzid as string);
  const endStr = formatDate(moment(endAt), format as keyof typeof dateFormats, tzid as string);
  if (startStr === endStr) {
    return startStr;
  }
  return `${startStr}${separator !== undefined ? separator : ''}${endStr}`;
};

const formatDateRange = function (
  startAt: Date | {startAt: Date; endAt: Date},
  endAt: Date | Moment,
  tzid?: string | Time | Options,
  options?: string | Time | Options,
): string | null {
  if (startAt == null) {
    return null;
  }

  // Accept an object with startAt and endAt keys
  if (startAt.startAt) {
    options = tzid;
    tzid = endAt.toString();
    endAt = startAt.endAt;
    startAt = startAt.startAt;
  }

  const format =
    (options != null && typeof options === 'object' && (options as Options).format) || 'shortTime';

  let separator =
    (options != null && typeof options === 'object' && (options as Options).separator) || ' - ';

  if (format === 'prose') {
    if (sameDay(startAt as Date, endAt, tzid as string)) {
      return `between ${formatTimeRange(startAt as Date, endAt, tzid as string, {
        separator: ' and ',
      })} ${_formatDay(new Date(startAt.toString()), tzid as string)}`;
    }
    return `between ${formatDate(startAt as Date, 'shortTime', tzid as string)} ${_formatDay(
      new Date(startAt.toString()),
      tzid as string,
    )} and ${formatDate(endAt, 'shortTime', tzid as string)} ${_formatDay(
      new Date(endAt.toString()),
      tzid as string,
    )}`;
  }

  if (sameDay(startAt as Date, endAt, tzid as string)) {
    return `${formatDate(startAt as Date, 'shortDay', tzid as string)}, ${formatTimeRange(
      startAt as Date,
      endAt,
      tzid as string,
      {
        separator: ' - ',
      },
    )}`;
  }

  if (format === 'pickupChooser') {
    separator = '...until ';
  }

  return `${formatDate(startAt as Date, 'shortDayTime', tzid as string)}${separator}${formatDate(
    endAt,
    'shortDayTime',
    tzid as string,
  )}`;
};

const formatPromoCodeValue = function (promoCode: {type: string; value: number}): string {
  const promoCodeGetter: {get: (value: string) => string | number} = getto(promoCode);

  switch (promoCodeGetter.get('type')) {
    case 'dollar':
      return formatMoney(promoCodeGetter.get('value') as number, {
        wholeNumberPrecision: 0,
      });
    case 'percent':
      return `${promoCodeGetter.get('value')}%`;
    default:
      throw new Error(`unhandled PromoCode type: ${promoCodeGetter.get('type')}`);
  }
};

const formatCustomerName = ({
  firstName,
  lastName,
}: {
  firstName?: string | null;
  lastName?: string | null;
}): string => {
  const fName = firstName?.trim();
  const lName = lastName?.trim();
  let fullName = '';
  // eslint-disable-next-line lodash/prefer-lodash-chain
  _([fName, lName])
    .chain()
    .compact()
    .value()
    // eslint-disable-next-line array-callback-return
    .map((n) => {
      if (fullName !== '') {
        fullName += ' ';
      }
      fullName += n;
    });
  return fullName;
};

const formatProductName = function (
  productOrLineItem: {
    ofThe: {
      enabled: boolean;
      name: string;
    };
    ofTheIsAvailableFor?: (arg: {pickupDate: number}) => boolean;
  },
  options?: {
    variant?: string;
    excludeProductName?: string;
    pickupDate?: number;
  },
): string {
  if (options == null) {
    options = {};
  }
  const {variant, excludeProductName, pickupDate} = options;
  const productOrLineItemGetter: {get: (value: string) => string} = getto(productOrLineItem);

  if (variant === 'stack') {
    return productOrLineItemGetter.get('stackName');
  } else if (
    ((typeof productOrLineItem.ofTheIsAvailableFor === 'function'
      ? productOrLineItem.ofTheIsAvailableFor({
          pickupDate: pickupDate as number,
        })
      : undefined) ??
      false) &&
    productOrLineItemGetter.get('ofThe.name') != null
  ) {
    if (excludeProductName !== undefined) {
      return productOrLineItemGetter.get('ofThe.name');
    }
    return `${productOrLineItemGetter.get('name')}: ${productOrLineItemGetter.get('ofThe.name')}`;
  }
  return productOrLineItemGetter.get('name');
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYSLONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayFormats = {
  shortDayOfTheWeek(date: Date) {
    return WEEKDAYS[date.getDay()];
  },
  longDayOfTheWeek(date: Date) {
    return WEEKDAYSLONG[date.getDay()];
  },
  shortShoppingDay(date: Date) {
    // Mon 12/25
    return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
  },
};

// formats day strings in the format of: 2014-08-15
const formatDay = function (day: string, formatString: string): string {
  const formats = _.assignIn({}, dateFormats, dayFormats);
  if (formats[formatString] === undefined || day.length === 0) {
    return day;
  }
  const parts = day.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (parts == null) {
    return day;
  }
  const date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  const format = formats[formatString];
  const tzid = moment.utc().toString();
  return (_isFunction(format) && format(date, tzid)) || _formatDate(date, format.toString(), tzid);
};

const normalizePhone = function (phone?: string | null): string | null | undefined {
  if (phone == null || phone === '') {
    return '';
  }

  const digits = phone.replace(/[^\d]/g, '');
  const hasCountryCode = /^\s*\+/.test(phone) || (digits.length === 11 && digits[0] === '1');
  const prefix = hasCountryCode ? '+' : '+1'; // presume US unless specified

  return `${prefix}${digits}`;
};

const formatPhone = function (str?: string | null | undefined): string | null | undefined {
  if (str == null) {
    return str;
  }
  const parts = str != null ? str.match(/^\+?1?(\d{3})(\d{3})(\d{4})$/) : undefined;
  if (parts == null) {
    return str;
  }
  return `${parts[1]}-${parts[2]}-${parts[3]}`;
};

const normalizeZip = function (str: string | null): string | null {
  if (str == null) {
    return str;
  }
  const parts = str != null ? str.match(/^\s*(\d{5}).*$/) : undefined;
  if (parts == null) {
    return str;
  }
  return `${parts[1]}`;
};

const unformat = (num: string): number => accounting.unformat(num);

const formatDeliveryWindow = (
  pickupWindow: {startAt: Date | Moment; endAt: Date | Moment},
  tzid: string,
): string =>
  `${formatDate(pickupWindow.startAt, 'clockTime', tzid)}-${formatDate(
    pickupWindow.endAt,
    'clockTime',
    tzid,
  )}`;

const {formatNumber} = accounting;

export {
  formatCardExpiration,
  formatCreditCard,
  formatCustomerName,
  formatDate,
  formatDateRange,
  formatDay,
  formatDeliveryWindow,
  formatLocation,
  formatMoney,
  formatNumber,
  formatPercentage,
  formatPhone,
  formatProductName,
  formatPromoCodeValue,
  formatTimeRange,
  normalizePhone,
  normalizeZip,
  unformat,
};
