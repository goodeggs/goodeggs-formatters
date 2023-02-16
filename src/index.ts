import accounting from 'accounting';
import formatLocation from 'format-location';
import {Fraction} from 'fraction.js';
import getto from 'getto';
import inflect from 'inflect';
import clock from 'node-clock';
import _ from 'underscore';

clock.extendNumber();

// Customize negative currency formatting: -$5.00
accounting.settings.currency.format = {
  pos: '%s%v',
  neg: '-%s%v',
  zero: '%s%v',
};

// Support parameter 'wholeNumberPrecision' to format 30 as $30 but 29.99 as $29.99
// http://josscrowcroft.github.com/accounting.js
const formatMoney = function (...args) {
  if (
    (args[1] != null ? args[1].wholeNumberPrecision : undefined) != null &&
    Math.round(args[0] * 100) % 100 === 0
  ) {
    args[1].precision = args[1].wholeNumberPrecision;
  }
  return accounting.formatMoney(...Array.from(args || []));
};

const roundTo2 = (amount) => Math.round(amount * 100.0) / 100.0;

const formatPercentage = (number) => `${roundTo2(number)}%`;

const formatCardExpiration = (month, year) => `${`0${month}`.slice(-2)}/${`${year}`.slice(-2)}`;

const formatCreditCard = function (card) {
  let type;
  if (card.type) {
    type = `${card.type.toUpperCase()} `;
  }
  return `${type != null ? type : ''}${card.last4} exp ${formatCardExpiration(
    card.exp_month,
    card.exp_year,
  )}`;
};

