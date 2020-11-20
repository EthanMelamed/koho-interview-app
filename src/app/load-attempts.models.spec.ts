import { CustomerHistory, Day, LoadAttempt, Week } from "./load-attempts.models";

const DAYLENGTH = 24 * 60 * 60 * 1000;

describe('TimeBlock', () => {
    describe('test constructor()', () => {
        // write tests
    });
    describe('test hasInTimeRange()', () => {
        let now = new Date();
        let timeBlock = new Day({time: now});
        it('should return false if too far in the past', () => {
            expect(timeBlock.hasInTimeRange(new Date(now.getTime() - DAYLENGTH))).toBeFalse();
        });
        
        it('should return false if too far in the future', () => {
            expect(timeBlock.hasInTimeRange(new Date(now.getTime() + DAYLENGTH))).toBeFalse();
        });

        it('should return true when the date is in range', () => {
            const timeBlockStart = new Date(now);
            timeBlockStart.setUTCHours(0, 0, 0, 0);
            const timeBlockEnd = new Date(now);
            timeBlockEnd.setUTCHours(23, 59, 59, 999);

            expect(timeBlock.hasInTimeRange(now)).toBeTrue();
            expect(timeBlock.hasInTimeRange(timeBlockStart)).toBeTrue();
            expect(timeBlock.hasInTimeRange(timeBlockEnd)).toBeTrue();
        });
    });
});

describe('CustomerHistory', () => {
    describe('test constructor()', () => {
        it('should initialize loadAttempts and leave lastWeek undefined with no params', () => {
            const history = new CustomerHistory();
            expect(history.loadAttempts).toBeTruthy();
            expect(history.lastWeek).toBeFalsy();
        });
        it('should copy loadAttempts when they are passed in', () => {
            let now = new Date();
            const loadAttempt = new LoadAttempt({
                customer_id: '0',
                id: '0',
                load_amount: '$3000',
                load_amount_value: 5000,
                time: now
            });
            const loadAttempts =  new Map<string, LoadAttempt>();
            loadAttempts.set(loadAttempt.id, loadAttempt);
            const history = new CustomerHistory({loadAttempts});
            expect(history.loadAttempts.get(loadAttempt.id)).toBeTruthy();
        });
        it('should copy lastWeek when one is passed in', () => {
            const lastWeek = new Week({time: new Date()})
            const history = new CustomerHistory({lastWeek});
            expect(history.lastWeek).toBeTruthy();
        });
    });
    describe('test add()', () => {
        let now = new Date();
        const loadAttempt = new LoadAttempt({
            customer_id: '0',
            id: '0',
            load_amount: '$3000',
            load_amount_value: 5000,
            time: now
        });
        it('should return true if week is null', () => {
            const history = new CustomerHistory();
            expect(history.add(loadAttempt)).toBeTruthy();
        });

        it('should call Week.add() if week is not null', () => {
            const lastWeek = new Week({time: new Date()})
            const history = new CustomerHistory({lastWeek});
            spyOn(history.lastWeek as Week, 'add').and.returnValue(true);
            history.add(loadAttempt);
            expect((history.lastWeek as Week).add).toHaveBeenCalled();
        });

        it('should throw an error if the id was already used', () => {
            const loadAttempts =  new Map<string, LoadAttempt>();
            loadAttempts.set(loadAttempt.id, loadAttempt);
            const history = new CustomerHistory({loadAttempts});
            try {
                history.add(loadAttempt);
                fail();
            }
            catch (e) {
                expect(true).toBeTruthy();
            }
        });
    });
});

describe('Day', () => {
    describe('test constructor()', () => {
        // write tests
    });
    describe('test add()', () => {
        let now = new Date();
        const loadAttempt = new LoadAttempt({
            customer_id: '0',
            id: '0',
            load_amount: '$1',
            load_amount_value: 1,
            time: now
        });
        it('should return true and increment total if lastDay is null', () => {
            const day = new Day({time: now});
            expect(day.add(loadAttempt)).toBeTrue();
            expect(day.total).toBe(1);
        });

        it('should return false when monetary limit would be exceeded', () => {
            const day = new Day({time: now, total: 5000});
            expect(day.add(loadAttempt)).toBeFalse();
        });

        it('should return false when max number of loads would be exceeded', () => {
            const day = new Day({time: now, loadAttempts: 3});
            expect(day.add(loadAttempt)).toBeFalse();
        });

        it('should throw an error if the the loadAttempt is now in range', () => {
            const week = new Week({time: new Date(now.getTime() - (999 * DAYLENGTH))});
            try {
                week.add(loadAttempt);
                fail();
            }
            catch (e) {
                expect(true).toBeTruthy();
            }
        });
    });
    describe('test setTimeRange()', () => {
        // write tests
    });
});

describe('LoadAttempt', () => {
    describe('test constructor()', () => {
        // write tests
    });
});

describe('LoadAttemptResult', () => {
    describe('test constructor()', () => {
        // write tests
    });
});

describe('State', () => {
    describe('test constructor()', () => {
        // write tests
    });
    describe('test update()', () => {
        // write tests
    });
});

describe('Week', () => {
    describe('test constructor()', () => {
        // write tests
    });
    describe('test add()', () => {
        let now = new Date();
        const loadAttempt = new LoadAttempt({
            customer_id: '0',
            id: '0',
            load_amount: '$1',
            load_amount_value: 1,
            time: now
        });
        it('should return true and increment total if lastDay is null', () => {
            const week = new Week({time: now});
            expect(week.add(loadAttempt)).toBeTrue();
            expect(week.total).toBe(1);
        });

        it('should call Day.add() if lastDay is not null', () => {
            const week = new Week({time: now, lastDay: new Day({time: now})});
            spyOn(week.lastDay as Day, 'add').and.returnValue(true);
            week.add(loadAttempt);
            expect((week.lastDay as Day).add).toHaveBeenCalled();
        });

        it('should return false when limit is reached', () => {
            const week = new Week({time: now, lastDay: new Day({time: now}), total: 20000});
            expect(week.add(loadAttempt)).toBeFalse();
        });

        it('should throw an error if the the loadAttempt is now in range', () => {
            const week = new Week({time: new Date(now.getTime() - (999 * DAYLENGTH))});
            try {
                week.add(loadAttempt);
                fail();
            }
            catch (e) {
                expect(true).toBeTruthy();
            }
        });
    });
    describe('test hasInTimeRange()', () => {
        // write tests
    });
    describe('test setTimeRange()', () => {
        // write tests
    });
});
