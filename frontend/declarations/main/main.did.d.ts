import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface DependencyV2 {
  'name' : PackageName,
  'repo' : string,
  'version' : string,
}
export interface DownloadsSnapshot {
  'startTime' : Time,
  'endTime' : Time,
  'downloads' : bigint,
}
export interface DownloadsSnapshot__1 {
  'startTime' : Time,
  'endTime' : Time,
  'downloads' : bigint,
}
export type Err = string;
export type FileId = string;
export interface PackageConfigV2 {
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
  'devDependencies' : Array<DependencyV2>,
  'repository' : string,
  'dependencies' : Array<DependencyV2>,
  'license' : string,
  'readme' : string,
}
export interface PackageConfigV2__1 {
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
  'devDependencies' : Array<DependencyV2>,
  'repository' : string,
  'dependencies' : Array<DependencyV2>,
  'license' : string,
  'readme' : string,
}
export interface PackageDetails {
  'owner' : Principal,
  'deps' : Array<PackageSummary__1>,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'downloadTrend' : Array<DownloadsSnapshot>,
  'versionHistory' : Array<PackageSummary__1>,
  'dependents' : Array<PackageSummary__1>,
  'devDeps' : Array<PackageSummary__1>,
  'downloadsInLast7Days' : bigint,
  'config' : PackageConfigV2__1,
  'publication' : PackagePublication,
}
export type PackageId = string;
export type PackageName = string;
export type PackageName__1 = string;
export interface PackagePublication {
  'storage' : Principal,
  'time' : Time,
  'user' : Principal,
}
export interface PackageSummary {
  'owner' : Principal,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'downloadsInLast7Days' : bigint,
  'config' : PackageConfigV2__1,
  'publication' : PackagePublication,
}
export interface PackageSummary__1 {
  'owner' : Principal,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'downloadsInLast7Days' : bigint,
  'config' : PackageConfigV2__1,
  'publication' : PackagePublication,
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
export type Version = string;
export interface _SERVICE {
  'finishPublish' : ActorMethod<[PublishingId], Result>,
  'getApiVersion' : ActorMethod<[], Text>,
  'getDefaultPackages' : ActorMethod<
    [string],
    Array<[PackageName__1, Version]>
  >,
  'getDownloadTrendByPackageId' : ActorMethod<
    [PackageId],
    Array<DownloadsSnapshot__1>
  >,
  'getDownloadTrendByPackageName' : ActorMethod<
    [PackageName__1],
    Array<DownloadsSnapshot__1>
  >,
  'getFileIds' : ActorMethod<[PackageName__1, Ver], Result_5>,
  'getHighestVersion' : ActorMethod<[PackageName__1], Result_4>,
  'getMostDownloadedPackages' : ActorMethod<[], Array<PackageSummary>>,
  'getMostDownloadedPackagesIn7Days' : ActorMethod<[], Array<PackageSummary>>,
  'getPackageDetails' : ActorMethod<[PackageName__1, Ver], Result_3>,
  'getRecentlyUpdatedPackages' : ActorMethod<[], Array<PackageSummary>>,
  'getStoragesStats' : ActorMethod<[], Array<[StorageId, StorageStats]>>,
  'getTotalDownloads' : ActorMethod<[], bigint>,
  'getTotalPackages' : ActorMethod<[], bigint>,
  'notifyInstall' : ActorMethod<[PackageName__1, Ver], undefined>,
  'search' : ActorMethod<[Text], Array<PackageSummary>>,
  'startFileUpload' : ActorMethod<
    [PublishingId, Text, bigint, Uint8Array | number[]],
    Result_2
  >,
  'startPublish' : ActorMethod<[PackageConfigV2], Result_1>,
  'uploadFileChunk' : ActorMethod<
    [PublishingId, FileId, bigint, Uint8Array | number[]],
    Result
  >,
}
