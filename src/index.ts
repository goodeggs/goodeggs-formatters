import accounting from 'accounting';
import formatLocation from 'format-location';
import getto from 'getto';
import inflect from 'inflect';
import clock from 'node-clock';
import _ from 'underscore';

interface Card {
  type?: string;
  last4?: string;
  exp_month: string;
  exp_year: string;
}

interface DateFormats {
  monthDay: string;
  longMonthDay: string;
  shortMonthDay: string;
  shortDate: string;
  mailChimpDate: string;
  shortDay:  string;
  shorterDay:  string;
  longDay: string;
  day: string;
  shoppingDay: string;
  shortShoppingDay: string;
  limitDay: string;
  shortTime(date: Date, tzid: string): string;
  shortDayTime(date: Date, tzid: string): string;
  clockDateTime: string;
  clockDate: string;
  clockTime:string;
  hour:string;
  iCalDay: string;
  iCalTime: string;
  iCalDate: string;
  raygunDate: string;
  longDayOfTheWeek: string;
  shortDayOfTheWeek:string;
  twoLetterDayOfTheWeek(date: Date, tzid: string): string;
  iCalWeekday(date: string, tzid: string): string;
  humanDate(date: number, tzid: string): string;
  humanWeekday(date: number, tzid: string): string;
  humanDay(date: number, tzid: string): string;
  humanShortDay(date: number, tzid: string): string;
  humanShoppingDay(date: number, tzid: string): string;
  humanShortShoppingDay(date: number, tzid: string): string;
  humanTime: string;
  year: string;               
  orderCutoffDateTime(date: number, tzid: string): string;
}

type FormatString = keyof typeof dateFormats;

clock.extendNumber();

// Customize negative currency formatting: -$5.00
accounting.settings.currency.format = {
  pos: "%s%v",
  neg: "-%s%v",
  zero: "%s%v"
};

interface FormatMoneyOptions {
  wholeNumberPrecision?: number; 
  precision?: number
}

// Support parameter 'wholeNumberPrecision' to format 30 as $30 but 29.99 as $29.99
// http://josscrowcroft.github.com/accounting.js
const formatMoney = function(value: number, options?: FormatMoneyOptions) {
  if (((options != null ? options.wholeNumberPrecision : undefined) != null) && ((Math.round(value * 100) % 100) === 0)) {
    (options as FormatMoneyOptions).precision = (options as FormatMoneyOptions).wholeNumberPrecision;
  }
  return accounting.formatMoney(value, options || {});
};

const roundTo2 = (amount: number): number => Math.round(amount * 100.0) / 100.0;

const formatPercentage = (number: number): number => parseInt(roundTo2(number) + "%");

const formatCardExpiration = (month: string, year: string) => `${(`0${month}`).slice(-2)}/${(`${year}`).slice(-2)}`;

const formatCreditCard = function(card: Card) {
  let type;
  if (card.type) {
    type = `${card.type.toUpperCase()} `;
  }
  return `${type != null ? type : ''}${card.last4} exp ${formatCardExpiration(card.exp_month, card.exp_year)}`;
};

