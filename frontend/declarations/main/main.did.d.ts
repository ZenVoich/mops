import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

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
  'scripts' : Array<Script>,
  'documentation' : string,
  'name' : PackageName,
  'homepage' : string,
  'description' : string,
  'version' : string,
  'keywords' : Array<string>,
  'donation' : string,
  'repository' : string,
  'dependencies' : Array<Dependency>,
  'license' : string,
  'readme' : string,
}
export type PackageName = string;
export type PackageName__1 = string;
export interface PackageSummary {
  'dfx' : string,
  'moc' : string,
  'scripts' : Array<Script>,
  'owner' : Principal,
  'documentation' : string,
  'name' : PackageName,
  'homepage' : string,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'description' : string,
  'version' : string,
  'keywords' : Array<string>,
  'donation' : string,
  'updatedAt' : Time,
  'repository' : string,
  'dependencies' : Array<Dependency>,
  'license' : string,
  'readme' : string,
}
export type PublishingErr = string;
export type PublishingId = string;
export type Result = { 'ok' : null } |
  { 'err' : Err };
export type Result_1 = { 'ok' : PublishingId } |
  { 'err' : PublishingErr };
export interface Script { 'value' : string, 'name' : string }
export type Text = string;
export type Time = bigint;
export type Version = string;
export interface _SERVICE {
  'finishPublish' : ActorMethod<[PublishingId], Result>,
  'getApiVersion' : ActorMethod<[], Text>,
  'getConfig' : ActorMethod<[PackageName__1, Version], PackageConfig>,
  'getFile' : ActorMethod<[FileId], File>,
  'getFileIds' : ActorMethod<[PackageName__1, Version], Array<FileId>>,
  'getMaxVersion' : ActorMethod<[PackageName__1], Version>,
  'getPackageSummary' : ActorMethod<[PackageName__1, Version], PackageSummary>,
  'getReadmeFile' : ActorMethod<[PackageName__1, Version], File>,
  'getRecentlyUpdatedPackages' : ActorMethod<[], Array<PackageSummary>>,
  'notifyInstall' : ActorMethod<[PackageName__1, Version], undefined>,
  'search' : ActorMethod<[Text], Array<PackageSummary>>,
  'startPublish' : ActorMethod<[PackageConfig], Result_1>,
  'uploadFile' : ActorMethod<[PublishingId, Text, Array<number>], Result>,
}
