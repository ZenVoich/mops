import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Dependency { 'name' : PackageName, 'version' : string }
export type Err = string;
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
export interface PackageConfig__1 {
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
export interface PackageDetails {
  'owner' : Principal,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'config' : PackageConfig__1,
  'publication' : PackagePublication,
}
export type PackageName = string;
export type PackageName__1 = string;
export interface PackagePublication {
  'storage' : Principal,
  'time' : Time,
  'user' : Principal,
}
export type PublishingErr = string;
export type PublishingId = string;
export type Result = { 'ok' : null } |
  { 'err' : Err };
export type Result_1 = { 'ok' : PublishingId } |
  { 'err' : PublishingErr };
export interface Script { 'value' : string, 'name' : string }
export type StorageId = Principal;
export interface StorageStats {
  'fileCount' : bigint,
  'cyclesBalance' : bigint,
  'memorySize' : bigint,
}
export type Text = string;
export type Time = bigint;
export type Version = string;
export interface _SERVICE {
  'finishPublish' : ActorMethod<[PublishingId], Result>,
  'getApiVersion' : ActorMethod<[], Text>,
  'getFileIds' : ActorMethod<[PackageName__1, Version], Array<FileId>>,
  'getHighestVersion' : ActorMethod<[PackageName__1], Version>,
  'getPackageDetails' : ActorMethod<[PackageName__1, Version], PackageDetails>,
  'getRecentlyUpdatedPackages' : ActorMethod<[], Array<PackageDetails>>,
  'getStoragesStats' : ActorMethod<[], Array<[StorageId, StorageStats]>>,
  'notifyInstall' : ActorMethod<[PackageName__1, Version], undefined>,
  'search' : ActorMethod<[Text], Array<PackageDetails>>,
  'startPublish' : ActorMethod<[PackageConfig], Result_1>,
  'uploadFile' : ActorMethod<[PublishingId, Text, Array<number>], Result>,
}
