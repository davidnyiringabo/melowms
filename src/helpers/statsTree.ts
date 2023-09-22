import moment from 'moment';

export type StatsEntry = {
  sales: number;
  stock: number;
  purchase: number;
  accepted: number;
  sVAT: number;
  pVAT: number;
  expenses: number;
  transfered: number;
  date: Date;
};

export type EntryType = keyof Omit<StatsEntry, 'date'>;

export enum StatsLevel {
  Root = 'Root',
  Year = 'Year',
  Month = 'Month',
  Week = 'Week',
  Day = 'Day',
}

const nextStatLevels: { [k in StatsLevel]: StatsLevel | null } = {
  Root: StatsLevel.Year,
  Year: StatsLevel.Month,
  Month: StatsLevel.Week,
  Week: StatsLevel.Day,
  Day: null,
};

export type ExportStats = {
  children: { [k: string]: ExportStats };
  _stats: StatsEntry;
  _level: StatsLevel;
  _sDate: Date;
};

export class StatNode {
  private _stats: StatsEntry = {
    purchase: 0,
    stock: 0,
    accepted: 0,
    sales: 0,
    sVAT: 0,
    expenses: 0,
    pVAT: 0,
    date: new Date(),
    transfered: 0,
  };
  private _level: StatsLevel = StatsLevel.Root;
  private _sDate: Date = new Date();

  children: Map<string, StatNode> = new Map();

  constructor(level: StatsLevel, sDate?: Date) {
    this.level = level;
    this._sDate = sDate ?? this._sDate;
  }

  get stats() {
    return this._stats;
  }
  get startDate() {
    return this._sDate;
  }
  get level() {
    return this._level;
  }
  get nextLevel(): StatsLevel | null {
    return nextStatLevels[this.level];
  }

  set startDate(sDate: Date) {
    this._sDate = sDate;
  }
  set stats(stats: StatsEntry) {
    this.onlyStats = stats;
    this.updateChildStats(stats);
  }

  set onlyStats(stats: StatsEntry) {
    this._stats.purchase += stats.purchase ?? 0;
    this._stats.sales += stats.sales ?? 0;
    this._stats.stock += stats.stock ?? 0;
    this._stats.accepted += stats.accepted ?? 0;
    this._stats.transfered += stats.transfered ?? 0;
    this._stats.pVAT += stats.pVAT ?? 0;
    this._stats.sVAT += stats.sVAT ?? 0;
    this._stats.expenses += stats.expenses;
    this._stats.date = new Date(stats.date);
  }

  set level(level: StatsLevel) {
    this._level = level;
  }

  private updateChildStats(stats: StatsEntry) {
    const nextChild = this.getNextChildByDate(new Date(stats.date));
    if (!nextChild) return;
    nextChild.stats = stats;
  }

  get endDate() {
    const d = moment(this.startDate);
    switch (this.level) {
      case StatsLevel.Root:
        return new Date('2100');
      case StatsLevel.Year:
        return d.endOf('year').toDate();
      case StatsLevel.Month:
        return d.endOf('month').toDate();
      case StatsLevel.Week:
        return d.endOf('isoWeek').toDate();
      case StatsLevel.Day:
        return d.endOf('day').toDate();
    }
  }

  getData(entryType: EntryType): number[] {
    const date = this.startDate;
    let result: number[] = [];

    switch (this.level) {
      case StatsLevel.Root:
        for (const node of this.children.values()) {
          const value = (
            this.getNextChildByDate(node.startDate, true) as StatNode
          ).stats[entryType];
          result.push(value);
        }
        break;
      case StatsLevel.Year:
        result = getMonthsInYear(date.getFullYear()).map(
          (date) =>
            (this.getNextChildByDate(date, true) as StatNode).stats[entryType]
        );
        break;
      case StatsLevel.Month:
        result = getWeeksInMonth(new Date(date)).map(
          (date, i) =>
            (this.getNextChildByDate(date, true) as StatNode).stats[entryType]
        );
        break;
      case StatsLevel.Week:
        result = getDaysInWeek(date).map(
          (date) =>
            (this.getNextChildByDate(date, true) as StatNode).stats[entryType]
        );
        break;
      default:
        return [];
    }
    return result;
  }

  getCategories(): string[] {
    const date = this.startDate;
    let result: string[] = [];

    switch (this.level) {
      case StatsLevel.Root:
        for (const node of this.children.values()) {
          result.push(node.startDate.getFullYear().toString());
        }
        break;
      case StatsLevel.Year:
        result = getMonthsInYear(date.getFullYear()).map((date) =>
          date.toLocaleString('default', { month: 'short' })
        );
        break;
      case StatsLevel.Month:
        result = getWeeksInMonth(date).map((date, i) =>
          moment(date).get('isoWeek').toString()
        );
        break;
      case StatsLevel.Week:
        result = getDaysInWeek(date).map((date) =>
          date.toLocaleString('en-US', { weekday: 'short' })
        );
        break;
      default:
        return [];
    }
    return result;
  }

