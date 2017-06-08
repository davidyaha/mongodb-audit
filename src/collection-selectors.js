// @flow

export const methods = [
  'insertOne', 'insertMany', 'insert',
  'updateOne', 'updateMany', 'update',
  'deleteOne', 'deleteMany', 'remove',
  // 'findOne', 'find',
];

const actionsMap = {
  insert: 'insert',
  insertOne: 'insert',
  insertMany: 'insert',
  update: 'update',
  updateOne: 'update',
  updateMany: 'update',
  remove: 'delete',
  deleteOne: 'delete',
  deleteMany: 'delete',
  find: 'read',
  findOne: 'read',
};

const filterFunctions = arg => typeof arg !== 'function';

const argsSelectorMap = {
  insert: ([doc, options]) => [doc, options].filter(filterFunctions),
  insertOne: ([doc, options]) => [doc, options].filter(filterFunctions),
  insertMany: ([docs, options]) => [docs, options].filter(filterFunctions),
  update: ([filter, update, options]) => [filter, update, options].filter(filterFunctions),
  updateOne: ([filter, update, options]) => [filter, update, options].filter(filterFunctions),
  updateMany: ([filter, update, options]) => [filter, update, options].filter(filterFunctions),
  remove: ([filter, options]) => [filter, options].filter(filterFunctions),
  deleteOne: ([filter, options]) => [filter, options].filter(filterFunctions),
  deleteMany: ([filter, options]) => [filter, options].filter(filterFunctions),
  // find: ([selector, fields, options]) => [selector, fields, options].filter(filterFunctions),
  // findOne: ([selector, fields, options]) => [selector, fields, options].filter(filterFunctions),
};

const legacyUpdateResultSelector = (updateResult: Object) => {
  const upsertedCount = updateResult.result.upserted && updateResult.result.upserted.length;
  const upsertedId =
    updateResult.result.upserted &&
    updateResult.result.upserted[0] &&
    updateResult.result.upserted[0]._id;
  return {
    matchedCount: updateResult.result.n,
    modifiedCount: updateResult.result.n,
    upsertedCount,
    upsertedId,
  };
}

const updateResultSelector = (result: Object) => ({
  matchedCount: result.matchedCount,
  modifiedCount: result.modifiedCount,
  upsertedCount: result.upsertedCount,
  upsertedId: result.upsertedId,
});

const resultSelectorMap = {
  insert: (result: Object) => result.ops,
  insertOne: (result: Object) => result.ops[0],
  insertMany: (result: Object) => result.ops,
  update: legacyUpdateResultSelector,
  updateOne: updateResultSelector,
  updateMany: updateResultSelector,
  remove: ({ result: { n } }) => ({ deletedCount: n }),
  deleteOne: ({ deletedCount }) => ({ deletedCount }),
  deleteMany: ({ deletedCount }) => ({ deletedCount }),
  // find: (cursor: Cursor) => cursor,
  // findOne: (doc) => doc,
}

export const methodToAction = (methodName: string) => actionsMap[methodName];
export const methodToArgs = (methodName: string) => (args: any[]) => argsSelectorMap[methodName](args);
export const methodToResult = (methodName: string) => (result: Object) => resultSelectorMap[methodName](result);