"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
let _diContainers = [];
let _logger = {
  debug() {}

};

class DiContainer {
  constructor({
    logger,
    load
  }) {
    this.logger = logger || _logger;
    this.locatorRefDict = {};
    this.loadDict = load || {};

    _diContainers.push(this);
  }

  async loadAll(injectionDict) {
    injectionDict = injectionDict || {};
    this.loadDict = { ...this.loadDict,
      ...injectionDict
    };

    for (let refName in this.loadDict) {
      this.logger.debug('loading :', refName);

      try {
        await this.load(refName);
      } catch (err) {
        this.logger.debug(`DiContainer:loadAll(${refName}):load error occured in .load()`, err);
      }
    }
  }

  async deepLocateDeps(locateDeps) {
    this.logger.debug(`+++++++DiContainer:deepLocateDeps(locateDeps):locateDeps begin: `, locateDeps);
    const deps = Array.isArray() && [] || {};

    for (let key in locateDeps) {
      const depNameOrNested = locateDeps[key];
      this.logger.debug(`DiContainer:deepLocateDeps(locateDeps): inside for key: `, key, ' depNameOrNested : ', depNameOrNested);

      try {
        let dep = typeof depNameOrNested !== 'string' ? await this.deepLocateDeps(depNameOrNested) : await this.get(depNameOrNested);
        this.logger.debug(`DiContainer:deepLocateDeps(locateDeps): inside for key: `, key, ' resolved dep : ', dep);
        deps[key] = dep;
      } catch (err) {
        this.logger.debug(`DiContainer:deepLocateDeps(${depName}):locateDeps error occured in .get()`, err);
      }

      this.logger.debug(`DiContainer:deepLocateDeps(locateDeps): inside for key: `, key, ' resolved DEPS : ', deps[key]);
    }

    this.logger.debug(`========DiContainer:deepLocateDeps(locateDeps): END:  resolved DEPS : `, deps);
    return deps;
  }

  mergeObjects(a, b) {
    if (Array.isArray(a) || Array.isArray(b) || typeof a === 'string' || typeof b === 'string' || typeof a === 'function' || typeof b === 'function') {
      return [a, b];
    }

    const bCopy = { ...b
    };
    const keysIntersection = [];
    const bComplement = {};

    for (let key in a) {
      if (b.hasOwnProperty(key)) {
        keysIntersection.push(key);
      } else {
        bComplement[key] = a[key];
      }
    }

    for (let key of keysIntersection) {
      bCopy[key] = this.mergeObjects(a[key], b[key]);
    }

    const merged = { ...bComplement,
      ...bCopy
    };
    return merged;
  }

  async load(refName) {
    this.logger.debug('DiContainer:Loading: ', refName);

    if (this.has(refName)) {
      this.logger.debug('DiContainer:Already loaded: ', refName);
      return;
    }

    if (!this.loadDict.hasOwnProperty(refName)) {
      throw new Error('DiContainer:load() attempting to load inexistent ref', refName);
    }

    const el = this.loadDict[refName];
    let me = null;
    let {
      destructureDeps
    } = el;
    let locateDeps = null;
    let providedDeps = null;

    if (el.hasOwnProperty('deps')) {
      providedDeps = el.deps;
      destructureDeps = destructureDeps || Array.isArray(providedDeps);
    }

    if (el.hasOwnProperty('locateDeps')) {
      this.logger.debug('----------->---->------------------------- LOCATE DEP -----------', refName);
      locateDeps = await this.deepLocateDeps(el.locateDeps);
      this.logger.debug('-----------<----<------------------------- LOCATE DEP END-----------', refName);
      destructureDeps = destructureDeps || Array.isArray(locateDeps);
    }

    let deps = null;

    if (destructureDeps) {
      if (!Array.isArray(providedDeps)) {
        providedDeps = providedDeps && Object.values(providedDeps) || [];
      }

      if (!Array.isArray(locateDeps)) {
        locateDeps = locateDeps && Object.values(locateDeps) || [];
      }

      deps = [...locateDeps, ...providedDeps];
    } else {
      deps = this.mergeObjects(locateDeps || {}, providedDeps || {});
    }

    if (el.hasOwnProperty('injectable')) {
      try {
        await el.injectable.inject(deps);
      } catch (err) {
        this.logger.debug(`DiContainer:load(${refName}):inject error occured in .inject()`, err);
      }

      me = el.injectable;
    }

    if (el.hasOwnProperty('constructible')) {
      if (destructureDeps) {
        me = new el.constructible(...deps);
      } else if (Object.keys(deps).length) {
        me = new el.constructible(deps);
      } else {
        me = new el.constructible();
      }
    }

    if (el.hasOwnProperty('instance')) {
      me = el.instance;
    }

    if (el.hasOwnProperty('after')) {
      try {
        await el.after({
          me,
          serviceLocator: this,
          el,
          deps
        });
      } catch (err) {
        this.logger.debug(`DiContainer:load(${refName}):after error occured in .after()`, err);
      }
    }

    this.set(refName, me);
  }

  async get(refName) {
    this.isValidRefNameOrThrow(refName);

    if (!this.has(refName)) {
      if (!this.loadDict.hasOwnProperty(refName)) {
        throw new Error(`Trying to access inexistent ref: ${refName} available refs are: ${Object.keys(this.locatorRefDict).join('\n')}`);
      }

      try {
        await this.load(refName);
      } catch (err) {
        this.logger.debug(`DiContainer:get(${refName}):load error occured in .load()`, err);
      }
    }

    return this.locatorRefDict[refName];
  }

  set(refName, val) {
    this.isValidRefNameOrThrow(refName);

    if (this.has(refName)) {
      this.logger.debug('Replacing existent ref: ', refName);
    }

    this.locatorRefDict[refName] = val;
    return val;
  }

  has(refName) {
    this.isValidRefNameOrThrow(refName);
    this.logger.debug('DiContainer:has(', refName, ')', Object.keys(this.locatorRefDict));
    return this.locatorRefDict.hasOwnProperty(refName);
  }

  isValidRefNameOrThrow(refName) {
    if (typeof refName !== 'string') {
      throw new Error('Can only reference locatables by strings: ', refName);
    }
  }

  static inject({
    logger
  }) {
    _logger = logger;
  }

  static getLatestContainer() {
    return DiContainer.getNthContainer(_diContainers.length);
  }

  static getFirstContainer() {
    return DiContainer.getNthContainer(1);
  }

  static getNthContainer(n) {
    if (!(n > 0 && _diContainers.length >= n)) {
      throw new Error('Out of range');
    }

    return _diContainers[n - 1];
  }

}

var _default = DiContainer;
exports.default = _default;