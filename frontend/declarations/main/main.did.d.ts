import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface DepChange {
  'oldVersion' : string,
  'name' : string,
  'newVersion' : string,
}
export interface DependencyV2 {
  'name' : PackageName__1,
  'repo' : string,
  'version' : string,
}
export type DepsStatus = { 'allLatest' : null } |
  { 'tooOld' : null } |
  { 'updatesAvailable' : null };
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
export type Header = [string, string];
export interface HttpHeader { 'value' : string, 'name' : string }
export interface HttpResponse {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<HttpHeader>,
}
export interface Main {
  'backup' : ActorMethod<[], undefined>,
  'computeHashesForExistingFiles' : ActorMethod<[], undefined>,
  'finishPublish' : ActorMethod<[PublishingId], Result>,
  'getApiVersion' : ActorMethod<[], Text>,
  'getBackupCanisterId' : ActorMethod<[], Principal>,
  'getDefaultPackages' : ActorMethod<
    [string],
    Array<[PackageName, PackageVersion]>
  >,
  'getDownloadTrendByPackageId' : ActorMethod<
    [PackageId],
    Array<DownloadsSnapshot__1>
  >,
  'getDownloadTrendByPackageName' : ActorMethod<
    [PackageName],
    Array<DownloadsSnapshot__1>
  >,
  'getFileHashes' : ActorMethod<[PackageName, PackageVersion], Result_8>,
  'getFileHashesByPackageIds' : ActorMethod<
    [Array<PackageId>],
    Array<[PackageId, Array<[FileId, Uint8Array | number[]]>]>
  >,
  'getFileIds' : ActorMethod<[PackageName, PackageVersion], Result_7>,
  'getHighestSemverBatch' : ActorMethod<
    [Array<[PackageName, PackageVersion, SemverPart]>],
    Result_6
  >,
  'getHighestVersion' : ActorMethod<[PackageName], Result_5>,
  'getMostDownloadedPackages' : ActorMethod<[], Array<PackageSummary>>,
  'getMostDownloadedPackagesIn7Days' : ActorMethod<[], Array<PackageSummary>>,
  'getNewPackages' : ActorMethod<[], Array<PackageSummary>>,
  'getPackageDetails' : ActorMethod<[PackageName, PackageVersion], Result_4>,
  'getPackagesByCategory' : ActorMethod<
    [],
    Array<[string, Array<PackageSummary>]>
  >,
  'getRecentlyUpdatedPackages' : ActorMethod<
    [],
    Array<PackageSummaryWithChanges>
  >,
  'getStoragesStats' : ActorMethod<[], Array<[StorageId, StorageStats]>>,
  'getTotalDownloads' : ActorMethod<[], bigint>,
  'getTotalPackages' : ActorMethod<[], bigint>,
  'getUser' : ActorMethod<[Principal], [] | [User__1]>,
  'http_request' : ActorMethod<[Request], Response>,
  'notifyInstall' : ActorMethod<[PackageName, PackageVersion], undefined>,
  'notifyInstalls' : ActorMethod<
    [Array<[PackageName, PackageVersion]>],
    undefined
  >,
  'restore' : ActorMethod<[bigint, bigint], undefined>,
  'search' : ActorMethod<
    [Text, [] | [bigint], [] | [bigint]],
    [Array<PackageSummary>, PageCount]
  >,
  'setUserProp' : ActorMethod<[string, string], Result_1>,
  'startFileUpload' : ActorMethod<
    [PublishingId, Text, bigint, Uint8Array | number[]],
    Result_3
  >,
  'startPublish' : ActorMethod<[PackageConfigV2], Result_2>,
  'transferOwnership' : ActorMethod<[PackageName, Principal], Result_1>,
  'transformRequest' : ActorMethod<[TransformArg], HttpResponse>,
  'uploadFileChunk' : ActorMethod<
    [PublishingId, FileId, bigint, Uint8Array | number[]],
    Result
  >,
  'uploadNotes' : ActorMethod<[PublishingId, string], Result>,
  'uploadTestStats' : ActorMethod<[PublishingId, TestStats], Result>,
}
export interface PackageChanges {
  'tests' : TestsChanges,
  'deps' : Array<DepChange>,
  'notes' : string,
  'devDeps' : Array<DepChange>,
}
export interface PackageConfigV2 {
  'dfx' : string,
  'moc' : string,
  'scripts' : Array<Script>,
  'baseDir' : string,
  'documentation' : string,
  'name' : PackageName__1,
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
  'name' : PackageName__1,
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
  'ownerInfo' : User,
  'owner' : Principal,
  'deps' : Array<PackageSummary__1>,
  'quality' : PackageQuality,
  'testStats' : TestStats__1,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'downloadTrend' : Array<DownloadsSnapshot>,
  'fileStats' : PackageFileStatsPublic,
  'versionHistory' : Array<PackageSummaryWithChanges__1>,
  'dependents' : Array<PackageSummary__1>,
  'devDeps' : Array<PackageSummary__1>,
  'downloadsInLast7Days' : bigint,
  'config' : PackageConfigV2__1,
  'changes' : PackageChanges,
  'publication' : PackagePublication,
}
export interface PackageFileStatsPublic {
  'sourceFiles' : bigint,
  'sourceSize' : bigint,
}
export type PackageId = string;
export type PackageName = string;
export type PackageName__1 = string;
export interface PackagePublication {
  'storage' : Principal,
  'time' : Time,
  'user' : Principal,
}
export interface PackageQuality {
  'depsStatus' : DepsStatus,
  'hasDescription' : boolean,
  'hasKeywords' : boolean,
  'hasLicense' : boolean,
  'hasDocumentation' : boolean,
  'hasTests' : boolean,
  'hasRepository' : boolean,
  'hasReleaseNotes' : boolean,
}
export interface PackageSummary {
  'ownerInfo' : User,
  'owner' : Principal,
  'quality' : PackageQuality,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'downloadsInLast7Days' : bigint,
  'config' : PackageConfigV2__1,
  'publication' : PackagePublication,
}
export interface PackageSummaryWithChanges {
  'ownerInfo' : User,
  'owner' : Principal,
  'quality' : PackageQuality,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'downloadsInLast7Days' : bigint,
  'config' : PackageConfigV2__1,
  'changes' : PackageChanges,
  'publication' : PackagePublication,
}
export interface PackageSummaryWithChanges__1 {
  'ownerInfo' : User,
  'owner' : Principal,
  'quality' : PackageQuality,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'downloadsInLast7Days' : bigint,
  'config' : PackageConfigV2__1,
  'changes' : PackageChanges,
  'publication' : PackagePublication,
}
export interface PackageSummary__1 {
  'ownerInfo' : User,
  'owner' : Principal,
  'quality' : PackageQuality,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'downloadsInLast7Days' : bigint,
  'config' : PackageConfigV2__1,
  'publication' : PackagePublication,
}
export type PackageVersion = string;
export type PageCount = bigint;
export type PublishingId = string;
export interface Request {
  'url' : string,
  'method' : string,
  'body' : Uint8Array | number[],
  'headers' : Array<Header>,
  'certificate_version' : [] | [number],
}
export interface Response {
  'body' : Uint8Array | number[],
  'headers' : Array<Header>,
  'upgrade' : [] | [boolean],
  'streaming_strategy' : [] | [StreamingStrategy],
  'status_code' : number,
}
export type Result = { 'ok' : null } |
  { 'err' : Err };
