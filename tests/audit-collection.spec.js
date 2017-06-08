// @flow

import 'babel-polyfill';
import { auditCollection, fileJournaler } from '../src';

const updateResult = {
  matchedCount: 1,
  modifiedCount: 1,
};

const legacyResult = {
  result: {
    n: 1,
  }
};

const foundDoc = { field: 'cool doc' };
const cursor = { fetch: () => Promise.resolve([foundDoc]) };

const Collection = function () {
  this.collectionName = 'coll';
};

Object.assign(Collection.prototype, {
  insertOne: jest.fn(doc => Promise.resolve({ ops: [doc] })),
  insertMany: jest.fn(docs => Promise.resolve({ ops: docs })),
  insert: jest.fn((docs, cb) => cb ? cb(null, { ops: docs }) : Promise.resolve({ ops: docs })),
  updateOne: jest.fn(() => Promise.resolve(updateResult)),
  updateMany: jest.fn(() => Promise.resolve(updateResult)),
  update: jest.fn(() => Promise.resolve(legacyResult)),
  deleteOne: jest.fn(() => Promise.resolve({ deletedCount: 1 })),
  deleteMany: jest.fn(() => Promise.resolve({ deletedCount: 1 })),
  remove: jest.fn(() => Promise.resolve(legacyResult)),
  find: jest.fn(() => cursor),
  findOne: jest.fn(() => Promise.resolve(foundDoc)),
});

const successJournaler = jest.fn(() => Promise.resolve());
const createSuccessJournaler = jest.fn(() => successJournaler);
const journalerError = new Error('Failure');
const failureJournaler = jest.fn(() => Promise.reject(journalerError));
const createFailureJournaler = jest.fn(() => failureJournaler);

jest.mock('fs');

const configuredProxyCollection = auditCollection({
  journaler: createSuccessJournaler,
});

const collection = new Collection();

const user = {
  _id: 'the1',
  name: 'neo',
  role: 'whatever',
};

