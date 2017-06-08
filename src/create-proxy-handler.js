// @flow

import type { Hook } from './index';

const defaultHook: Hook = () => Promise.resolve();

const argsHasCallback = (args: any[]) => {
  if (args.length === 0) return false;
  const lastArg = args[args.length - 1];
  return typeof lastArg === 'function';
}

const getCallback = (args: any[]) => {
  if (argsHasCallback(args)) {
    return args[args.length - 1];
  }
  return null;
}

export const createProxyHandler = (methods: string[]) =>
  (beforeHook: Hook = defaultHook) =>
    (afterHook: Hook = defaultHook) => ({
      get(target: Object, property: string) {
        const member: Function = target[property];
        if (typeof member === 'function' && methods.includes(property)) {
          return async (...args: any[]) => {
            const cb = getCallback(args);
            const hookResult = await beforeHook.apply(target, [property, ...args]);
            
            if (cb) {
              const wrappedCallback = async (err, result) => {
                if (!err) {
                  await afterHook.call(target, property, result, hookResult);
                }
                cb(err, result);
              }
              const argsNoCallback = args.slice(0, args.length - 1);
              member.apply(target, [...argsNoCallback, wrappedCallback])
            } else {
              const result = await member.apply(target, args);
              await afterHook.call(target, property, result, hookResult);
              return result;
            }
          }
        }
        return member;
      }
    });
