// @flow

import type { Collection } from 'mongodb';

export const collectionJournaler = (journalingCollection: Collection) =>
  (collectionName: string) =>
    (record: Object) => Promise.resolve()
      .then(() => journalingCollection.insertOne({ collectionName, record }))
      .then(() => true)
      .catch(e => {
        console.warn(`Could not insert to journaling collection ${collectionName} due to error`, e);
        return false;
      });