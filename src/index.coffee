_ = require 'underscore'
clock = require 'node-clock'
clock.extendNumber()
formatLocation = require 'format-location'
accounting = require 'accounting'
getto = require 'getto'
{Fraction} = require 'fraction.js'
inflect = require('inflect')

# Customize negative currency formatting: -$5.00
accounting.settings.currency.format = {
  pos: "%s%v"
  neg: "-%s%v"
  zero: "%s%v"
}

# Support parameter 'wholeNumberPrecision' to format 30 as $30 but 29.99 as $29.99
# http://josscrowcroft.github.com/accounting.js
formatMoney = (args...) ->
  if args[1]?.wholeNumberPrecision? and Math.round(args[0] * 100) % 100 is 0
    args[1].precision = args[1].wholeNumberPrecision
  accounting.formatMoney(args...)

roundTo2 = (amount) -> Math.round(amount * 100.0) / 100.0

formatPercentage = (number) ->
  roundTo2(number) + "%"

formatCardExpiration = (month, year) ->
  "#{('0' + month)[-2..]}/#{(''+year)[-2..]}"

formatCreditCard = (card) ->
  "#{card.type.toUpperCase()} #{card.last4} exp #{formatCardExpiration(card.exp_month, card.exp_year)}"

dateFormats =
  monthDay: '%-m/%-d'                       # 3/22
  longMonthDay: '%B %-d'                    # March 22
  shortDate: '%-m/%-d/%Y'                   # 3/22/2008
  mailChimpDate: '%m/%d/%Y'                 # 03/22/2008
  shortDay:  '%A, %b %-d'                   # Saturday, Mar 22
  shorterDay:  '%a %b %-d'                  # Sat Mar 22
  longDay:  '%A, %B %-d, %Y'                # Saturday, March 22, 2008
  day:  '%B %-d, %Y'                        # March 22, 2008
  shoppingDay: '%A %-m/%-d'                 # Monday 10/14
  shortShoppingDay: '%a %-m/%-d'            # Mon 10/14
  limitDay: '%m-%d-%Y (%a)'                 # 06-01-2014 (Sun)
  shortTime: (date, tzid) ->                # 5pm
    str = _formatDate(date, '%-l:%M%P', tzid)
    return str.replace('12:00pm', 'noon').replace(':00', '')
  shortDayTime: (date, tzid) ->             # Saturday, Mar 22, 5:00pm
    str = _formatDate(date, '%A, %b %-d, %-l:%M%P', tzid)
    return str.replace('12:00pm', 'noon').replace(':00', '')
  clockDateTime: '%Y-%m-%d %H:%M'           # 2008-03-22 17:00
  clockDate: '%Y-%m-%d'                     # 2008-03-22
  clockTime: '%H:%M'                        # 17:00
  hour: '%-l'                               # 5
  iCalDay: '%Y%m%d'                         # 20080327
  iCalTime: '%H%M%S'                        # 133000
  iCalDate: '%Y%m%dT%H%M%S'                 # 20080327T133000
  raygunDate: '%Y-%m-%dT%H:%M:%S+00:00'     # 2013-10-11T01:09:01+00:00
  longDayOfTheWeek: '%A'                    # Tuesday
  shortDayOfTheWeek: '%a'                   # Tue
  twoLetterDayOfTheWeek: (date, tzid) ->    # mo, tu, we
    _formatDate(date, '%a', tzid)[..1].toLowerCase()
  iCalWeekday: (date, tzid) ->              # MO, TU, WE
    formatDate(date, 'twoLetterDayOfTheWeek', tzid).toUpperCase()
  humanDate: (date, tzid) ->    # March 22nd
    str = _formatDate date, "%B ", tzid
    str += inflect.ordinalize(_formatDate(date, '%-d', tzid))
    return str
  humanWeekday: (date, tzid) ->             # today / tomorrow / Monday
    return "today" if _isToday(date, tzid)
    return "tomorrow" if _isTomorrow(date, tzid)
    return _formatDate(date, '%A', tzid)
  humanDay: (date, tzid) ->                 # Monday, March 22nd
    str = _formatDate date, "%A, %B ", tzid
    str += inflect.ordinalize(_formatDate(date, '%-d', tzid))
    return str
  humanShortDay: (date, tzid) ->                 # Monday, Mar 22nd
    str = _formatDate date, "%A, %b ", tzid
    str += inflect.ordinalize(_formatDate(date, '%-d', tzid))
    return str
  humanShoppingDay: (date, tzid) ->         # today / tomorrow / Monday 7/25
    return "today" if _isToday(date, tzid)
    return "tomorrow" if _isTomorrow(date, tzid)
    return formatDate(date, 'shoppingDay', tzid)
  humanTime: '%-l:%M %P'
  year: '%Y'                                # 2014