export type Result_1 = { 'ok' : null } |
  { 'err' : string };
export type Result_2 = { 'ok' : PublishingId } |
  { 'err' : Err };
export type Result_3 = { 'ok' : FileId } |
  { 'err' : Err };
export type Result_4 = { 'ok' : PackageDetails } |
  { 'err' : Err };
export type Result_5 = { 'ok' : PackageVersion } |
  { 'err' : Err };
export type Result_6 = { 'ok' : Array<[PackageName, PackageVersion]> } |
  { 'err' : Err };
export type Result_7 = { 'ok' : Array<FileId> } |
  { 'err' : Err };
export type Result_8 = { 'ok' : Array<[FileId, Uint8Array | number[]]> } |
  { 'err' : Err };
export interface Script { 'value' : string, 'name' : string }
export type SemverPart = { 'major' : null } |
  { 'minor' : null } |
  { 'patch' : null };
export type StorageId = Principal;
export interface StorageStats {
  'fileCount' : bigint,
  'cyclesBalance' : bigint,
  'memorySize' : bigint,
}
export type StreamingCallback = ActorMethod<
  [StreamingToken],
  [] | [StreamingCallbackResponse]
>;
export interface StreamingCallbackResponse {
  'token' : [] | [StreamingToken],
  'body' : Uint8Array | number[],
}
export type StreamingStrategy = {
    'Callback' : { 'token' : StreamingToken, 'callback' : StreamingCallback }
  };
export type StreamingToken = Uint8Array | number[];
export interface TestStats { 'passedNames' : Array<string>, 'passed' : bigint }
export interface TestStats__1 {
  'passedNames' : Array<string>,
  'passed' : bigint,
}
export interface TestsChanges {
  'addedNames' : Array<string>,
  'removedNames' : Array<string>,
}
export type Text = string;
export type Time = bigint;
export interface TransformArg {
  'context' : Uint8Array | number[],
  'response' : HttpResponse,
}
export interface User {
  'id' : Principal,
  'emailVerified' : boolean,
  'twitter' : string,
  'displayName' : string,
  'name' : string,
  'site' : string,
  'email' : string,
  'twitterVerified' : boolean,
  'githubVerified' : boolean,
  'github' : string,
}
export interface User__1 {
  'id' : Principal,
  'emailVerified' : boolean,
  'twitter' : string,
  'displayName' : string,
  'name' : string,
  'site' : string,
  'email' : string,
  'twitterVerified' : boolean,
  'githubVerified' : boolean,
  'github' : string,
}
export interface _SERVICE extends Main {}
