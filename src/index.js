// @flow
import 'babel-polyfill';

export * from './audit-collection'
export * from './journalers';

export type Hook = (...args: any[]) => Promise<any>;

export type Action = 'insert' | 'update' | 'delete' | 'read';

export type Journaler = (collectionName: string) => (record: Object) => Promise<boolean>;

export type AuditConfiguration = {
  journaler?: Journaler,
}
