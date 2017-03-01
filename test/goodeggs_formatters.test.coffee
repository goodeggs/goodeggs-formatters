f = require '..'
clock = require 'node-clock'
sinon = require 'sinon'
{expect} = require 'chai'

describe 'goodeggs-formatters', ->

  it 'formatPhone', ->
    expect(f.formatPhone(null)).to.eql null
    expect(f.formatPhone(undefined)).to.eql undefined
    expect(f.formatPhone('')).to.eql ''
    expect(f.formatPhone('415')).to.eql '415'
    expect(f.formatPhone('+14153208262')).to.eql '415-320-8262'

  describe 'formatDay', ->
    describe 'shortShoppingDay', ->
      it 'formats correctly', ->
        expect(f.formatDay('2014-11-29', 'shortShoppingDay')).to.eql 'Sat 11/29'
        expect(f.formatDay('2014-1-1', 'shortShoppingDay')).to.eql 'Wed 1/1'
        expect(f.formatDay('2014-01-1', 'shortShoppingDay')).to.eql 'Wed 1/1'
        expect(f.formatDay('2014-01-01', 'shortShoppingDay')).to.eql 'Wed 1/1'
        expect(f.formatDay('2014-1-01', 'shortShoppingDay')).to.eql 'Wed 1/1'
        expect(f.formatDay('2014-12-09', 'shortShoppingDay')).to.eql 'Tue 12/9'
        expect(f.formatDay('2014-12-31', 'shortShoppingDay')).to.eql 'Wed 12/31'

    describe 'shortMonthDay', ->
      it 'formats correctly', ->
        expect(f.formatDay('2014-12-31', 'shortMonthDay')).to.eql 'Dec 31'
        expect(f.formatDay('2017-02-01', 'shortMonthDay')).to.eql 'Feb 1'

    describe 'twoLetterDayOfTheWeek', ->
      it 'formats correctly', ->
        expect(f.formatDay('2017-02-01', 'twoLetterDayOfTheWeek')).to.eql 'we'

  it 'formatDate', ->
    expect(f.formatDate('2014-3-8', 'mailChimpDate', clock.utc.tzid)).to.eql '03/08/2014'

  it 'normalizePhone', ->
    expect(f.normalizePhone(null)).to.eql ''
    expect(f.normalizePhone(undefined)).to.eql ''
    expect(f.normalizePhone('')).to.eql ''
    expect(f.normalizePhone('415')).to.eql '+1415'
    expect(f.normalizePhone('1234567890')).to.eql '+11234567890'
    expect(f.normalizePhone('4153208262')).to.eql '+14153208262'
    expect(f.normalizePhone('14153208262')).to.eql '+14153208262'
    expect(f.normalizePhone('+14153208262')).to.eql '+14153208262'

  it 'normalizeZip', ->
    expect(f.normalizeZip(null)).to.eql null
    expect(f.normalizeZip('')).to.eql ''
    expect(f.normalizeZip('12345')).to.eql '12345'
    expect(f.normalizeZip('12345-2')).to.eql '12345'
    expect(f.normalizeZip('12345-1234')).to.eql '12345'
    expect(f.normalizeZip('12345-N(*&N(')).to.eql '12345'
    expect(f.normalizeZip('   12345-N(*&N(')).to.eql '12345'

  describe 'formatMoney', ->
    it 'default behavior', ->
      expect(f.formatMoney(40.5)).to.eql '$40.50'
      expect(f.formatMoney(40)).to.eql '$40.00'
      expect(f.formatMoney(40.000000000003)).to.eql '$40.00'
      expect(f.formatMoney(39.999999999993)).to.eql '$40.00'
      expect(f.formatMoney(-42.5)).to.eql '-$42.50'
      expect(f.formatMoney(0)).to.eql '$0.00'

    it 'with wholeNumberPrecision', ->
      expect(f.formatMoney(40.5, wholeNumberPrecision: 0)).to.eql '$40.50'
      expect(f.formatMoney(40, wholeNumberPrecision: 0)).to.eql '$40'
      expect(f.formatMoney(40.000000000003, wholeNumberPrecision: 0)).to.eql '$40'
      expect(f.formatMoney(39.999999999993, wholeNumberPrecision: 0)).to.eql '$40'
      expect(f.formatMoney(-42.5, wholeNumberPrecision: 0)).to.eql '-$42.50'
      expect(f.formatMoney(0, wholeNumberPrecision: 0)).to.eql '$0'

  it 'formatCustomerName', ->
    expect(f.formatCustomerName({firstName: 'john  ', lastName: null})).to.eql 'john'
    expect(f.formatCustomerName({firstName: 'john  ', lastName: undefined})).to.eql 'john'
    expect(f.formatCustomerName({firstName: 'john', lastName: 'smIth'})).to.eql 'john smIth'
    expect(f.formatCustomerName({firstName: undefined, lastName: 'Smith'})).to.eql 'Smith'
    expect(f.formatCustomerName({firstName: '  John  ', lastName: '  Smith  '})).to.eql 'John Smith'

  describe 'formatProductName', ->
    {product} = {}
    beforeEach ->
      product =
        name: 'Muffin of the Week'
        ofTheIsAvailableFor: -> false

    it 'falls back to product name', ->
      expect(f.formatProductName(product)).to.eql 'Muffin of the Week'

    describe 'when product has ofThe details', ->
      beforeEach ->
        product.ofThe =
          enabled: true
          name: 'Banana Muffin'

      it 'falls back to product name', ->
        expect(f.formatProductName(product)).to.eql 'Muffin of the Week'

      it 'falls back to product name when options for includeOfThe is false', ->
        product.ofTheIsAvailableFor = -> false
        expect(f.formatProductName(product)).to.eql 'Muffin of the Week'

      it 'includes ofThe name when options for includeOfThe is true', ->
        product.ofTheIsAvailableFor = -> true
        expect(f.formatProductName(product)).to.eql 'Muffin of the Week: Banana Muffin'

    describe 'product with ofThe product when ofThe name is empty', ->
      beforeEach ->
        product.ofThe =
          enabled: true
          ofTheIsAvailableFor: -> true

      it 'falls back to product name', ->
        expect(f.formatProductName(product)).to.eql 'Muffin of the Week'

  describe '.formatDateRange', ->

    it 'formats a date range of different dates', ->
      startAt = clock.pacific '2012-03-11 09:00'
      endAt = clock.pacific '2012-03-13 09:00'
      expect(f.formatDateRange(startAt, endAt, clock.pacific.tzid)).to.eql 'Sunday, Mar 11, 9am - Tuesday, Mar 13, 9am'

    it 'formats a date range of the same day', ->
      startAt = clock.pacific '2012-03-11 09:00'
      endAt = clock.pacific '2012-03-11 19:20'
      expect(f.formatDateRange(startAt, endAt, clock.pacific.tzid)).to.eql 'Sunday, Mar 11, 9am - 7:20pm'

    it 'formats a date range object', ->
      range =
        startAt: clock.pacific '2012-03-11 09:00'
        endAt: clock.pacific '2012-03-13 09:00'
      expect(f.formatDateRange(range, clock.pacific.tzid)).to.eql 'Sunday, Mar 11, 9am - Tuesday, Mar 13, 9am'
      expect(f.formatDateRange(range, clock.pacific.tzid, separator: ' to ')).to.eql 'Sunday, Mar 11, 9am to Tuesday, Mar 13, 9am'

  describe '.formatDate', ->
    date = null
    beforeEach ->
      date = clock.pacific '2012-03-08 17:00'

    describe 'humanDate', ->
      it 'returns a full month name with ordinalized date', ->
        expect(f.formatDate(date, 'humanDate', clock.pacific.tzid)).to.equal "March 8th"

    describe 'humanWeekday', ->
      afterEach ->
        Date.now.restore?()

      it 'formats today', ->
        sinon.stub(Date, 'now').returns clock.pacific('2012-03-08 12:00')
        expect(f.formatDate(date, 'humanWeekday', clock.pacific.tzid)).to.eql 'today'

      it 'formats tomorrow', ->
        sinon.stub(Date, 'now').returns clock.pacific('2012-03-07 12:00')
        expect(f.formatDate(date, 'humanWeekday', clock.pacific.tzid)).to.eql 'tomorrow'

      it 'formats arbitrary weekdays', ->
        expect(f.formatDate(date, 'humanWeekday', clock.pacific.tzid)).to.eql 'Thursday'

    describe 'humanShortDay', ->
      it 'returns abbreviated month and ordinalized day', ->
        expect(f.formatDate(date, 'humanShortDay', clock.pacific.tzid)).to.eql 'Thursday, Mar 8th'

    describe 'humanShoppingDay', ->
      afterEach ->
        Date.now.restore?()

      it 'formats today', ->
        sinon.stub(Date, 'now').returns clock.pacific('2012-03-08 12:00')
        expect(f.formatDate(date, 'humanShoppingDay', clock.pacific.tzid)).to.eql 'today 3/8'

      it 'formats tomorrow', ->
        sinon.stub(Date, 'now').returns clock.pacific('2012-03-07 12:00')
        expect(f.formatDate(date, 'humanShoppingDay', clock.pacific.tzid)).to.eql 'tomorrow 3/8'

      it 'formats arbitrary weekdays', ->
        expect(f.formatDate(date, 'humanShoppingDay', clock.pacific.tzid)).to.eql 'Thursday 3/8'

    describe 'humanShortShoppingDay', ->
      afterEach ->
        Date.now.restore?()

      it 'formats today', ->
        sinon.stub(Date, 'now').returns clock.pacific('2012-03-08 12:00')
        expect(f.formatDate(date, 'humanShortShoppingDay', clock.pacific.tzid)).to.eql 'today 3/8'

      it 'formats tomorrow', ->
        sinon.stub(Date, 'now').returns clock.pacific('2012-03-07 12:00')
        expect(f.formatDate(date, 'humanShortShoppingDay', clock.pacific.tzid)).to.eql 'tomorrow 3/8'

      it 'formats another day', ->
        expect(f.formatDate(date, 'humanShortShoppingDay', clock.pacific.tzid)).to.eql 'Thu 3/8'


    describe 'shortShoppingDay', ->
      it 'returns a short shopping day', ->
        expect(f.formatDate(date, 'shortShoppingDay', clock.pacific.tzid)).to.eql 'Thu 3/8'

    describe 'iCalWeekday', ->
      it 'returns upper case two letter abbreviations', ->
        format = 'iCalWeekday'
        tzid = clock.pacific.tzid

        for day, weekday of {
        '2013-09-01': 'SU'
        '2013-09-02': 'MO'
        '2013-09-03': 'TU'
        '2013-09-04': 'WE'
        '2013-09-05': 'TH'
        '2013-09-06': 'FR'
        '2013-09-07': 'SA'
        }
          expect(f.formatDate(clock.tz(day, tzid), format, tzid)).to.eql weekday

    describe 'shortTime', ->
      it 'formats time', ->
        date = clock.pacific '2012-03-08 17:00'
        expect(f.formatDate(date, 'shortTime', clock.pacific.tzid)).to.eql '5pm'

      it 'special cases 12:00pm', ->
        date = clock.pacific '2012-03-08 12:00'
        expect(f.formatDate(date, 'shortTime', clock.pacific.tzid)).to.eql 'noon'

      it 'special cases 12:00am', ->
        date = clock.pacific '2012-03-08 24:00'
        expect(f.formatDate(date, 'shortTime', clock.pacific.tzid)).to.eql 'midnight'

    describe 'orderCutoffDateTime', ->
      it 'formats time', ->
        date = clock.pacific '2012-03-08 17:00'
        sinon.stub(clock, 'now').returns clock.pacific('2012-03-08')
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql '5pm'
        clock.now.restore()
        sinon.stub(clock, 'now').returns clock.pacific('2012-03-07')
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql '5pm tomorrow'
        clock.now.restore()
        sinon.stub(clock, 'now').returns clock.pacific('2012-03-06')
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql '5pm Thursday'
        clock.now.restore()

      it 'special cases 12:00pm', ->
        date = clock.pacific '2012-03-08 12:00'
        sinon.stub(clock, 'now').returns clock.pacific('2012-03-08')
        expect(f.formatDate(date, 'shortTime', clock.pacific.tzid)).to.eql 'noon'
        clock.now.restore()
        sinon.stub(clock, 'now').returns clock.pacific('2012-03-07')
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql 'noon tomorrow'
        clock.now.restore()
        sinon.stub(clock, 'now').returns clock.pacific('2012-03-06')
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql 'noon Thursday'
        clock.now.restore()

      it 'special cases 12:00am', ->
        date = clock.pacific '2012-03-08 24:00'
        sinon.stub(clock, 'now').returns clock.pacific('2012-03-08')
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql 'midnight'
        clock.now.restore()
        sinon.stub(clock, 'now').returns clock.pacific('2012-03-07')
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql 'midnight tomorrow'
        clock.now.restore()
        sinon.stub(clock, 'now').returns clock.pacific('2012-03-06')
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql 'midnight Thursday'
        clock.now.restore()

  describe 'formatPromoCodeValue', ->

    describe 'a dollar promoCode', ->
      promoCode = null
      beforeEach ->
        promoCode =
          type: 'dollar'
          value: 5

      it 'formats as money', ->
        expect(f.formatPromoCodeValue(promoCode)).to.eql '$5'

    describe 'a percent promoCode', ->
      promoCode = null
      beforeEach ->
        promoCode =
          type: 'percent'
          value: 5

      it 'formats as a precentage', ->
        expect(f.formatPromoCodeValue(promoCode)).to.eql '5%'

  describe 'formatLocation', ->
    it 'formats the full address', ->
      location = {name: 'Good Eggs HQ', address: '530 Hampshire Street', address2: 'Suite 301', city: 'San Francisco', state: 'CA', zip: '94110'}
      expect(f.formatLocation(location, 'full')).to.equal '530 Hampshire Street, Suite 301, San Francisco, CA 94110'