formatDate = (date, formatString, tzid) ->
  throw new Error('tzid is required') if not tzid?
  return null if !date?
  date = new Date(date)
  format = dateFormats[formatString] or formatString
  return _isFunction(format) and format(date, tzid) or _formatDate(date, format, tzid)

sameDay = (date1, date2, tzid) ->
  formatDate(date1, 'clockDate', tzid) is formatDate(date2, 'clockDate', tzid)

_isFunction = (fn) ->
  typeof(fn) is 'function'

_formatDate = (date, format, tzid) ->
  clock.tz(date.valueOf(), format, tzid)

_isToday = (date, tzid) ->
  return sameDay(date, clock.now(), tzid)

_isTomorrow = (date, tzid) ->
  # Can't use date math on client :(
  # Add one day
  tomorrow = clock.now() + 1.day()
  return sameDay(date, tomorrow, tzid)

isStartOfDay = (dateIn, tzid) ->
  date = dateIn instanceof Date and dateIn or new Date(dateIn)
  date.getTime() == extras.dateAtStartOfDay(date, tzid).getTime()

formatDateRange = (startAt, endAt, tzid, options) ->
  return null unless startAt?

  # Accept an object with startAt and endAt keys
  if startAt.startAt? and startAt.endAt?
    options = tzid
    tzid = endAt
    { startAt, endAt } = startAt

  format    = options?.format || 'shortDay'
  separator = options?.separator || ' - '

  if format == 'prose'
    if sameDay(startAt, endAt, tzid)
      return "between #{formatTimeRange(startAt, endAt, tzid, separator: ' and ')} #{_formatDay(startAt, tzid)}"
    else
      return "between #{formatDate(startAt, 'shortTime', tzid)} #{_formatDay(startAt, tzid)} and #{formatDate(endAt, 'shortTime', tzid)} #{_formatDay(endAt, tzid)}"

  if sameDay(startAt, endAt, tzid)
    return "#{formatDate(startAt, 'shortDay', tzid)}, #{formatTimeRange(startAt, endAt, tzid, separator: ' - ')}"

  separator = "...until " if format == 'pickupChooser'

  return "#{formatDate(startAt, 'shortDayTime', tzid)}#{separator}#{formatDate(endAt, 'shortDayTime', tzid)}"

_formatDay = (date, tzid) ->
  if _isToday(date, tzid)
    return "today"
  else if _isTomorrow(date, tzid)
    return "tomorrow"
  else
    return "on #{formatDate(date, 'shortDay', tzid)}"

formatTimeRange = (startAt, endAt, tzid, options) ->
  return null unless startAt?

  # Accept an object with startAt and endAt keys
  if startAt.startAt? and startAt.endAt?
    options = tzid
    tzid = endAt
    { startAt, endAt } = startAt

  format    = options?.format || 'shortTime'
  separator = options?.separator || ' - '

  startStr = formatDate(startAt, format, tzid)
  endStr = formatDate(endAt, format, tzid)
  if startStr is endStr
    return startStr
  else
    return "#{startStr}#{separator}#{endStr}"

