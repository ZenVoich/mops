import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type Access = { 'readOnly' : null } |
  { 'readWrite' : null };
export interface Dependency { 'name' : PackageName, 'version' : string }
export type Err = string;
export interface File {
  'id' : FileId,
  'content' : Array<number>,
  'path' : Text,
}
export type FileId = string;
export interface PackageConfig {
  'dfx' : string,
  'moc' : string,
  'files' : Array<string>,
  'permissions' : Array<Permission>,
  'documentation' : string,
  'name' : PackageName,
  'homepage' : string,
  'description' : string,
  'author' : Principal,
  'version' : string,
  'keywords' : Array<string>,
  'donation' : string,
  'isPrivate' : boolean,
  'repository' : string,
  'dependencies' : Array<Dependency>,
  'license' : string,
  'readme' : string,
}
export type PackageName = string;
export type PackageName__1 = string;
export interface PackageSummary {
  'name' : PackageName,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'description' : string,
  'version' : string,
  'keywords' : Array<string>,
  'updatedAt' : Time,
}
export interface Permission { 'access' : Access, 'user' : Principal }
export type PublishingErr = string;
export type PublishingId = string;
export type Result = { 'ok' : null } |
  { 'err' : Err };
export type Result_1 = { 'ok' : PublishingId } |
  { 'err' : PublishingErr };
export type Text = string;
export type Time = bigint;
export type Version = string;
export interface _SERVICE {
  'finishPublish' : ActorMethod<[PublishingId], Result>,
  'getConfig' : ActorMethod<[PackageName__1, Version], PackageConfig>,
  'getFile' : ActorMethod<[FileId], File>,
  'getFileIds' : ActorMethod<[PackageName__1, Version], Array<FileId>>,
  'getLastConfig' : ActorMethod<[PackageName__1], PackageConfig>,
  'getLastVersion' : ActorMethod<[PackageName__1], Version>,
  'getReadmeFile' : ActorMethod<[PackageName__1, Version], File>,
  'notifyInstall' : ActorMethod<[PackageName__1, Version], undefined>,
  'search' : ActorMethod<[Text], Array<PackageSummary>>,
  'startPublish' : ActorMethod<[PackageConfig], Result_1>,
  'test' : ActorMethod<[], string>,
  'uploadFile' : ActorMethod<[PublishingId, Text, Array<number>], Result>,
  'whoami' : ActorMethod<[], Text>,
}