  getNextChildByDate(date: Date, autoCreate = true) {
    const node = this;
    if (node.nextLevel == null) return null;

    const key = StatsTree.getNextLevelKeyByDate(node.level, date) as string;
    if (!key || !node.children.has(key)) {
      if (!autoCreate) return null;

      node.children.set(
        key,
        new StatNode(
          node.nextLevel,
          StatsTree.getNextLevelStartDate(node.level, new Date(date)) as Date
        )
      );
    }

    return node.children.get(key) as StatNode;
  }

  toObj() {
    const obj: ExportStats = {
      children: {},
      _sDate: this.startDate,
      _level: this.level,
      _stats: this.stats,
    };

    for (const [k, node] of this.children.entries()) {
      obj.children[k] = node.toObj();
    }
    return obj;
  }

  static fromObj(obj: ExportStats) {
    if (typeof (obj._sDate as any).toDate === 'function') {
      obj._sDate = (obj._sDate as any).toDate() as Date;
    }
    if (typeof (obj._stats.date as any).toDate === 'function') {
      obj._stats.date = (obj._stats.date as any).toDate() as Date;
    }

    const node = new StatNode(obj._level);
    node.onlyStats = obj._stats;
    node.startDate = new Date(obj._sDate);

    for (const [k, o] of Object.entries(obj.children)) {
      node.children.set(k, StatNode.fromObj(o));
    }
    return node;
  }
}

export default class StatsTree {
  private root: StatNode = new StatNode(StatsLevel.Root, new Date(0));

  constructor(root?: StatNode) {
    if (root) {
      this.root = root;
      this.root.startDate = new Date(0);
    }
  }

  get rootStats() {
    return this.root.stats;
  }

  getDataUntil(
    node: StatNode,
    entry: EntryType,
    level: StatsLevel = StatsLevel.Day
  ) {
    const allDays = this.getAllData(true, level, node.endDate);
    return allDays.reduce((acc, curr) => acc + curr.stats[entry], 0);
  }

  toObj() {
    return this.root.toObj();
  }

  static fromObj(obj: ExportStats): StatsTree {
    const rootNode = StatNode.fromObj(obj);
    const tree = new StatsTree(rootNode);
    return tree;
  }

  static getNextLevelStartDate(level: StatsLevel, date: Date): Date | null {
    let result: Date;

    switch (level) {
      case StatsLevel.Root:
        result = moment(date).startOf('year').toDate();
        break;
      case StatsLevel.Year:
        result = moment(date).startOf('month').toDate();
        break;
      case StatsLevel.Month:
        result = moment(date).startOf('isoWeek').toDate();
        break;
      case StatsLevel.Week:
        result = moment(date).startOf('day').toDate();
        break;
      default:
        return null;
    }

    return result;
  }

  static getNextLevelKeyByDate(level: StatsLevel, date: Date) {
    let result = '';

    const momentDate = moment(date);

    switch (level) {
      case 'Root':
        result = momentDate.format('YYYY');
        break;
      case 'Year':
        result = momentDate.format('M');
        break;
      case 'Month':
        result = momentDate.isoWeek().toString();
        break;
      case 'Week':
        result = momentDate.format('d');
        break;
      default:
        return null;
    }

    return result;
  }

  findStatsByDateRange(startDate: Date, endDate: Date, level?: StatsLevel) {
    const results = [];
    const queue = [];
    queue.push(this.root);

    while (queue.length > 0) {
      const current = queue.shift() as StatNode;
      if (current.startDate >= startDate && current.stats.date <= endDate) {
        if (level && current.level === level) {
          results.push(current);
          continue;
        }
        results.push(current);
      } else {
        continue;
      }
      queue.push(...current.children.values());
    }

    return results;
  }

  findStatsByDate(date: Date, level: StatsLevel, autoCreate?: boolean) {
    let current: StatNode | null = this.root;
    while (current && current.level !== level) {
      current = current.getNextChildByDate(date, autoCreate);
    }
    return current;
  }

  getAllData(sort: boolean = false, level?: StatsLevel, until?: Date) {
    const result = [];
    const stack = [this.root];
    while (stack.length !== 0) {
      const current = stack.pop() as StatNode;

      if (until && current.startDate > until) {
        continue;
      }

      if (level) {
        if (current.level === level) result.push(current);
      } else {
        result.push(current);
      }
      stack.push(...current.children.values());
    }
    return !sort
      ? result
      : result.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  addStats(stats: StatsEntry) {
    this.root.stats = stats;
  }
}

export function getWeeksInMonth(initialDate: Date): Date[] {
  const firstDay = moment(initialDate).startOf('month');
  const lastDay = moment(initialDate).endOf('month');
  let weeks: Date[] = [];

  let currentDay = firstDay.clone();
  while (currentDay.isSameOrBefore(lastDay, 'day')) {
    weeks.push(currentDay.toDate());
    currentDay.add(1, 'week');
  }

  return weeks;
}

export function getDaysInWeek(date: Date): Date[] {
  const days: Date[] = [];
  const monday = moment(date).startOf('isoWeek');

  for (let i = 0; i < 7; i++) {
    const currentDate = monday.clone().add(i, 'day').toDate();
    days.push(currentDate);
  }
  return days;
}

export function getMonthsInYear(year: number): Date[] {
  const months: Date[] = [];

  for (let month = 0; month < 12; month++) {
    const currentDate = moment({ year, month }).toDate();
    months.push(currentDate);
  }

  return months;
}
