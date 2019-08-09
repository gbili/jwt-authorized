import 'dotenv/config';
import { expect } from 'chai';
import DiContainer from '../../src/DiContainer';
import logger from 'saylo';

let helloInjection = null;
class Hello {
  constructor(injection) {
    this.injection = injection;
  }
  static inject(injection) {
    helloInjection = injection;
  }
  static getInjection() {
    return helloInjection;
  }
}
class HelloDestructureConstructorParams {
  constructor(param1, param2, param3) {
    this.param1 = param1;
    this.param2 = param2;
    this.param3 = param2;
  }
}
const data = { a: 1, b: "2", c: Hello, };
const data2 = { a: 1, b: "2", c: Hello, };
const data3 = { a: 1, b: "2", c: Hello, };
const data3Values = Object.values(data3);
console.log('------------------------------------');
console.log(data3Values);
let afterWasExecuted = false;

const stall = async function(stallTime = 3000) {
  await new Promise(resolve => setTimeout(resolve, stallTime));
};

const injectionDict = {
  'Hello': {
    instance: Hello
  },
  'data': {
    instance: data,
    after: async ({me, serviceLocator, el}) => {
      await stall(200);
      afterWasExecuted = true;
    }
  },
  'HelloObjDestructurableParams': {
    constructible: HelloDestructureConstructorParams,
    deps: data2,
    destructureDeps: true,
  },
  'HelloArrayDestructurableParams': {
    constructible: HelloDestructureConstructorParams,
    deps: data3Values,
  },
  'emptyObject': {
    instance: {},
  },
  'logger': {
    instance: logger,
    after: async ({me, serviceLocator, el}) => {
      const data = await serviceLocator.get('data');
      serviceLocator.set('emptyObject', data);
    }
  },
  'HelloStaticInjectable': {
    injectable: Hello,
    deps: data,
    after: ({ me }) => (me.getInjection().d = 'd'),
  },
  'HelloConstructible': {
    constructible: Hello,
    deps: data,
    after: ({ me }) => (me.injection.e = 'e'),
  },
};

let bootstrapped = false;
describe(`DiContainer`, function() {

  before(async () => {
    bootstrapped = true;
  });

  it('bootstrapped properly', function () {
    expect(bootstrapped).to.be.equal(true);
  });

  describe(`DiContainer.getNthContainer(1)`, function() {
    it('should return an instance of DiContainer set at bootstrap', function() {
      const a = new DiContainer({ logger, load: injectionDict });
      new DiContainer({ logger, load: injectionDict });
      new DiContainer({ logger, load: injectionDict });
      expect(DiContainer.getNthContainer(1)).to.be.equal(DiContainer.getFirstContainer(1)).and.to.be.equal(a);
    });
  });

  describe(`DiContainer.getLatestContainer()`, function() {
    it('should return an instance of DiContainer set at bootstrap', function() {
      const d = new DiContainer({ logger, load: injectionDict });
      expect(DiContainer.getLatestContainer())
        .to.be.an.instanceof(DiContainer)
        .and.be.equal(d);
    });
  });

  describe(`di.loadAll()`, function() {
    it('should be able to load :instance', async function() {
      const di = new DiContainer({ logger, load: injectionDict });
      expect(di.has('Hello')).to.be.equal(false);
      await di.loadAll();
      expect(di.has('Hello')).to.be.equal(true);
    });

    it('should be able to load :instance and execute after', async function() {
      afterWasExecuted = false;
      const di = new DiContainer({ logger, load: injectionDict });
      expect(di.has('data')).to.be.equal(false);
      await di.loadAll();
      expect(di.has('data')).to.be.equal(true);
      expect(afterWasExecuted).to.be.equal(true);
    });

    it('should be able to load :instance and give access to serviceLocator in after callback', async function() {
      const di = new DiContainer({ logger, load: injectionDict });
      expect(di.has('emptyObject')).to.be.equal(false);
      await di.loadAll();
      const lo = await di.get('logger');
      const eo = await di.get('emptyObject');
      expect(eo).to.be.equal(data);
    });

    it('should be able to load :injectable', async function() {
      const di = new DiContainer({ logger, load: injectionDict });
      expect(di.has('HelloStaticInjectable')).to.be.equal(false);
      await di.loadAll();
      expect(di.has('HelloStaticInjectable')).to.be.equal(true);
      expect(Hello.getInjection().d).to.be.equal('d');
    });

    it('should be able to load :constructible', async function() {
      const di = new DiContainer({ logger, load: injectionDict });
      expect(di.has('HelloConstructible')).to.be.equal(false);
      await di.loadAll();
      expect(di.has('HelloConstructible')).to.be.equal(true);
      const e = (await di.get('HelloConstructible')).injection.e;
      expect(e).to.be.equal('e');
    });

    it('should be able to load :constructible', async function() {
      const di = new DiContainer({ logger, load: injectionDict });
      expect(di.has('HelloConstructible')).to.be.equal(false);
      await di.loadAll();
      expect(di.has('HelloConstructible')).to.be.equal(true);
      const e = (await di.get('HelloConstructible')).injection.e;
      expect(e).to.be.equal('e');
    });

    it('should be able to load :constructible', async function() {
      const di = new DiContainer({ logger, load: injectionDict });
      expect(di.has('HelloObjDestructurableParams')).to.be.equal(false);
      await di.loadAll();
      expect(di.has('HelloObjDestructurableParams')).to.be.equal(true);
      const aaa = await di.get('HelloObjDestructurableParams');
      expect(aaa.param1).to.be.equal(data2.a);
      expect(aaa.param2).to.be.equal(data2.b);
    });
    it('should be able to load :constructible', async function() {
      const di = new DiContainer({ logger, load: injectionDict });
      expect(di.has('HelloArrayDestructurableParams')).to.be.equal(false);
      await di.loadAll();
      expect(di.has('HelloArrayDestructurableParams')).to.be.equal(true);
      const aaa = await di.get('HelloArrayDestructurableParams');
      expect(aaa.param1).to.be.equal(data3.a);
      expect(aaa.param2).to.be.equal(data3.b);
    });
  });

  describe(`di.get()`, function() {
    it('should be able to get an async loaded entry', async function() {
      afterWasExecuted = false;
      const di = new DiContainer({ logger, load: injectionDict });
      expect(di.has('data')).to.be.equal(false);
      await di.loadAll();
      expect(await di.get('data')).to.be.equal(data);
      expect(afterWasExecuted).to.be.equal(true);
    });
  });

  describe(`di.set()`, function() {
    it('should be able to set a non existent entry', async function() {
      const di = new DiContainer({ logger, load: injectionDict });
      expect(di.has('data')).to.be.equal(false);
      const key = 'nonExistent';
      const value = 'nonExistentValue';
      di.set(key, value);
      expect(await di.get(key)).to.be.equal(value);
    });

    it('should be able to set an existent entry', async function() {
      const di = new DiContainer({ logger, load: injectionDict });
      await di.loadAll();
      const key = 'data';
      expect(di.has(key)).to.be.equal(true);
      const value = 'new value';
      di.set(key, value);
      expect(await di.get(key)).to.be.equal(value);
    });
  });

});
