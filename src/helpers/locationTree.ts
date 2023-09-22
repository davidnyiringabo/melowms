import { Item } from '../types';

export enum LocationName {
  ROOT = 'root',
  WAREHOUSE = 'warehouse',
  AREA = 'area',
  ROW = 'row',
  BAY = 'bay',
  LEVEL = 'level',
  POSITION = 'position',
}

export const DEFAULT_LAST_POSITION: LocationName = LocationName.BAY;

export type LocationMap = {
  [k in LocationName]: string;
};

export type ExportObject = {
  lpath: Partial<LocationMap>;
  level: LocationName;
  name: string;
  capacity: number;
  quantity: number;
  _path: string;
  children: ExportObject[];
  lastLevel: LocationName | null;
  lastLevelSet: boolean;
  _items: LItems;
};

export type LItems = Array<{
  item: string;
  quantity: number;
}>;

export type AvailableLocations = Array<{
  path: string;
  lpath: Partial<LocationMap>;
  name: string;
  capacity: number;
}>;

export type ImportObject = ExportObject;

export class LocationNode {
  _path: string = '';
  _lastLevel: LocationName | null = null;
  lastLevelSet: boolean = false;
  level: LocationName;
  _items: LItems = [];
  private _quantity: number = 0;
  children: LocationNode[];
  _name: string = '';
  _origName: string = '';
  parent: LocationNode | null = null;
  _capacity: number = 0;

  constructor({
    path,
    level,
    name,
    capacity = 0,
    quantity = 0,
  }: {
    path: string;
    level: LocationName;
    name: string;
    capacity?: number;
    quantity?: number;
  }) {
    this.level = level;
    this.name = name;
    this._origName = name;
    this._lastLevel = this._lastLevel || DEFAULT_LAST_POSITION;
    // this._path = path + `/${level}/` + this._name;
    this._path =
      level !== LocationName.ROOT
        ? path + `/${level}/` + this._name
        : `/${level}/${this.name}`;
    this._quantity = quantity;
    this._capacity = capacity;

    this.children = [];
  }

  get name() {
    return this._origName;
  }

  get items(): LItems {
    return this._items;
  }

  set items(itmz: LItems) {
    this._items.push(...itmz);
    this.quantity = this._items.reduce((p, c) => p + c.quantity, 0);
  }

  get lastLevel() {
    return this._lastLevel;
  }

  set lastLevel(last) {
    if (this.level === LocationName.ROOT) return;
    this._lastLevel = last;
    this.lastLevelSet = true;
    if (this.children.length === 0) return;
    this.children.forEach((child) => {
      child.lastLevel = last;
    });
  }

  set name(nm: string) {
    this._origName = nm;
    this._name = nm.toLowerCase().split(' ').join('_');
    const prevPath = this._path.split('/');
    prevPath.pop();
    prevPath.push(this.name);
    this._path = prevPath.join('/');
  }

  set quantity(qty: number) {
    const diff = qty - this._quantity;
    this._quantity = qty;
    if (this.parent) {
      this.parent.quantity = this.parent.quantity + diff;
    }
  }

  get quantity() {
    return this._quantity;
  }

  set capacity(newCapacity: number) {
    const diff = newCapacity - this._capacity;
    this._capacity = newCapacity;
    if (this.parent) {
      this.parent.capacity = this.parent.capacity + diff;
    }
  }

  get capacity() {
    return this._capacity;
  }

  get lpath(): Partial<LocationMap> {
    if (this._path.endsWith('/')) this._path = this._path.slice(0, -1);
    return this._path
      .split('/')
      .reduce<{ [k: string]: any }>((pre, curr, i, arr) => {
        if (i % 2 === 1) {
          pre[curr] = arr[i + 1] || '';
        }
        return pre;
      }, {});
  }

  static pathToObject(path: string): Partial<LocationMap> {
    if (path.endsWith('/')) path = path.slice(0, -1);
    return path.split('/').reduce<{ [k: string]: any }>((pre, curr, i, arr) => {
      if (i % 2 === 1) {
        pre[curr] = arr[i + 1] || '';
      }
      return pre;
    }, {});
  }

  getAction() {
    const nextLevel = this.getNextLevel();
    return nextLevel !== LocationName.ROOT ? `Add ${nextLevel}` : '';
  }

