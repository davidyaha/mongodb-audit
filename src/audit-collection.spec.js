// @flow

const updateResult = {
  matchedCount: 1,
  modifiedCount: 1,
};

const Collection = () => ({
  collectionName: 'coll',
  insertOne: jest.fn(doc => Promise.resolve({ ops: [doc] })),
  insertMany: jest.fn(docs => Promise.resolve({ ops: docs })),
  updateOne: jest.fn(() => Promise.resolve(updateResult)),
  updateMany: jest.fn(() => Promise.resolve(updateResult)),
  deleteOne: jest.fn(() => Promise.resolve({ deletedCount: 1 })),
  deleteMany: jest.fn(() => Promise.resolve({ deletedCount: 1 })),
  find: jest.fn(),
  findOne: jest.fn(),
});

const successJournaler = jest.fn(() => Promise.resolve());
const createSuccessJournaler = jest.fn(() => successJournaler);
const journalerError = new Error('Failure');
const failureJournaler = jest.fn(() => Promise.reject(journalerError));
const createFailureJournaler = jest.fn(() => failureJournaler);


import { auditCollection, fileJournaler } from './index.js';

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

  it('should not halt on journaler error', async () => {
    global.console = {warn: jest.fn()};
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

  it('should tell you insert is not supported and do nothing')
  it('should tell you update is not supported and do nothing')
  it('should tell you remove is not supported and do nothing')

  describe('compact', () => { });
  describe('purge', () => { });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
