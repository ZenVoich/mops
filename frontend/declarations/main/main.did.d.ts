import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Dependency { 'name' : PackageName, 'version' : string }
export type Err = string;
export type FileId = string;
export interface PackageConfig {
  'dfx' : string,
  'moc' : string,
  'scripts' : Array<Script>,
  'baseDir' : string,
  'documentation' : string,
  'name' : PackageName,
  'homepage' : string,
  'description' : string,
  'version' : string,
  'keywords' : Array<string>,
  'donation' : string,
  'devDependencies' : Array<Dependency>,
  'repository' : string,
  'dependencies' : Array<Dependency>,
  'license' : string,
  'readme' : string,
}
export interface PackageConfig__1 {
  'dfx' : string,
  'moc' : string,
  'scripts' : Array<Script>,
  'baseDir' : string,
  'documentation' : string,
  'name' : PackageName,
  'homepage' : string,
  'description' : string,
  'version' : string,
  'keywords' : Array<string>,
  'donation' : string,
  'devDependencies' : Array<Dependency>,
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
export type Result_2 = { 'ok' : FileId } |
  { 'err' : Err };
export type Result_3 = { 'ok' : PackageDetails } |
  { 'err' : Err };
export type Result_4 = { 'ok' : Ver } |
  { 'err' : Err };
export type Result_5 = { 'ok' : Array<FileId> } |
  { 'err' : Err };
export interface Script { 'value' : string, 'name' : string }
export type StorageId = Principal;
export interface StorageStats {
  'fileCount' : bigint,
  'cyclesBalance' : bigint,
  'memorySize' : bigint,
}
export type Text = string;
export type Time = bigint;
export type Ver = string;
export interface _SERVICE {
  'finishPublish' : ActorMethod<[PublishingId], Result>,
  'getApiVersion' : ActorMethod<[], Text>,
  'getFileIds' : ActorMethod<[PackageName__1, Ver], Result_5>,
  'getHighestVersion' : ActorMethod<[PackageName__1], Result_4>,
  'getMostDownloadedPackages' : ActorMethod<[], Array<PackageDetails>>,
  'getPackageDetails' : ActorMethod<[PackageName__1, Ver], Result_3>,
  'getRecentlyUpdatedPackages' : ActorMethod<[], Array<PackageDetails>>,
  'getStoragesStats' : ActorMethod<[], Array<[StorageId, StorageStats]>>,
  'getTotalDownloads' : ActorMethod<[], bigint>,
  'getTotalPackages' : ActorMethod<[], bigint>,
  'notifyInstall' : ActorMethod<[PackageName__1, Ver], undefined>,
  'search' : ActorMethod<[Text], Array<PackageDetails>>,
  'startFileUpload' : ActorMethod<
    [PublishingId, Text, bigint, Uint8Array],
    Result_2,
  >,
  'startPublish' : ActorMethod<[PackageConfig], Result_1>,
  'uploadFileChunk' : ActorMethod<
    [PublishingId, FileId, bigint, Uint8Array],
    Result,
  >,
}
