// @flow

export { auditCollection } from './audit-collection'
export { fileJournaler } from './journalers';

export type Hook = (...args: any[]) => Promise<any>;

export type Action = 'insert' | 'update' | 'delete' | 'read';

export type Journaler = (collectionName: string) => (record: Object) => Promise<boolean>;

export type AuditConfiguration = {
  journaler?: Journaler,
}
