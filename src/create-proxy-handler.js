// @flow

import type { Hook } from './index';

const defaultHook: Hook = () => Promise.resolve();


export const createProxyHandler = (methods: string[]) =>
  (beforeHook: Hook = defaultHook) =>
    (afterHook: Hook = defaultHook) => ({
      get(target: Object, property: string) {
        const member: Function = target[property];
        if (typeof member === 'function' && methods.includes(property)) {
          return async (...args: any[]) => {
            const hookResult = await beforeHook.apply(target, [property, ...args]);
            const result = await member.apply(target, args);
            await afterHook.call(target, property, result, hookResult);
            return result;
          }
        }
        return member;
      }
    });