const dateFormats = {
  monthDay: '%-m/%-d', // 3/22
  longMonthDay: '%B %-d', // March 22
  shortMonthDay: '%b %-d', // Mar 22
  shortDate: '%-m/%-d/%Y', // 3/22/2008
  mailChimpDate: '%m/%d/%Y', // 03/22/2008
  shortDay: '%A, %b %-d', // Saturday, Mar 22
  shorterDay: '%a %b %-d', // Sat Mar 22
  longDay: '%A, %B %-d, %Y', // Saturday, March 22, 2008
  day: '%B %-d, %Y', // March 22, 2008
  shoppingDay: '%A %-m/%-d', // Monday 10/14
  shortShoppingDay: '%a %-m/%-d', // Mon 10/14
  limitDay: '%m-%d-%Y (%a)', // 06-01-2014 (Sun)
  shortTime(date, tzid) {
    // 5pm
    const str = _formatDate(date, '%-l:%M%P', tzid);
    return str.replace('12:00pm', 'noon').replace('12:00am', 'midnight').replace(':00', '');
  },
  shortDayTime(date, tzid) {
    // Saturday, Mar 22, 5:00pm
    const str = _formatDate(date, '%A, %b %-d, %-l:%M%P', tzid);
    return str.replace('12:00pm', 'noon').replace(':00', '');
  },
  clockDateTime: '%Y-%m-%d %H:%M', // 2008-03-22 17:00
  clockDate: '%Y-%m-%d', // 2008-03-22
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
    return _formatDate(date, '%a', tzid).slice(0, 2).toLowerCase();
  },
  iCalWeekday(date, tzid) {
    // MO, TU, WE
    return formatDate(date, 'twoLetterDayOfTheWeek', tzid).toUpperCase();
  },
  humanDate(date, tzid) {
    // March 22nd
    let str = _formatDate(date, '%B ', tzid);
    str += inflect.ordinalize(_formatDate(date, '%-d', tzid));
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
    return _formatDate(date, '%A', tzid);
  },
  humanDay(date, tzid) {
    // Monday, March 22nd
    let str = _formatDate(date, '%A, %B ', tzid);
    str += inflect.ordinalize(_formatDate(date, '%-d', tzid));
    return str;
  },
  humanShortDay(date, tzid) {
    // Monday, Mar 22nd
    let str = _formatDate(date, '%A, %b ', tzid);
    str += inflect.ordinalize(_formatDate(date, '%-d', tzid));
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
      date = new Date(date) - (1).day();
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

const formatDate = function (date, formatString, tzid) {
  if (tzid == null) {
    throw new Error('tzid is required');
  }
  if (date == null) {
    return null;
  }
  date = new Date(date);
  const format = dateFormats[formatString] || formatString;
  return (_isFunction(format) && format(date, tzid)) || _formatDate(date, format, tzid);
};

const sameDay = (date1, date2, tzid) =>
  formatDate(date1, 'clockDate', tzid) === formatDate(date2, 'clockDate', tzid);

const _isFunction = (fn) => typeof fn === 'function';

const _formatDate = (date, format, tzid) => clock.tz(date.valueOf(), format, tzid);

const _isToday = (date, tzid) => sameDay(date, clock.now(), tzid);

const _isTomorrow = function (date, tzid) {
  // Can't use date math on client :(
  // Add one day
  const tomorrow = clock.now() + (1).day();
  return sameDay(date, tomorrow, tzid);
};

const formatDateRange = function (startAt, endAt, tzid, options) {
  if (startAt == null) {
    return null;
  }

  // Accept an object with startAt and endAt keys
  if (startAt.startAt != null && startAt.endAt != null) {
    options = tzid;
    tzid = endAt;
    ({startAt, endAt} = startAt);
  }

  const format = (options != null ? options.format : undefined) || 'shortDay';
  let separator = (options != null ? options.separator : undefined) || ' - ';

  if (format === 'prose') {
    if (sameDay(startAt, endAt, tzid)) {
      return `between ${formatTimeRange(startAt, endAt, tzid, {separator: ' and '})} ${_formatDay(
        startAt,
        tzid,
      )}`;
    }
    return `between ${formatDate(startAt, 'shortTime', tzid)} ${_formatDay(
      startAt,
      tzid,
    )} and ${formatDate(endAt, 'shortTime', tzid)} ${_formatDay(endAt, tzid)}`;
  }

  if (sameDay(startAt, endAt, tzid)) {
    return `${formatDate(startAt, 'shortDay', tzid)}, ${formatTimeRange(startAt, endAt, tzid, {
      separator: ' - ',
    })}`;
  }

  if (format === 'pickupChooser') {
    separator = '...until ';
  }

  return `${formatDate(startAt, 'shortDayTime', tzid)}${separator}${formatDate(
    endAt,
    'shortDayTime',
    tzid,
  )}`;
};

const _formatDay = function (date, tzid) {
  if (_isToday(date, tzid)) {
    return 'today';
  } else if (_isTomorrow(date, tzid)) {
    return 'tomorrow';
  }
  return `on ${formatDate(date, 'shortDay', tzid)}`;
};

const formatTimeRange = function (startAt, endAt, tzid, options) {
  if (startAt == null) {
    return null;
  }

  // Accept an object with startAt and endAt keys
  if (startAt.startAt != null && startAt.endAt != null) {
    options = tzid;
    tzid = endAt;
    ({startAt, endAt} = startAt);
  }

  const format = (options != null ? options.format : undefined) || 'shortTime';
  const separator = (options != null ? options.separator : undefined) || ' - ';

  const startStr = formatDate(startAt, format, tzid);
  const endStr = formatDate(endAt, format, tzid);
  if (startStr === endStr) {
    return startStr;
  }
  return `${startStr}${separator}${endStr}`;
};

const formatPromoCodeValue = function (promoCode) {
  if (promoCode.get == null) {
    getto(promoCode);
  }

  switch (promoCode.get('type')) {
    case 'dollar':
      return formatMoney(promoCode.get('value'), {wholeNumberPrecision: 0});
    case 'percent':
      return `${promoCode.get('value')}%`;
    default:
      throw new Error(`unhandled PromoCode type: ${promoCode.get('type')}`);
  }
};

const formatCustomerName = ({firstName, lastName}) =>
  _([firstName, lastName]).chain().compact().invoke('trim').value().join(' ');

const formatProductName = function (productOrLineItem, options) {
  if (options == null) {
    options = {};
  }
  const {variant, excludeProductName, pickupDate} = options;
  if (productOrLineItem.get == null) {
    getto(productOrLineItem);
  }

  if (variant === 'stack') {
    return productOrLineItem.get('stackName');
  } else if (
    (typeof productOrLineItem.ofTheIsAvailableFor === 'function'
      ? productOrLineItem.ofTheIsAvailableFor({pickupDate})
      : undefined) &&
    productOrLineItem.get('ofThe.name') != null
  ) {
    if (excludeProductName) {
      return productOrLineItem.get('ofThe.name');
    }
    return `${productOrLineItem.get('name')}: ${productOrLineItem.get('ofThe.name')}`;
  }
  return productOrLineItem.get('name');
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYSLONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayFormats = {
  shortDayOfTheWeek(date) {
    return WEEKDAYS[date.getDay()];
  },
  longDayOfTheWeek(date) {
    return WEEKDAYSLONG[date.getDay()];
  },
  shortShoppingDay(date) {
    // Mon 12/25
    return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
  },
};

// formats day strings in the format of: 2014-08-15
const formatDay = function (day, formatString) {
  const formats = _.extend({}, dateFormats, dayFormats);
  if (!formats[formatString] || !day) {
    return day;
  }
  const parts = day.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!parts) {
    return day;
  }
  const date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  const format = formats[formatString];
  const {tzid} = clock.utc;
  return (_isFunction(format) && format(date, tzid)) || _formatDate(date, format, tzid);
};

const normalizePhone = function (phone) {
  if (!phone) {
    return '';
  }

  const digits = phone.replace(/[^\d]/g, '');
  const hasCountryCode = /^\s*\+/.test(phone) || (digits.length === 11 && digits[0] === '1');
  const prefix = hasCountryCode ? '+' : '+1'; // presume US unless specified

  return `${prefix}${digits}`;
};

const formatPhone = function (str) {
  if (!str) {
    return str;
  }
  const parts = str != null ? str.match(/^\+?1?(\d{3})(\d{3})(\d{4})$/) : undefined;
  if (!parts) {
    return str;
  }
  return `${parts[1]}-${parts[2]}-${parts[3]}`;
};

const normalizeZip = function (str) {
  if (!str) {
    return str;
  }
  const parts = str != null ? str.match(/^\s*(\d{5}).*$/) : undefined;
  if (!parts) {
    return str;
  }
  return `${parts[1]}`;
};

const unformat = (num) => accounting.unformat(num);

const formatDeliveryWindow = (pickupWindow, tzid) =>
  `${formatDate(pickupWindow.startAt, 'clockTime', tzid)}-${formatDate(
    pickupWindow.endAt,
    'clockTime',
    tzid,
  )}`;

module.exports = {
  formatCardExpiration,
  formatCreditCard,
  formatCustomerName,
  formatDate,
  formatDateRange,
  formatDay,
  formatDeliveryWindow,
  formatLocation,
  formatMoney,
  formatNumber: accounting.formatNumber,
  formatPercentage,
  formatPhone,
  formatProductName,
  formatPromoCodeValue,
  formatTimeRange,
  normalizePhone,
  normalizeZip,
  unformat,
};