const dateFormats: DateFormats = {
  monthDay: '%-m/%-d',                       // 3/22
  longMonthDay: '%B %-d',                    // March 22
  shortMonthDay: '%b %-d',                   // Mar 22
  shortDate: '%-m/%-d/%Y',                   // 3/22/2008
  mailChimpDate: '%m/%d/%Y',                 // 03/22/2008
  shortDay:  '%A, %b %-d',                   // Saturday, Mar 22
  shorterDay:  '%a %b %-d',                  // Sat Mar 22
  longDay:  '%A, %B %-d, %Y',                // Saturday, March 22, 2008
  day:  '%B %-d, %Y',                        // March 22, 2008
  shoppingDay: '%A %-m/%-d',                 // Monday 10/14
  shortShoppingDay: '%a %-m/%-d',            // Mon 10/14
  limitDay: '%m-%d-%Y (%a)',                 // 06-01-2014 (Sun)
  shortTime(date, tzid) {                // 5pm
    const str = _formatDate(date, '%-l:%M%P', tzid);
    return str.replace('12:00pm', 'noon').replace('12:00am', 'midnight').replace(':00', '');
  },
  shortDayTime(date, tzid) {             // Saturday, Mar 22, 5:00pm
    const str = _formatDate(date, '%A, %b %-d, %-l:%M%P', tzid);
    return str.replace('12:00pm', 'noon').replace(':00', '');
  },
  clockDateTime: '%Y-%m-%d %H:%M',           // 2008-03-22 17:00
  clockDate: '%Y-%m-%d',                     // 2008-03-22
  clockTime: '%H:%M',                        // 17:00
  hour: '%-l',                               // 5
  iCalDay: '%Y%m%d',                         // 20080327
  iCalTime: '%H%M%S',                        // 133000
  iCalDate: '%Y%m%dT%H%M%S',                 // 20080327T133000
  raygunDate: '%Y-%m-%dT%H:%M:%S+00:00',     // 2013-10-11T01:09:01+00:00
  longDayOfTheWeek: '%A',                    // Tuesday
  shortDayOfTheWeek: '%a',                   // Tue
  twoLetterDayOfTheWeek(date, tzid) {    // mo, tu, we
    return _formatDate(date, '%a', tzid).slice(0, 2).toLowerCase();
  },
  iCalWeekday(date, tzid) {              // MO, TU, WE
    return formatDate(date, 'twoLetterDayOfTheWeek', tzid).toUpperCase();
  },
  humanDate(date, tzid) {    // March 22nd
    let str = _formatDate(new Date(date), "%B ", tzid);
    str += inflect.ordinalize(_formatDate(new Date(date), '%-d', tzid));
    return str;
  },
  humanWeekday(date, tzid) {             // today / tomorrow / Monday
    if (_isToday(date, tzid)) { return "today"; }
    if (_isTomorrow(date, tzid)) { return "tomorrow"; }
    return _formatDate(new Date(date), '%A', tzid);
  },
  humanDay(date, tzid) {                 // Monday, March 22nd
    let str = _formatDate(new Date(date), "%A, %B ", tzid);
    str += inflect.ordinalize(_formatDate(new Date(date), '%-d', tzid));
    return str;
  },
  humanShortDay(date, tzid) {                 // Monday, Mar 22nd
    let str = _formatDate(new Date(date), "%A, %b ", tzid);
    str += inflect.ordinalize(_formatDate(new Date(date), '%-d', tzid));
    return str;
  },
  humanShoppingDay(date, tzid) {         // today 7/25 / tomorrow 7/25 / Monday 7/25
    if (_isToday(date, tzid)) { return `today ${formatDate(date, 'monthDay', tzid)}`; }
    if (_isTomorrow(date, tzid)) { return `tomorrow ${formatDate(date, 'monthDay', tzid)}`; }
    return formatDate(date, 'shoppingDay', tzid);
  },
  humanShortShoppingDay(date, tzid) {         // today 7/23 / tomorrow 7/24 / Mon 7/25
    if (_isToday(date, tzid)) { return `today ${formatDate(date, 'monthDay', tzid)}`; }
    if (_isTomorrow(date, tzid)) { return `tomorrow ${formatDate(date, 'monthDay', tzid)}`; }
    return formatDate(date, 'shortShoppingDay', tzid);
  },
  humanTime: '%-l:%M %P',
  year: '%Y',                                // 2014
  orderCutoffDateTime(date, tzid) {
    // permutations are [10am, noon, midnight] [..., tomorrow, Wednesday]
    const isMidnight = formatDate(date, 'shortTime', tzid) === 'midnight';
    if (isMidnight) {
      date = new Date(date).getTime() - ((1) as any).day();
    }
    if (_isToday(date, tzid)) { return formatDate(date, 'shortTime', tzid); }
    if (_isTomorrow(date, tzid)) { return `${ formatDate(date, 'shortTime', tzid) } tomorrow`; }
    return `${ formatDate(date, 'shortTime', tzid) } ${ formatDate(date, 'humanWeekday', tzid) } ${ formatDate(date, 'monthDay', tzid) }`;
  }
};


