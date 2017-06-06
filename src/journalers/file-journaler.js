// @flow

import { appendFile } from 'fs';

const asyncWrite = async (path: string, data: Object) =>
  new Promise((resolve, reject) => {
    try {
      const stringified = JSON.stringify(data);
      appendFile(path, stringified, (e) => !e ? resolve() : reject(e))
    } catch (e) {
      reject(e);
    }
  });

export const fileJournaler = (path: string) =>
  (collectionName: string) =>
    (record: Object) => asyncWrite(path, record)
      .then(() => true)
      .catch(e => {
        console.warn(`Could not write to file due to error`, e);
        return false;
      });