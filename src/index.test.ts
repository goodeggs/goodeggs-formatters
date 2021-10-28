import clock from 'node-clock';
import sinon from 'sinon';

import * as f from '.';

describe('goodeggs-formatters', function () {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  it('formatPhone', function () {
    expect(f.formatPhone(null)).toEqual(null);
    expect(f.formatPhone(undefined)).toEqual(undefined);
    expect(f.formatPhone('')).toEqual('');
    expect(f.formatPhone('415')).toEqual('415');
    expect(f.formatPhone('+14153208262')).toEqual('415-320-8262');
  });

  describe('formatCreditCard', function () {
    it('works', () =>
      expect(
        f.formatCreditCard({
          type: 'visa',
          last4: '4242',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          exp_month: '6',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          exp_year: '2020',
        }),
      ).toEqual('VISA 4242 exp 06/20'));

    it('leaves out the type if it doesnt exist', () =>
      expect(
        f.formatCreditCard({
          last4: '4242',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          exp_month: '6',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          exp_year: '2020',
        }),
      ).toEqual('4242 exp 06/20'));
  });

  describe('formatDay', function () {
    describe('shortShoppingDay', () => {
      it('formats correctly', function () {
        expect(f.formatDay('2014-11-29', 'shortShoppingDay')).toEqual('Sat 11/29');
        expect(f.formatDay('2014-1-1', 'shortShoppingDay')).toEqual('Wed 1/1');
        expect(f.formatDay('2014-01-1', 'shortShoppingDay')).toEqual('Wed 1/1');
        expect(f.formatDay('2014-01-01', 'shortShoppingDay')).toEqual('Wed 1/1');
        expect(f.formatDay('2014-1-01', 'shortShoppingDay')).toEqual('Wed 1/1');
        expect(f.formatDay('2014-12-09', 'shortShoppingDay')).toEqual('Tue 12/9');
        expect(f.formatDay('2014-12-31', 'shortShoppingDay')).toEqual('Wed 12/31');
      });
    });

    describe('shortMonthDay', () => {
      it('formats correctly', function () {
        expect(f.formatDay('2014-12-31', 'shortMonthDay')).toEqual('Dec 31');
        expect(f.formatDay('2017-02-01', 'shortMonthDay')).toEqual('Feb 1');
      });
    });

    describe('twoLetterDayOfTheWeek', () => {
      it('formats correctly', () => {
        expect(f.formatDay('2017-02-01', 'twoLetterDayOfTheWeek')).toEqual('we');
      });
    });
  });

  it('formatDate', () =>
    expect(f.formatDate('2014-3-8', 'mailChimpDate', clock.utc.tzid)).toEqual('03/08/2014'));

  describe('normalize phone', function () {
    it('defaults to US numbers', function () {
      expect(f.normalizePhone(null)).toEqual('');
      expect(f.normalizePhone(undefined)).toEqual('');
      expect(f.normalizePhone('')).toEqual('');
      expect(f.normalizePhone('415')).toEqual('+1415');
      expect(f.normalizePhone('1234567890')).toEqual('+11234567890');
      expect(f.normalizePhone('4153208262')).toEqual('+14153208262');
      expect(f.normalizePhone('14153208262')).toEqual('+14153208262');
      expect(f.normalizePhone('+14153208262')).toEqual('+14153208262');
    });

    it('does not change international numbers', function () {
      expect(f.normalizePhone('+33929598762')).toEqual('+33929598762');
      expect(f.normalizePhone('+4773226363')).toEqual('+4773226363');
    });
  });

  it('normalizeZip', function () {
    expect(f.normalizeZip(null)).toEqual(null);
    expect(f.normalizeZip('')).toEqual('');
    expect(f.normalizeZip('12345')).toEqual('12345');
    expect(f.normalizeZip('12345-2')).toEqual('12345');
    expect(f.normalizeZip('12345-1234')).toEqual('12345');
    expect(f.normalizeZip('12345-N(*&N(')).toEqual('12345');
    expect(f.normalizeZip('   12345-N(*&N(')).toEqual('12345');
  });

  describe('formatMoney', function () {
    it('default behavior', function () {
      expect(f.formatMoney(40.5)).toEqual('$40.50');
      expect(f.formatMoney(40)).toEqual('$40.00');
      expect(f.formatMoney(40.000000000003)).toEqual('$40.00');
      expect(f.formatMoney(39.999999999993)).toEqual('$40.00');
      expect(f.formatMoney(-42.5)).toEqual('-$42.50');
      expect(f.formatMoney(0)).toEqual('$0.00');
    });

    it('with wholeNumberPrecision', function () {
      expect(f.formatMoney(40.5, {wholeNumberPrecision: 0})).toEqual('$40.50');
      expect(f.formatMoney(40, {wholeNumberPrecision: 0})).toEqual('$40');
      expect(f.formatMoney(40.000000000003, {wholeNumberPrecision: 0})).toEqual('$40');
      expect(f.formatMoney(39.999999999993, {wholeNumberPrecision: 0})).toEqual('$40');
      expect(f.formatMoney(-42.5, {wholeNumberPrecision: 0})).toEqual('-$42.50');
      expect(f.formatMoney(0, {wholeNumberPrecision: 0})).toEqual('$0');
    });
  });

  it('formatCustomerName', function () {
    expect(f.formatCustomerName({firstName: 'john  ', lastName: null})).toEqual('john');
    expect(f.formatCustomerName({firstName: 'john  ', lastName: undefined})).toEqual('john');
    expect(f.formatCustomerName({firstName: 'john', lastName: 'smIth'})).toEqual('john smIth');
    expect(f.formatCustomerName({firstName: undefined, lastName: 'Smith'})).toEqual('Smith');
    expect(f.formatCustomerName({firstName: '  John  ', lastName: '  Smith  '})).toEqual(
      'John Smith',
    );
  });

  describe('formatProductName', function () {
    let product: any = {};
    beforeEach(
      () =>
        (product = {
          name: 'Muffin of the Week',
          ofTheIsAvailableFor() {
            return false;
          },
        }),
    );

    it('falls back to product name', () =>
      expect(f.formatProductName(product)).toEqual('Muffin of the Week'));

    describe('when product has ofThe details', function () {
      beforeEach(
        () =>
          (product.ofThe = {
            enabled: true,
            name: 'Banana Muffin',
          }),
      );

      it('falls back to product name', () =>
        expect(f.formatProductName(product)).toEqual('Muffin of the Week'));

      it('falls back to product name when options for includeOfThe is false', function () {
        product.ofTheIsAvailableFor = () => false;
        expect(f.formatProductName(product)).toEqual('Muffin of the Week');
      });

      it('includes ofThe name when options for includeOfThe is true', function () {
        product.ofTheIsAvailableFor = () => true;
        expect(f.formatProductName(product)).toEqual('Muffin of the Week: Banana Muffin');
      });
    });

    describe('product with ofThe product when ofThe name is empty', function () {
      beforeEach(
        () =>
          (product.ofThe = {
            enabled: true,
            ofTheIsAvailableFor() {
              return true;
            },
          }),
      );

      it('falls back to product name', () =>
        expect(f.formatProductName(product)).toEqual('Muffin of the Week'));
    });
  });

  describe('.formatDateRange', function () {
    it('formats a date range of different dates', function () {
      const startAt = clock.pacific('2012-03-11 09:00');
      const endAt = clock.pacific('2012-03-13 09:00');
      expect(f.formatDateRange(startAt, endAt, clock.pacific.tzid)).toEqual(
        'Sunday, Mar 11, 9am - Tuesday, Mar 13, 9am',
      );
    });

    it('formats a date range of the same day', function () {
      const startAt = clock.pacific('2012-03-11 09:00');
      const endAt = clock.pacific('2012-03-11 19:20');
      expect(f.formatDateRange(startAt, endAt, clock.pacific.tzid)).toEqual(
        'Sunday, Mar 11, 9am - 7:20pm',
      );
    });

    it('formats a date range object', function () {
      const range = {
        startAt: clock.pacific('2012-03-11 09:00'),
        endAt: clock.pacific('2012-03-13 09:00'),
      };
      expect(f.formatDateRange(range, clock.pacific.tzid)).toEqual(
        'Sunday, Mar 11, 9am - Tuesday, Mar 13, 9am',
      );
      expect(f.formatDateRange(range, clock.pacific.tzid, {separator: ' to '})).toEqual(
        'Sunday, Mar 11, 9am to Tuesday, Mar 13, 9am',
      );
    });
  });

  describe('.formatDate', function () {
    let date: number;
    beforeEach(() => (date = clock.pacific('2012-03-08 17:00')));

    describe('humanDate', () => {
      it('returns a full month name with ordinalized date', () => {
        expect(f.formatDate(date, 'humanDate', clock.pacific.tzid)).toEqual('March 8th');
      });
    });

    describe('humanWeekday', function () {
      it('formats today', function () {
        sandbox.stub(Date, 'now').returns(clock.pacific('2012-03-08 12:00'));
        expect(f.formatDate(date, 'humanWeekday', clock.pacific.tzid)).toEqual('today');
      });

      it('formats tomorrow', function () {
        sandbox.stub(Date, 'now').returns(clock.pacific('2012-03-07 12:00'));
        expect(f.formatDate(date, 'humanWeekday', clock.pacific.tzid)).toEqual('tomorrow');
      });

      it('formats arbitrary weekdays', () =>
        expect(f.formatDate(date, 'humanWeekday', clock.pacific.tzid)).toEqual('Thursday'));
    });

    describe('humanShortDay', () => {
      it('returns abbreviated month and ordinalized day', () => {
        expect(f.formatDate(date, 'humanShortDay', clock.pacific.tzid)).toEqual(
          'Thursday, Mar 8th',
        );
      });
    });

    describe('humanShoppingDay', function () {
      it('formats today', function () {
        sandbox.stub(Date, 'now').returns(clock.pacific('2012-03-08 12:00'));
        expect(f.formatDate(date, 'humanShoppingDay', clock.pacific.tzid)).toEqual('today 3/8');
      });

      it('formats tomorrow', function () {
        sandbox.stub(Date, 'now').returns(clock.pacific('2012-03-07 12:00'));
        expect(f.formatDate(date, 'humanShoppingDay', clock.pacific.tzid)).toEqual('tomorrow 3/8');
      });

      it('formats arbitrary weekdays', () =>
        expect(f.formatDate(date, 'humanShoppingDay', clock.pacific.tzid)).toEqual('Thursday 3/8'));
    });

    describe('humanShortShoppingDay', function () {
      it('formats today', function () {
        sandbox.stub(Date, 'now').returns(clock.pacific('2012-03-08 12:00'));
        expect(f.formatDate(date, 'humanShortShoppingDay', clock.pacific.tzid)).toEqual(
          'today 3/8',
        );
      });

      it('formats tomorrow', function () {
        sandbox.stub(Date, 'now').returns(clock.pacific('2012-03-07 12:00'));
        expect(f.formatDate(date, 'humanShortShoppingDay', clock.pacific.tzid)).toEqual(
          'tomorrow 3/8',
        );
      });

      it('formats another day', () =>
        expect(f.formatDate(date, 'humanShortShoppingDay', clock.pacific.tzid)).toEqual('Thu 3/8'));
    });

    describe('shortShoppingDay', () => {
      it('returns a short shopping day', () => {
        expect(f.formatDate(date, 'shortShoppingDay', clock.pacific.tzid)).toEqual('Thu 3/8');
      });
    });

    describe('iCalWeekday', () => {
      it('returns upper case two letter abbreviations', function () {
        const format = 'iCalWeekday';
        const {tzid} = clock.pacific;

        for (const [day, weekday] of Object.entries({
          '2013-09-01': 'SU',
          '2013-09-02': 'MO',
          '2013-09-03': 'TU',
          '2013-09-04': 'WE',
          '2013-09-05': 'TH',
          '2013-09-06': 'FR',
          '2013-09-07': 'SA',
        })) {
          expect(f.formatDate(clock.tz(day, tzid), format, tzid)).toEqual(weekday);
        }
      });
    });

    describe('shortTime', function () {
      it('formats time', function () {
        date = clock.pacific('2012-03-08 17:00');
        expect(f.formatDate(date, 'shortTime', clock.pacific.tzid)).toEqual('5pm');
      });

      it('special cases 12:00pm', function () {
        date = clock.pacific('2012-03-08 12:00');
        expect(f.formatDate(date, 'shortTime', clock.pacific.tzid)).toEqual('noon');
      });

      it('special cases 12:00am', function () {
        date = clock.pacific('2012-03-08 24:00');
        expect(f.formatDate(date, 'shortTime', clock.pacific.tzid)).toEqual('midnight');
      });
    });

    describe('orderCutoffDateTime', function () {
      it('formats time', function () {
        date = clock.pacific('2012-03-08 17:00');
        sandbox.stub(Date, 'now').returns(clock.pacific('2012-03-08'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).toEqual('5pm');
        sandbox.restore();
        sandbox.stub(Date, 'now').returns(clock.pacific('2012-03-07'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).toEqual(
          '5pm tomorrow',
        );
        sandbox.restore();
        sandbox.stub(Date, 'now').returns(clock.pacific('2012-03-06'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).toEqual(
          '5pm Thursday 3/8',
        );
        sandbox.restore();
      });

      it('special cases 12:00pm', function () {
        date = clock.pacific('2012-03-08 12:00');
        sandbox.stub(Date, 'now').returns(clock.pacific('2012-03-08'));
        expect(f.formatDate(date, 'shortTime', clock.pacific.tzid)).toEqual('noon');
        sandbox.restore();
        sandbox.stub(Date, 'now').returns(clock.pacific('2012-03-07'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).toEqual(
          'noon tomorrow',
        );
        sandbox.restore();
        sandbox.stub(Date, 'now').returns(clock.pacific('2012-03-06'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).toEqual(
          'noon Thursday 3/8',
        );
        sandbox.restore();
      });

      it('special cases 12:00am', function () {
        date = clock.pacific('2012-03-08 24:00');
        sandbox.stub(Date, 'now').returns(clock.pacific('2012-03-08'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).toEqual('midnight');
        sandbox.restore();
        sandbox.stub(Date, 'now').returns(clock.pacific('2012-03-07'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).toEqual(
          'midnight tomorrow',
        );
        sandbox.restore();
        sandbox.stub(Date, 'now').returns(clock.pacific('2012-03-06'));
        expect(f.formatDate(date, 'orderCutoffDateTime', clock.pacific.tzid)).toEqual(
          'midnight Thursday 3/8',
        );
        sandbox.restore();
      });
    });
  });

  describe('formatPromoCodeValue', function () {
    describe('a dollar promoCode', function () {
      let promoCode: any = null;
      beforeEach(
        () =>
          (promoCode = {
            type: 'dollar',
            value: 5,
          }),
      );

      it('formats as money', () => expect(f.formatPromoCodeValue(promoCode)).toEqual('$5'));
    });

    describe('a percent promoCode', function () {
      let promoCode: any = null;
      beforeEach(
        () =>
          (promoCode = {
            type: 'percent',
            value: 5,
          }),
      );

      it('formats as a precentage', () => expect(f.formatPromoCodeValue(promoCode)).toEqual('5%'));
    });
  });

  describe('formatLocation', () => {
    it('formats the full address', function () {
      const location = {
        name: 'Good Eggs HQ',
        address: '530 Hampshire Street',
        address2: 'Suite 301',
        city: 'San Francisco',
        state: 'CA',
        zip: '94110',
      };
      expect(f.formatLocation(location, 'full')).toEqual(
        '530 Hampshire Street, Suite 301, San Francisco, CA 94110',
      );
    });
  });
});