const formatDate = function(date: string | number, formatString: FormatString, tzid: string): string {
  if ((tzid == null)) { throw new Error('tzid is required'); }
  if ((date == null)) { return '' }
  date = new Date(date).getTime();
  const format = dateFormats[formatString] || formatString;
  return (_isFunction(format as Function) && (format as Function)(date, tzid)) || _formatDate(new Date(date), format as string, tzid);
};

const sameDay = (date1: string | number, date2: string | number, tzid: string) => formatDate(date1, 'clockDate', tzid) === formatDate(date2, 'clockDate', tzid);

const _isFunction = (fn: Function) => typeof(fn) === 'function';

const _formatDate = (date: Date, format: string, tzid: string): string => clock.tz(date.valueOf(), format, tzid);

const _isToday = (date: string | number, tzid: string) => sameDay(date, clock.now(), tzid);

const _isTomorrow = function(date: string | number, tzid: string) {
  // Can't use date math on client :(
  // Add one day
  const tomorrow = clock.now() + ((1) as any).day();
  return sameDay(date, tomorrow, tzid);
};

interface Time {
  startAt: string;
  endAt: string
}

interface Options {
  format?: string;
  separator?: string;
}

const formatDateRange = function(
    startAt: string | Time, 
    endAt: string | Time, 
    tzid?: string | Time | Options, 
    options?: string | Time | Options
  ): string | null {
  if (startAt == null) { return null; }

  // Accept an object with startAt and endAt keys
  if (((startAt as Time).startAt != null) && ((startAt as Time).endAt != null)) {
    options = tzid;
    tzid = endAt;
    ({ startAt, endAt } = (startAt as Time));
  }

  const format    = (options != null ? (options as Options).format : undefined) || 'shortDay';
  let separator = (options != null ? (options as Options).separator : undefined) || ' - ';

  if (format === 'prose') {
    if (sameDay((startAt as string), (endAt as string), (tzid as string))) {
      return `between ${formatTimeRange(startAt, endAt, (tzid as string), {separator: ' and '})} ${_formatDay(new Date(startAt as string), (tzid as string))}`;
    } else {
      return `between ${formatDate((startAt as string), 'shortTime', (tzid as string))} ${_formatDay(new Date((startAt as string)), (tzid as string))} and ${formatDate((endAt as string), 'shortTime', (tzid as string))} ${_formatDay(new Date((endAt as string)), (tzid as string))}`;
    }
  }

  if (sameDay((startAt as string), (endAt as string), (tzid as string))) {
    return `${formatDate((startAt as string), 'shortDay', (tzid as string))}, ${formatTimeRange(startAt, endAt, (tzid as string), {separator: ' - '})}`;
  }

  if (format === 'pickupChooser') { separator = "...until "; }

  return `${formatDate((startAt as string), 'shortDayTime', (tzid as string))}${separator}${formatDate((endAt as string), 'shortDayTime', (tzid as string))}`;
};

const _formatDay = function(date: Date, tzid: string) {
  if (_isToday(date.getTime(), tzid)) {
    return "today";
  } else if (_isTomorrow(date.getTime(), tzid)) {
    return "tomorrow";
  } else {
    return `on ${formatDate(date.getTime(), 'shortDay', tzid)}`;
  }
};

const formatTimeRange = function(
  startAt: string | Time, 
  endAt: string | Time, 
  tzid: string | Time, 
  options: string | Time | Options
): string | null {
  if (startAt == null) { return null; }

  // Accept an object with startAt and endAt keys
  if (((startAt as Time).startAt != null) && ((startAt as Time).endAt != null)) {
    options = tzid;
    tzid = endAt;
    ({ startAt, endAt } = (startAt as Time));
  }

  const format    = (options != null ? (options as Options).format : undefined) || 'shortTime';
  const separator = (options != null ? (options as Options).separator : undefined) || ' - ';

  const startStr = formatDate((startAt as string), format as keyof typeof dateFormats, (tzid as string));
  const endStr = formatDate((endAt as string), format as keyof typeof dateFormats, (tzid as string));
  if (startStr === endStr) {
    return startStr;
  } else {
    return `${startStr}${separator}${endStr}`;
  }
};