mixedFraction = /^(\d+)\s+(\d+)\/(\d+)/
fraction = /^(\d+)\/(\d+)/
decimal = /^(\d*\.\d+)/
integer = /^(\d+)/



formatPromoCodeValue = (promoCode) ->
  getto(promoCode) unless promoCode.get?

  switch promoCode.get('type')
    when 'dollar'
      formatMoney(promoCode.get('value'), wholeNumberPrecision: 0)
    when 'percent'
      "#{promoCode.get('value')}%"
    else
      throw new Error("unhandled PromoCode type: #{promoCode.get('type')}")

formatCustomerName = ({firstName, lastName}) ->
  _([firstName, lastName]).chain().compact().invoke('trim').value().join(" ")

formatProductName = (productOrLineItem, options = {}) ->
  {variant, excludeProductName, pickupDate} = options
  getto(productOrLineItem) unless productOrLineItem.get?

  if variant is 'stack'
    productOrLineItem.get('stackName')
  else if productOrLineItem.ofTheIsAvailableFor?({pickupDate}) and productOrLineItem.get('ofThe.name')?
    if excludeProductName
      productOrLineItem.get('ofThe.name')
    else
      "#{productOrLineItem.get('name')}: #{productOrLineItem.get('ofThe.name')}"
  else
    productOrLineItem.get('name')

WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
WEEKDAYSLONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
dayFormats =
  'shortDayOfTheWeek': (date) ->
    WEEKDAYS[date.getDay()]
  'longDayOfTheWeek': (date) ->
    WEEKDAYSLONG[date.getDay()]
  'shortShoppingDay': (date) -> # Mon 12/25
    "#{WEEKDAYS[date.getUTCDay()]} #{date.getUTCMonth() + 1}/#{date.getUTCDate()}"

# formats day strings in the format of: 2014-08-15
formatDay = (day, formatString) ->
  return day if !dayFormats[formatString] or !day
  parts = day.match /^(\d{4})\-(\d{1,2})\-(\d{1,2})$/
  return day if !parts
  date = new Date(+parts[1], +parts[2] - 1, +parts[3])
  dayFormats[formatString](date)

normalizePhone = (phone) ->
  if phone?
    normalizedPhone = phone.replace(/[^\d]/g, '')

    return '' if phone is ''

    normalizedPhone = "1#{normalizedPhone}" if normalizedPhone.length isnt 11

    "+#{normalizedPhone}"
  else
    ''

formatPhone = (str) ->
  return str unless str
  parts = str?.match /^\+?1?(\d{3})(\d{3})(\d{4})$/
  return str if not parts
  "#{parts[1]}-#{parts[2]}-#{parts[3]}"

normalizeZip = (str) ->
  return str unless str
  parts = str?.match /^\s*(\d{5}).*$/
  return str if not parts
  "#{parts[1]}"

unformat = (num) ->
  accounting.unformat(num)

formatDeliveryWindow = (pickupWindow, tzid) ->
  "#{formatDate(pickupWindow.startAt, 'clockTime', tzid)}-#{formatDate(pickupWindow.endAt, 'clockTime', tzid)}"

module.exports =
  formatCardExpiration: formatCardExpiration
  formatCreditCard: formatCreditCard
  formatCustomerName: formatCustomerName
  formatDate: formatDate
  formatDateRange: formatDateRange
  formatDay: formatDay
  formatDeliveryWindow: formatDeliveryWindow
  formatLocation: formatLocation
  formatMoney: formatMoney
  formatNumber: accounting.formatNumber
  formatPercentage: formatPercentage
  formatPhone: formatPhone
  formatProductName: formatProductName
  formatPromoCodeValue: formatPromoCodeValue
  formatTimeRange: formatTimeRange
  normalizePhone: normalizePhone
  normalizeZip: normalizeZip
  unformat: unformat
