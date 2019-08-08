let _diContainers = [];
let _logger = (() => {});
class DiContainer {

  constructor({ logger, load }) {
    this.logger = logger || _logger;
    this.locatorRefDict = {};
    this.loadDict = load || {};
    _diContainers.push(this);
  }

  async loadAll(injectionDict) {
    injectionDict = injectionDict || {};
    this.loadDict = { ...this.loadDict, ...injectionDict };
    for (let refName in this.loadDict) {
      this.logger.log('loading :', refName);
      try {
        await this.load(refName);
      } catch (err) {
        this.logger.log(`DiContainer:loadAll(${refName}):load error occured in .load()`, err);
      }
    }
  }

  async load(refName) {
    this.logger.log('DiContainer:Loading: ', refName);
    if (this.has(refName)) {
      this.logger.log('DiContainer:Already loaded: ', refName);
      return;
    }
    if (!this.loadDict.hasOwnProperty(refName)) {
      throw new Error('DiContainer:load() attempting to load inexistent ref', refName);
    }
    const el = this.loadDict[refName];
    let me = null;

    let locateDeps = {};
    let providedDeps = {};
    if (el.hasOwnProperty('deps')) {
      providedDeps = el.deps;
    }
    if (el.hasOwnProperty('locateDeps')) {
      for (let key in el.locateDeps) {
        const depName = el.locateDeps[key];
        try {
          el.locateDeps[key] = await this.get(depName);
        } catch (err) {
          this.logger.log(`DiContainer:load(${depName}):locateDeps error occured in .get()`, err);
        }
      }
      locateDeps = el.locateDeps;
    }
    const deps = {
      ...locateDeps,
      ...providedDeps,
    };

    if (el.hasOwnProperty('injectable')) {
      try {
        await el.injectable.inject(deps)
      } catch (err) {
        this.logger.log(`DiContainer:load(${refName}):inject error occured in .inject()`, err);
      }
      me = el.injectable;
    }
    if (el.hasOwnProperty('constructible')) {
      el.constructed = Object.keys(deps).length ? new el.constructible(deps) : new el.constructible();
      me = el.constructed;
    }
    if (el.hasOwnProperty('instance')) {
      me = el.instance;
    }
    if (el.hasOwnProperty('after')) {
      try {
        await el.after({ me, serviceLocator: this, el });
      } catch (err) {
        this.logger.log(`DiContainer:load(${refName}):after error occured in .after()`, err);
      }
    }
    this.set(refName, me);
  }

  async get(refName) {
    if (!this.has(refName)) {
      if (!this.loadDict.hasOwnProperty(refName)) {
        throw new Error(`Trying to access inexistent ref: ${refName} available refs are: ${Object.keys(this.locatorRefDict).join('\n')}`);
      }
      try {
        await this.load(refName);
      } catch (err) {
        this.logger.log(`DiContainer:get(${refName}):load error occured in .load()`, err);
      }
    }
    return this.locatorRefDict[refName];
  }

  set(refName, val) {
    if (this.has(refName)) {
      this.logger.log('Replacing existent ref: ', refName);
    }
    this.locatorRefDict[refName] = val;
    return val;
  }

  has(refName) {
    this.logger.log('DiContainer:has(', refName, ')', Object.keys(this.locatorRefDict));
    return this.locatorRefDict.hasOwnProperty(refName);
  }

  static inject({ logger }) {
    _logger = logger;
  }

  static getLatestContainer() {
    return DiContainer.getNthContainer(_diContainers.length);
  }

  static getFirstContainer() {
    return DiContainer.getNthContainer(1);
  }

  static getNthContainer(n) {
    if (!(n > 0 && (_diContainers.length >= n))) {
      throw new Error('Out of range');
    }
    return _diContainers[n-1];
  }

}

export default DiContainer;
