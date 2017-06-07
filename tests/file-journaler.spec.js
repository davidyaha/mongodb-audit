// @flow

jest.mock('fs');

import { fileJournaler } from '../src/journalers';
import fs from 'fs';

describe('fileJournaler', () => {
  it('should allow setting file path for journaler', async () => {
    const setCollectionName = fileJournaler('/dev/null');
    const configured = setCollectionName('coll');
    await configured({ rec: 'This record is cool!' });
    expect(fs.__mockedFile[0]).toHaveProperty('path', '/dev/null');
  });

  it('should append records to the given file', async () => {
    const setCollectionName = fileJournaler('/dev/null');
    const configured = setCollectionName('coll');
    const record = { rec: 'This record is cool!' };
    const success = await configured(record);
    expect(success).toBe(true);
    expect(fs.__mockedFile[0]).toHaveProperty('data', JSON.stringify(record));
  });

  it('should warn if failed to write but return false', async () => {
    global.console = { warn: jest.fn() };
    const setCollectionName = fileJournaler('fail');
    const configured = setCollectionName('coll');
    const record = { rec: 'This record is cool!' };
    const success = await configured(record);
    expect(success).toBe(false);
    expect(console.warn).toBeCalledWith('Could not write to file due to error', fs.__mockedError);
  });

  it('should warn if failed to parse record but return false', async () => {
    const error = new Error();
    global.JSON = {stringify: jest.fn(() => {throw error})};
    global.console = { warn: jest.fn() };
    const setCollectionName = fileJournaler('fail');
    const configured = setCollectionName('coll');
    const record = { rec: 'This record is cool!' };
    const success = await configured(record);
    expect(success).toBe(false);
    expect(console.warn).toBeCalledWith('Could not write to file due to error', error);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});