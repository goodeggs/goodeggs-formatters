/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const f = require('..');
const clock = require('node-clock');
const sinon = require('sinon');
const {expect} = require('chai');

describe('goodeggs-formatters', function() {

  it('formatPhone', function() {
    expect(f.formatPhone(null)).to.eql(null);
    expect(f.formatPhone(undefined)).to.eql(undefined);
    expect(f.formatPhone('')).to.eql('');
    expect(f.formatPhone('415')).to.eql('415');
    return expect(f.formatPhone('+14153208262')).to.eql('415-320-8262');
  });

  describe('formatCreditCard', function() {
    it('works', () =>
      expect(f.formatCreditCard({
        type: 'visa',
        last4: '4242',
        exp_month: '6',
        exp_year: '2020'
      })).to.eql('VISA 4242 exp 06/20')
    );

    return it('leaves out the type if it doesnt exist', () =>
      expect(f.formatCreditCard({
        last4: '4242',
        exp_month: '6',
        exp_year: '2020'
      })).to.eql('4242 exp 06/20')
    );
  });

  describe('formatDay', function() {
    describe('shortShoppingDay', () =>
      it('formats correctly', function() {
        expect(f.formatDay('2014-11-29', 'shortShoppingDay')).to.eql('Sat 11/29');
        expect(f.formatDay('2014-1-1', 'shortShoppingDay')).to.eql('Wed 1/1');
        expect(f.formatDay('2014-01-1', 'shortShoppingDay')).to.eql('Wed 1/1');
        expect(f.formatDay('2014-01-01', 'shortShoppingDay')).to.eql('Wed 1/1');
        expect(f.formatDay('2014-1-01', 'shortShoppingDay')).to.eql('Wed 1/1');
        expect(f.formatDay('2014-12-09', 'shortShoppingDay')).to.eql('Tue 12/9');
        return expect(f.formatDay('2014-12-31', 'shortShoppingDay')).to.eql('Wed 12/31');
      })
    );

    describe('shortMonthDay', () =>
      it('formats correctly', function() {
        expect(f.formatDay('2014-12-31', 'shortMonthDay')).to.eql('Dec 31');
        return expect(f.formatDay('2017-02-01', 'shortMonthDay')).to.eql('Feb 1');
      })
    );

    return describe('twoLetterDayOfTheWeek', () =>
      it('formats correctly', () => expect(f.formatDay('2017-02-01', 'twoLetterDayOfTheWeek')).to.eql('we'))
    );
  });

  it('formatDate', () => expect(f.formatDate('2014-3-8', 'mailChimpDate', clock.utc.tzid)).to.eql('03/08/2014'));

  it('normalizePhone', function() {
    expect(f.normalizePhone(null)).to.eql('');
    expect(f.normalizePhone(undefined)).to.eql('');
    expect(f.normalizePhone('')).to.eql('');
    expect(f.normalizePhone('415')).to.eql('+1415');
    expect(f.normalizePhone('1234567890')).to.eql('+11234567890');
    expect(f.normalizePhone('4153208262')).to.eql('+14153208262');
    expect(f.normalizePhone('14153208262')).to.eql('+14153208262');
    return expect(f.normalizePhone('+14153208262')).to.eql('+14153208262');
  });

  it('normalizeZip', function() {
    expect(f.normalizeZip(null)).to.eql(null);
    expect(f.normalizeZip('')).to.eql('');
    expect(f.normalizeZip('12345')).to.eql('12345');
    expect(f.normalizeZip('12345-2')).to.eql('12345');
    expect(f.normalizeZip('12345-1234')).to.eql('12345');
    expect(f.normalizeZip('12345-N(*&N(')).to.eql('12345');
    return expect(f.normalizeZip('   12345-N(*&N(')).to.eql('12345');
  });

  describe('formatMoney', function() {
    it('default behavior', function() {
      expect(f.formatMoney(40.5)).to.eql('$40.50');
      expect(f.formatMoney(40)).to.eql('$40.00');
      expect(f.formatMoney(40.000000000003)).to.eql('$40.00');
      expect(f.formatMoney(39.999999999993)).to.eql('$40.00');
      expect(f.formatMoney(-42.5)).to.eql('-$42.50');
      return expect(f.formatMoney(0)).to.eql('$0.00');
    });

    return it('with wholeNumberPrecision', function() {
      expect(f.formatMoney(40.5, {wholeNumberPrecision: 0})).to.eql('$40.50');
      expect(f.formatMoney(40, {wholeNumberPrecision: 0})).to.eql('$40');
      expect(f.formatMoney(40.000000000003, {wholeNumberPrecision: 0})).to.eql('$40');
      expect(f.formatMoney(39.999999999993, {wholeNumberPrecision: 0})).to.eql('$40');
      expect(f.formatMoney(-42.5, {wholeNumberPrecision: 0})).to.eql('-$42.50');
      return expect(f.formatMoney(0, {wholeNumberPrecision: 0})).to.eql('$0');
    });
  });

  it('formatCustomerName', function() {
    expect(f.formatCustomerName({firstName: 'john  ', lastName: null})).to.eql('john');
    expect(f.formatCustomerName({firstName: 'john  ', lastName: undefined})).to.eql('john');
    expect(f.formatCustomerName({firstName: 'john', lastName: 'smIth'})).to.eql('john smIth');
    expect(f.formatCustomerName({firstName: undefined, lastName: 'Smith'})).to.eql('Smith');
    return expect(f.formatCustomerName({firstName: '  John  ', lastName: '  Smith  '})).to.eql('John Smith');
  });

  describe('formatProductName', function() {
    let {product} = {};
    beforeEach(() =>
      product = {
        name: 'Muffin of the Week',
        ofTheIsAvailableFor() { return false; }
      }
    );

    it('falls back to product name', () => expect(f.formatProductName(product)).to.eql('Muffin of the Week'));

    describe('when product has ofThe details', function() {
      beforeEach(() =>
        product.ofThe = {
          enabled: true,
          name: 'Banana Muffin'
        }
      );

      it('falls back to product name', () => expect(f.formatProductName(product)).to.eql('Muffin of the Week'));

      it('falls back to product name when options for includeOfThe is false', function() {
        product.ofTheIsAvailableFor = () => false;
        return expect(f.formatProductName(product)).to.eql('Muffin of the Week');
      });

      return it('includes ofThe name when options for includeOfThe is true', function() {
        product.ofTheIsAvailableFor = () => true;
        return expect(f.formatProductName(product)).to.eql('Muffin of the Week: Banana Muffin');
      });
    });

    return describe('product with ofThe product when ofThe name is empty', function() {
      beforeEach(() =>
        product.ofThe = {
          enabled: true,
          ofTheIsAvailableFor() { return true; }
        }
      );

      return it('falls back to product name', () => expect(f.formatProductName(product)).to.eql('Muffin of the Week'));
    });
  });

  describe('.formatDateRange', function() {

    it('formats a date range of different dates', function() {
      const startAt = clock.pacific('2012-03-11 09:00');
      const endAt = clock.pacific('2012-03-13 09:00');
      return expect(f.formatDateRange(startAt, endAt, clock.pacific.tzid)).to.eql('Sunday, Mar 11, 9am - Tuesday, Mar 13, 9am');
    });

    it('formats a date range of the same day', function() {
      const startAt = clock.pacific('2012-03-11 09:00');
      const endAt = clock.pacific('2012-03-11 19:20');
      return expect(f.formatDateRange(startAt, endAt, clock.pacific.tzid)).to.eql('Sunday, Mar 11, 9am - 7:20pm');
    });

    return it('formats a date range object', function() {
      const range = {
        startAt: clock.pacific('2012-03-11 09:00'),
        endAt: clock.pacific('2012-03-13 09:00')
      };
      expect(f.formatDateRange(range, clock.pacific.tzid)).to.eql('Sunday, Mar 11, 9am - Tuesday, Mar 13, 9am');
      return expect(f.formatDateRange(range, clock.pacific.tzid, {separator: ' to '})).to.eql('Sunday, Mar 11, 9am to Tuesday, Mar 13, 9am');
    });
  });

  describe('.formatDate', function() {
    let date = null;
    beforeEach(() => date = clock.pacific('2012-03-08 17:00'));

    describe('humanDate', () =>
      it('returns a full month name with ordinalized date', () => expect(f.formatDate(date, 'humanDate', clock.pacific.tzid)).to.equal("March 8th"))
    );

    describe('humanWeekday', function() {
      afterEach(() => typeof Date.now.restore === 'function' ? Date.now.restore() : undefined);

      it('formats today', function() {
        sinon.stub(Date, 'now').returns(clock.pacific('2012-03-08 12:00'));
        return expect(f.formatDate(date, 'humanWeekday', clock.pacific.tzid)).to.eql('today');
      });

      it('formats tomorrow', function() {
        sinon.stub(Date, 'now').returns(clock.pacific('2012-03-07 12:00'));
        return expect(f.formatDate(date, 'humanWeekday', clock.pacific.tzid)).to.eql('tomorrow');
      });

      return it('formats arbitrary weekdays', () => expect(f.formatDate(date, 'humanWeekday', clock.pacific.tzid)).to.eql('Thursday'));
    });

    describe('humanShortDay', () =>
      it('returns abbreviated month and ordinalized day', () => expect(f.formatDate(date, 'humanShortDay', clock.pacific.tzid)).to.eql('Thursday, Mar 8th'))
    );

    describe('humanShoppingDay', function() {
      afterEach(() => typeof Date.now.restore === 'function' ? Date.now.restore() : undefined);

      it('formats today', function() {
        sinon.stub(Date, 'now').returns(clock.pacific('2012-03-08 12:00'));
        return expect(f.formatDate(date, 'humanShoppingDay', clock.pacific.tzid)).to.eql('today 3/8');
      });

      it('formats tomorrow', function() {
        sinon.stub(Date, 'now').returns(clock.pacific('2012-03-07 12:00'));
        return expect(f.formatDate(date, 'humanShoppingDay', clock.pacific.tzid)).to.eql('tomorrow 3/8');
      });

      return it('formats arbitrary weekdays', () => expect(f.formatDate(date, 'humanShoppingDay', clock.pacific.tzid)).to.eql('Thursday 3/8'));
    });

    describe('humanShortShoppingDay', function() {
      afterEach(() => typeof Date.now.restore === 'function' ? Date.now.restore() : undefined);

      it('formats today', function() {
        sinon.stub(Date, 'now').returns(clock.pacific('2012-03-08 12:00'));
        return expect(f.formatDate(date, 'humanShortShoppingDay', clock.pacific.tzid)).to.eql('today 3/8');
      });

      it('formats tomorrow', function() {
        sinon.stub(Date, 'now').returns(clock.pacific('2012-03-07 12:00'));
        return expect(f.formatDate(date, 'humanShortShoppingDay', clock.pacific.tzid)).to.eql('tomorrow 3/8');
      });

      return it('formats another day', () => expect(f.formatDate(date, 'humanShortShoppingDay', clock.pacific.tzid)).to.eql('Thu 3/8'));
    });


    describe('shortShoppingDay', () =>
      it('returns a short shopping day', () => expect(f.formatDate(date, 'shortShoppingDay', clock.pacific.tzid)).to.eql('Thu 3/8'))
    );

    describe('iCalWeekday', () =>
      it('returns upper case two letter abbreviations', function() {
        const format = 'iCalWeekday';
        const { tzid } = clock.pacific;

        return (() => {
          const result = [];
          const object = {
        '2013-09-01': 'SU',
        '2013-09-02': 'MO',
        '2013-09-03': 'TU',
        '2013-09-04': 'WE',
        '2013-09-05': 'TH',
        '2013-09-06': 'FR',
        '2013-09-07': 'SA'
        };
          for (let day in object) {
            const weekday = object[day];
            result.push(expect(f.formatDate(clock.tz(day, tzid), format, tzid)).to.eql(weekday));
          }
          return result;
        })();
      })
    );

    describe('shortTime', function() {
      it('formats time', function() {
        date = clock.pacific('2012-03-08 17:00');
        return expect(f.formatDate(date, 'shortTime', clock.pacific.tzid)).to.eql('5pm');
      });

      it('special cases 12:00pm', function() {
        date = clock.pacific('2012-03-08 12:00');
        return expect(f.formatDate(date, 'shortTime', clock.pacific.tzid)).to.eql('noon');
      });

      return it('special cases 12:00am', function() {
        date = clock.pacific('2012-03-08 24:00');
        return expect(f.formatDate(date, 'shortTime', clock.pacific.tzid)).to.eql('midnight');
      });
    });

    return describe('orderCutoffDateTime', function() {
      it('formats time', function() {
        date = clock.pacific('2012-03-08 17:00');
        sinon.stub(clock, 'now').returns(clock.pacific('2012-03-08'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql('5pm');
        clock.now.restore();
        sinon.stub(clock, 'now').returns(clock.pacific('2012-03-07'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql('5pm tomorrow');
        clock.now.restore();
        sinon.stub(clock, 'now').returns(clock.pacific('2012-03-06'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql('5pm Thursday');
        return clock.now.restore();
      });

      it('special cases 12:00pm', function() {
        date = clock.pacific('2012-03-08 12:00');
        sinon.stub(clock, 'now').returns(clock.pacific('2012-03-08'));
        expect(f.formatDate(date, 'shortTime', clock.pacific.tzid)).to.eql('noon');
        clock.now.restore();
        sinon.stub(clock, 'now').returns(clock.pacific('2012-03-07'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql('noon tomorrow');
        clock.now.restore();
        sinon.stub(clock, 'now').returns(clock.pacific('2012-03-06'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql('noon Thursday');
        return clock.now.restore();
      });

      return it('special cases 12:00am', function() {
        date = clock.pacific('2012-03-08 24:00');
        sinon.stub(clock, 'now').returns(clock.pacific('2012-03-08'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql('midnight');
        clock.now.restore();
        sinon.stub(clock, 'now').returns(clock.pacific('2012-03-07'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql('midnight tomorrow');
        clock.now.restore();
        sinon.stub(clock, 'now').returns(clock.pacific('2012-03-06'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).to.eql('midnight Thursday');
        return clock.now.restore();
      });
    });
  });

  describe('formatPromoCodeValue', function() {

    describe('a dollar promoCode', function() {
      let promoCode = null;
      beforeEach(() =>
        promoCode = {
          type: 'dollar',
          value: 5
        }
      );

      return it('formats as money', () => expect(f.formatPromoCodeValue(promoCode)).to.eql('$5'));
    });

    return describe('a percent promoCode', function() {
      let promoCode = null;
      beforeEach(() =>
        promoCode = {
          type: 'percent',
          value: 5
        }
      );

      return it('formats as a precentage', () => expect(f.formatPromoCodeValue(promoCode)).to.eql('5%'));
    });
  });

  return describe('formatLocation', () =>
    it('formats the full address', function() {
      const location = {name: 'Good Eggs HQ', address: '530 Hampshire Street', address2: 'Suite 301', city: 'San Francisco', state: 'CA', zip: '94110'};
      return expect(f.formatLocation(location, 'full')).to.equal('530 Hampshire Street, Suite 301, San Francisco, CA 94110');
    })
  );
});
