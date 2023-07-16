import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Backup {
  'add' : ActorMethod<[Uint8Array | number[]], undefined>,
  'finishBackup' : ActorMethod<[BackupId], undefined>,
  'getChunk' : ActorMethod<[bigint, bigint], [Chunk, boolean]>,
  'http_request' : ActorMethod<[HttpRequest], HttpResponse>,
  'startBackup' : ActorMethod<[string], BackupId>,
  'uploadChunk' : ActorMethod<[BackupId, Chunk], undefined>,
}
export type BackupId = bigint;
export type Chunk = Uint8Array | number[];
export type HeaderField = [string, string];
export interface HttpRequest {
  'url' : string,
  'method' : string,
  'body' : Uint8Array | number[],
  'headers' : Array<HeaderField>,
}
export interface HttpResponse {
  'body' : Uint8Array | number[],
  'headers' : Array<HeaderField>,
  'status_code' : number,
}
export interface _SERVICE extends Backup {}
