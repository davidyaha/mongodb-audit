// @flow

import { createProxyHandler } from '../src/create-proxy-handler';

const objectToProxy = {
  foo: jest.fn(),
  bar: jest.fn(),
};

const mockedHook = jest.fn(() => Promise.resolve());

describe('createProxyHandler', () => {
  it('should wrap provided methods list only', () => {
     const handler = createProxyHandler(['foo'])()();

     expect(handler).toHaveProperty('get');
     expect(handler.get(objectToProxy, 'foo')).not.toBe(objectToProxy.foo);
     expect(handler.get(objectToProxy, 'bar')).toBe(objectToProxy.bar);
  });

  it('should call before and after hook for wrapped methods', async () => {
    const handler = createProxyHandler(['foo'])(mockedHook)(mockedHook);
    const wrapped = handler.get(objectToProxy, 'foo');
    const result = await wrapped();
    expect(mockedHook).toHaveBeenCalledTimes(2);
    expect(objectToProxy.foo).toBeCalled();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});