  getNextLevel() {
    switch (this.level) {
      case LocationName.ROOT:
        return LocationName.WAREHOUSE;
      case LocationName.WAREHOUSE:
        return LocationName.AREA;
      case LocationName.AREA:
        return LocationName.ROW;
      case LocationName.ROW:
        return LocationName.BAY;
      case LocationName.BAY:
        return LocationName.LEVEL;
      case LocationName.LEVEL:
        return LocationName.POSITION;
      case LocationName.POSITION:
        return null;
      default:
        return LocationName.ROOT;
    }
  }

  removeChild(name: string) {
    this.children = this.children.filter((n) => n.name != name);
  }

  remove() {
    this.parent?.removeChild(this.name);
  }

  addChild(name: string) {
    if (this.children.some((c) => c.name === name)) return;
    const nextLevel = this.getNextLevel();
    if (nextLevel == null) throw new Error('Non-existent location');
    const node = new LocationNode({
      path: this._path,
      level: nextLevel,
      name,
    });
    node.parent = this;
    if (this.level !== LocationName.ROOT) {
      node.lastLevel = this.lastLevel;
      node.lastLevelSet = this.lastLevelSet;
    }
    this.children.push(node);
    return node;
  }

  addChildNode(node: LocationNode): LocationNode | null {
    if (this.children.some((c) => c.name == node.name)) return null;
    node.parent = this;
    this.children.push(node);
    return node;
  }

  toObject(): ExportObject {
    const result = {
      quantity: this.quantity,
      capacity: this.capacity,
      level: this.level,
      name: this.name,
      _name: this._name,
      lpath: this.lpath,
      _path: this._path,
      lastLevel: this._lastLevel,
      lastLevelSet: this.lastLevelSet,
      children: [] as ExportObject[],
      _items: this._items,
    };

    result.children = this.children.map((ch) => ch.toObject());
    return result;
  }

  availableLocations = (): AvailableLocations => {
    const availableLocations: AvailableLocations = [];

    if (this.lastLevel === this.level) {
      return [
        {
          path: this._path,
          lpath: this.lpath,
          capacity: this.capacity - this.quantity,
          name: this.name,
        },
      ];
    }

    this.children.forEach((child) => {
      if (child.capacity - child.quantity > 0) {
        availableLocations.push(...child.availableLocations());
      }
    });

    if (availableLocations.length === 0) {
      return [];
    }

    return availableLocations;
  };

  static toNode(obj: ImportObject): LocationNode {
    const node = new LocationNode({
      path: obj._path,
      level: obj.level,
      name: obj.name,
      capacity: obj.capacity,
      quantity: obj.quantity,
    });
    // Reset the path
    node._path = obj._path;
    node._items = obj._items;
    if (obj.level !== LocationName.ROOT) {
      node.lastLevel = obj.lastLevel;
      node.lastLevelSet = obj.lastLevelSet;
    }

    obj.children.forEach((child) => {
      node.addChildNode(this.toNode(child));
    });
    return node;
  }

  findNodeByPath(path: Partial<LocationMap>): LocationNode | null {
    if (path[this.level] !== this._name) return null;

    if (
      this.lastLevel === this.level ||
      this.getNextLevel() == null ||
      typeof path[this.getNextLevel() as LocationName] !== 'string'
    ) {
      return this;
    }
    let result;
    this.children.forEach((ch) => (result = ch.findNodeByPath(path)));
    return result || null;
  }
}

export default class LocationTree {
  root: LocationNode;
  constructor() {
    this.root = new LocationNode({
      path: '',
      level: LocationName.ROOT,
      name: LocationName.ROOT,
    });
  }

  findNodeByPath(path: string): LocationNode | null {
    const lpath = LocationNode.pathToObject(path);
    return this.root.findNodeByPath(lpath);
  }

  storeItemsToPath(path: string, items: LItems): boolean {
    const node = this.findNodeByPath(path);
    const qtySum = items.reduce((p, c) => p + c.quantity, 0);
    if (node) {
      if (node.capacity < qtySum + node.quantity) {
        throw new Error(
          `The quantiy you're trying to save is more than the capacity at ${node.level} "${node.name}".`
        );
      }

      node.items = items;
      return true;
    }
    return false;
  }

  toObject() {
    return this.root.toObject();
  }

  static toTree = (obj: ImportObject): LocationTree => {
    const tree = new LocationTree();
    tree.root = LocationNode.toNode(obj);
    return tree;
  };

  availableLocations = (): AvailableLocations => {
    return this.root.availableLocations();
  };
}