const formatPromoCodeValue = function(promoCode: { type: string, value: number}) {
  const promoCodeGetter: { get: (value: string) => any } = getto(promoCode);

  switch (promoCodeGetter.get('type')) {
    case 'dollar':
      return formatMoney(promoCodeGetter.get('value'), {wholeNumberPrecision: 0});
    case 'percent':
      return `${promoCodeGetter.get('value')}%`;
    default:
      throw new Error(`unhandled PromoCode type: ${promoCodeGetter.get('type')}`);
  }
};

const formatCustomerName = ({firstName, lastName}: {firstName?: string | null, lastName?: string | null}) => _([firstName, lastName]).chain().compact().invoke('trim').value().join(" ");

const formatProductName = function(
  productOrLineItem: {
    ofThe: {
      enabled: boolean,
      name: string;
    };
    ofTheIsAvailableFor?: (arg: { pickupDate: number }) => boolean;
  }, 
  options?: {
    variant?: string, 
    excludeProductName?: string;
    pickupDate?: number;
  }) {
  if (options == null) { options = {}; }
  const {variant, excludeProductName, pickupDate} = options;
  const productOrLineItemGetter: { get: (value: string) => any } = getto(productOrLineItem);

  if (variant === 'stack') {
    return productOrLineItemGetter.get('stackName');
  } else if ((typeof productOrLineItem.ofTheIsAvailableFor === 'function' ? productOrLineItem.ofTheIsAvailableFor({pickupDate: pickupDate as number}) : undefined) && (productOrLineItemGetter.get('ofThe.name') != null)) {
    if (excludeProductName) {
      return productOrLineItemGetter.get('ofThe.name');
    } else {
      return `${productOrLineItemGetter.get('name')}: ${productOrLineItemGetter.get('ofThe.name')}`;
    }
  } else {
    return productOrLineItemGetter.get('name');
  }
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYSLONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayFormats = {
  'shortDayOfTheWeek'(date: Date) {
    return WEEKDAYS[date.getDay()];
  },
  'longDayOfTheWeek'(date: Date) {
    return WEEKDAYSLONG[date.getDay()];
  },
  'shortShoppingDay'(date: Date) { // Mon 12/25
    return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
  }
};

// formats day strings in the format of: 2014-08-15
const formatDay = function(day: string, formatString: string) {
  const formats = _.extend({}, dateFormats, dayFormats);
  if (!formats[formatString] || !day) { return day; }
  const parts = day.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!parts) { return day; }
  const date = new Date(+parts[1], +parts[2] - 1, +parts[3]);
  const format = formats[formatString];
  const { tzid } = clock.utc;
  return (_isFunction(format) && format(date, tzid)) || _formatDate(date, format, tzid);
};


const normalizePhone = function(phone?: string | null): string | null | undefined {
  if (!phone) {
    return '';
  }

  const digits = phone.replace(/[^\d]/g, '');
  const hasCountryCode = /^\s*\+/.test(phone) || digits.length === 11 && digits[0] === '1';
  const prefix = hasCountryCode ? '+' : '+1'; // presume US unless specified

  return `${prefix}${digits}`;
};

const formatPhone = function(str?: string | null): string | null | undefined {
  if (!str) { return str; }
  const parts = str != null ? str.match(/^\+?1?(\d{3})(\d{3})(\d{4})$/) : undefined;
  if (!parts) { return str; }
  return `${parts[1]}-${parts[2]}-${parts[3]}`;
};

const normalizeZip = function(str: string | null): string | null {
  if (!str) { return str; }
  const parts = str != null ? str.match(/^\s*(\d{5}).*$/) : undefined;
  if (!parts) { return str; }
  return `${parts[1]}`;
};

const unformat = (num: string): number => accounting.unformat(num);


const formatDeliveryWindow = (pickupWindow: { startAt: string | number, endAt: string | number}, tzid: string) => `${formatDate(pickupWindow.startAt, 'clockTime', tzid)}-${formatDate(pickupWindow.endAt, 'clockTime', tzid)}`;

const formatNumber = accounting.formatNumber;

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
  unformat
};