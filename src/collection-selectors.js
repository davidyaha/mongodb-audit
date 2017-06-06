// @flow

export const methods = ['insertOne', 'insertMany', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'findOne', 'find'];

const actionsMap = {
  insertOne: 'insert',
  insertMany: 'insert',
  updateOne: 'update',
  updateMany: 'update',
  deleteOne: 'delete',
  deleteMany: 'delete',
  find: 'read',
  findOne: 'read',
};

const argsSelectorMap = {
  insertOne: ([doc, options]) => [doc, options],
  insertMany: ([docs, options]) => [docs, options],
  updateOne: ([filter, update, options]) => [filter, update, options],
  updateMany: ([filter, update, options]) => [filter, update, options],
  deleteOne: ([filter, options]) => [filter, options],
  deleteMany: ([filter, options]) => [filter, options],
  // find: ,
  // findOne: ,
};

const updateResultSelector = (result: Object) => ({
  matchedCount: result.matchedCount,
  modifiedCount: result.modifiedCount,
  upsertedCount: result.upsertedCount,
  upsertedId: result.upsertedId,
});

const resultSelectorMap = {
  insertOne: (result: Object) => result.ops[0],
  insertMany: (result: Object) => result.ops,
  updateOne: updateResultSelector,
  updateMany: updateResultSelector,
  deleteOne: ({ deletedCount }) => ({ deletedCount }),
  deleteMany: ({ deletedCount }) => ({ deletedCount }),
  // find: ,
  // findOne: ,
}

export const methodToAction = (methodName: string) => actionsMap[methodName];
export const methodToArgs = (methodName: string) => (args: any[]) => argsSelectorMap[methodName](args);
export const methodToResult = (methodName: string) => (result: Object) => resultSelectorMap[methodName](result);