describe('auditCollection', () => {
  it('should get a mongodb Collection instance and return a proxied collection', () => {
    const proxiedCollection = auditCollection()(collection)();
    expect(proxiedCollection).toBeDefined();
  });

  it('should allow setting journaler', () => {
    const configuredProxyCollection = auditCollection({
      journaler: fileJournaler('/dev/null'),
    });

    const proxiedCollection = auditCollection(collection)();
    expect(proxiedCollection).toBeDefined();
  });

  it('should record insertOne using the given journaler', async () => {
    const proxiedCollection = configuredProxyCollection(collection)();
    const doc = { field: 'cool doc' };

    await proxiedCollection.insertOne(doc);
    expect(collection.insertOne).toBeCalledWith(doc);
    expect(createSuccessJournaler).toBeCalledWith('coll');

    const record = successJournaler.mock.calls[0][0];
    expect(record).toHaveProperty('action', 'insert');
    expect(record).toHaveProperty('result', doc);
    expect(record).toHaveProperty('args', [doc, undefined]);
  });

  it('should allow addition of context to be recorded as well', async () => {
    const setContext = configuredProxyCollection(collection);
    const proxiedCollection = setContext({ user });
    const doc = { field: 'cool doc' };

    await proxiedCollection.insertOne(doc);
    expect(collection.insertOne).toBeCalledWith(doc);
    expect(createSuccessJournaler).toBeCalledWith('coll');

    const record = successJournaler.mock.calls[0][0];
    expect(record).toHaveProperty('action', 'insert');
    expect(record).toHaveProperty('result', doc);
    expect(record).toHaveProperty('args', [doc, undefined]);
    expect(record).toHaveProperty('context', { user });
  });

  it('should record insertMany using the given journaler', async () => {
    const proxiedCollection = configuredProxyCollection(collection)();
    const doc = { field: 'cool doc' };

    await proxiedCollection.insertMany([doc]);
    expect(collection.insertMany).toBeCalledWith([doc]);
    expect(createSuccessJournaler).toBeCalledWith('coll');

    const record = successJournaler.mock.calls[0][0];
    expect(record).toHaveProperty('action', 'insert');
    expect(record).toHaveProperty('result', [doc]);
    expect(record).toHaveProperty('args', [[doc], undefined]);
  });

  it('should record legacy insert', async () => {
    const proxiedCollection = configuredProxyCollection(collection)();
    const doc = { field: 'cool doc' };

    await proxiedCollection.insert([doc]);
    expect(collection.insert).toBeCalledWith([doc]);
    expect(createSuccessJournaler).toBeCalledWith('coll');

    const record = successJournaler.mock.calls[0][0];
    expect(record).toHaveProperty('action', 'insert');
    expect(record).toHaveProperty('result', [doc]);
    expect(record).toHaveProperty('args', [[doc], undefined]);
  });  
  
  it('should record legacy insert with callback', (done) => {
    const proxiedCollection = configuredProxyCollection(collection)();
    const doc = { field: 'cool doc' };

    proxiedCollection.insert([doc], (err, res) => {
      expect(collection.insert).toBeCalled();
      expect(createSuccessJournaler).toBeCalledWith('coll');

      const record = successJournaler.mock.calls[0][0];
      expect(record).toHaveProperty('action', 'insert');
      expect(record).toHaveProperty('result', [doc]);
      expect(record).toHaveProperty('args', [[doc]]);
      done();
    });
  });  

  it('should record updateOne using the given journaler', async () => {
    const proxiedCollection = configuredProxyCollection(collection)();
    const selector = { id: 1 };
    const modifier = { $set: { field: 'not so cool doc' } };

    await proxiedCollection.updateOne(selector, modifier);
    expect(collection.updateOne).toBeCalledWith(selector, modifier);
    expect(createSuccessJournaler).toBeCalledWith('coll');

    const record = successJournaler.mock.calls[0][0];
    expect(record).toHaveProperty('action', 'update');
    expect(record).toHaveProperty('result', updateResult);
    expect(record).toHaveProperty('args', [selector, modifier, undefined]);
  });

  it('should record updateMany using the given journaler', async () => {
    const proxiedCollection = configuredProxyCollection(collection)();
    const selector = {};
    const modifier = { $set: { field: 'not so cool doc' } };

    await proxiedCollection.updateMany(selector, modifier);
    expect(collection.updateMany).toBeCalledWith(selector, modifier);
    expect(createSuccessJournaler).toBeCalledWith('coll');

    const record = successJournaler.mock.calls[0][0];
    expect(record).toHaveProperty('action', 'update');
    expect(record).toHaveProperty('result', updateResult);
    expect(record).toHaveProperty('args', [selector, modifier, undefined]);
  });

  it('should record legacy update using the given journaler', async () => {
    const proxiedCollection = configuredProxyCollection(collection)();
    const selector = {};
    const modifier = { $set: { field: 'not so cool doc' } };

    await proxiedCollection.update(selector, modifier);
    expect(collection.update).toBeCalledWith(selector, modifier);
    expect(createSuccessJournaler).toBeCalledWith('coll');

    const record = successJournaler.mock.calls[0][0];
    expect(record).toHaveProperty('action', 'update');
    expect(record).toHaveProperty('result', updateResult);
    expect(record).toHaveProperty('args', [selector, modifier, undefined]);
  });

  it('should record deleteOne using the given journaler', async () => {
    const proxiedCollection = configuredProxyCollection(collection)();
    const selector = { id: 1 };

    await proxiedCollection.deleteOne(selector);
    expect(collection.deleteOne).toBeCalledWith(selector);
    expect(createSuccessJournaler).toBeCalledWith('coll');

    const record = successJournaler.mock.calls[0][0];
    expect(record).toHaveProperty('action', 'delete');
    expect(record).toHaveProperty('result', { deletedCount: 1 });
    expect(record).toHaveProperty('args', [selector, undefined]);
  });

  it('should record deleteMany using the given journaler', async () => {
    const proxiedCollection = configuredProxyCollection(collection)();
    const selector = {};

    await proxiedCollection.deleteMany(selector);
    expect(collection.deleteMany).toBeCalledWith(selector);
    expect(createSuccessJournaler).toBeCalledWith('coll');

    const record = successJournaler.mock.calls[0][0];
    expect(record).toHaveProperty('action', 'delete');
    expect(record).toHaveProperty('result', { deletedCount: 1 });
    expect(record).toHaveProperty('args', [selector, undefined]);
  });

  it('should record legacy remove using the given journaler', async () => {
    const proxiedCollection = configuredProxyCollection(collection)();
    const selector = {};

    await proxiedCollection.remove(selector);
    expect(collection.remove).toBeCalledWith(selector);
    expect(createSuccessJournaler).toBeCalledWith('coll');

    const record = successJournaler.mock.calls[0][0];
    expect(record).toHaveProperty('action', 'delete');
    expect(record).toHaveProperty('result', { deletedCount: 1 });
    expect(record).toHaveProperty('args', [selector, undefined]);
  });  

  it('should record find using the given journaler', async () => {
    const proxiedCollection = configuredProxyCollection(collection)();
    const selector = { _id: 1 };

    const found = await proxiedCollection.find(selector).fetch();
    expect(collection.find).toBeCalledWith(selector);
  });

  it('should not halt on journaler error', async () => {
    global.console = { warn: jest.fn() };
    const configuredProxyCollection = auditCollection({
      journaler: createFailureJournaler,
    });
    const proxiedCollection = configuredProxyCollection(collection)();
    const selector = { id: 1 };

    const result = await proxiedCollection.deleteOne(selector);
    expect(collection.deleteOne).toBeCalledWith(selector);
    expect(createFailureJournaler).toBeCalledWith('coll');
    expect(failureJournaler).toBeCalled();
    expect(console.warn).toBeCalledWith('Errored while calling journaler', journalerError);
    expect(result).toHaveProperty('deletedCount', 1);
  });

  describe('compact', () => { });
  describe('purge', () => { });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
