// @flow

import { collectionJournaler } from '../src/journalers';
import type { Collection } from 'mongodb';

const journalingCollection: Collection = {
  insertOne: jest.fn(doc => Promise.resolve({ ops: [doc] })),
};

const error = new Error('Failed to insert collection');
const failingCollection: Collection = {
  insertOne: jest.fn(doc => Promise.reject(error)),
};

describe('collectionJournaler', () => {
  it('should insert to a mongo collection a new document for each record', async () => {
    const journaler = collectionJournaler(journalingCollection)('coll');
    const record = { rec: 'Cool record' };
    const success = await journaler(record);

    expect(success).toBe(true);
    expect(journalingCollection.insertOne).toBeCalledWith({ collectionName: 'coll', record: JSON.stringify(record) });
  });

  it('should catch thrown errors if ocour and warn about it', async () => {
    global.console = { warn: jest.fn() };
    const journaler = collectionJournaler(failingCollection)('coll');
    const record = { rec: 'Cool record' };
    const success = await journaler(record);

    expect(failingCollection.insertOne).toBeCalledWith({ collectionName: 'coll', record: JSON.stringify(record) });
    expect(success).toBe(false);
    expect(console.warn).toBeCalledWith('Could not insert to journaling collection coll due to error', error);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});