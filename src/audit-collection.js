// @flow

jest.mock('fs');

import { createProxyHandler } from './create-proxy-handler';
import { fileJournaler } from './journalers';
import { methods, methodToAction, methodToArgs, methodToResult } from './collection-selectors';

import type { Collection } from 'mongodb';
import type { Journaler, AuditConfiguration } from './index';

const proxy = (handler: Object) => (obj: Object) => new Proxy(obj, handler);

const beforeHook = (context?: Object) =>
  (methodName: string, ...methodArgs: any[]) => Promise.resolve({
    context,
    time: Date.now(),
    action: methodToAction(methodName),
    args: methodToArgs(methodName)(methodArgs),
  })

const afterHook = (journaler: Journaler) =>
  async function (methodName: string, methodResult: any, hookResult: any) {
    const journalerOfCollection = journaler(this.collectionName);
    const record = {
      ...hookResult,
      result: methodToResult(methodName)(methodResult),
    };
    try {
      await journalerOfCollection(record);
    } catch (e) {
      console.warn('Errored while calling journaler', e);
    }
  }

const mergeConfig = (suppliedConfig: AuditConfiguration = {}) => ({
  journaler: fileJournaler('./audit.txt'),
  ...suppliedConfig,
});

export const auditCollection = (config?: AuditConfiguration) =>
  (collection: Collection) =>
    (context?: Object) => {
      const configuration = mergeConfig(config);
      const beforeHookWithContext = beforeHook(context);
      const setHandlerBeforeHook = createProxyHandler(methods);
      const setHandlerAfterHook = setHandlerBeforeHook(beforeHookWithContext);
      const afterHookWithJournaler = afterHook(configuration.journaler);
      const handlerWithHooks = setHandlerAfterHook(afterHookWithJournaler);
      const proxyCollection = proxy(handlerWithHooks);
      return proxyCollection(collection);
    };