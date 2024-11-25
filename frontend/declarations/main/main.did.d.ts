import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Benchmark {
  'gc' : string,
  'metrics' : Array<[BenchmarkMetric, Array<Array<bigint>>]>,
  'cols' : Array<string>,
  'file' : string,
  'name' : string,
  'rows' : Array<string>,
  'description' : string,
  'compilerVersion' : string,
  'compiler' : string,
  'replica' : string,
  'replicaVersion' : string,
  'forceGC' : boolean,
}
export type BenchmarkMetric = string;
export type Benchmarks = Array<Benchmark>;
export type Benchmarks__1 = Array<Benchmark>;
export interface DepChange {
  'oldVersion' : string,
  'name' : string,
  'newVersion' : string,
}
export interface DependencyV2 {
  'name' : PackageName,
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
export interface HttpTransformArg {
  'context' : Uint8Array | number[],
  'response' : HttpResponse,
}
export interface Main {
  'addMaintainer' : ActorMethod<[PackageName__1, Principal], Result_3>,
  'addOwner' : ActorMethod<[PackageName__1, Principal], Result_3>,
  'backup' : ActorMethod<[], undefined>,
  'computeHashesForExistingFiles' : ActorMethod<[], undefined>,
  'finishPublish' : ActorMethod<[PublishingId], Result>,
  'getApiVersion' : ActorMethod<[], Text>,
  'getBackupCanisterId' : ActorMethod<[], Principal>,
  'getDefaultPackages' : ActorMethod<
    [string],
    Array<[PackageName__1, PackageVersion__1]>
  >,
  'getDownloadTrendByPackageId' : ActorMethod<
    [PackageId],
    Array<DownloadsSnapshot__1>
  >,
  'getDownloadTrendByPackageName' : ActorMethod<
    [PackageName__1],
    Array<DownloadsSnapshot__1>
  >,
  'getFileHashes' : ActorMethod<[PackageName__1, PackageVersion__1], Result_8>,
  'getFileHashesByPackageIds' : ActorMethod<
    [Array<PackageId>],
    Array<[PackageId, Array<[FileId, Uint8Array | number[]]>]>
  >,
  'getFileHashesQuery' : ActorMethod<
    [PackageName__1, PackageVersion__1],
    Result_8
  >,
  'getFileIds' : ActorMethod<[PackageName__1, PackageVersion__1], Result_7>,
  'getHighestSemverBatch' : ActorMethod<
    [Array<[PackageName__1, PackageVersion__1, SemverPart]>],
    Result_6
  >,
  'getHighestVersion' : ActorMethod<[PackageName__1], Result_5>,
  'getMostDownloadedPackages' : ActorMethod<[], Array<PackageSummary>>,
  'getMostDownloadedPackagesIn7Days' : ActorMethod<[], Array<PackageSummary>>,
  'getNewPackages' : ActorMethod<[], Array<PackageSummary>>,
  'getPackageDetails' : ActorMethod<
    [PackageName__1, PackageVersion__1],
    Result_4
  >,
  'getPackageMaintainers' : ActorMethod<[PackageName__1], Array<Principal>>,
  'getPackageOwners' : ActorMethod<[PackageName__1], Array<Principal>>,
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
  'notifyInstall' : ActorMethod<[PackageName__1, PackageVersion__1], undefined>,
  'notifyInstalls' : ActorMethod<
    [Array<[PackageName__1, PackageVersion__1]>],
    undefined
  >,
  'removeMaintainer' : ActorMethod<[PackageName__1, Principal], Result_3>,
  'removeOwner' : ActorMethod<[PackageName__1, Principal], Result_3>,
  'restore' : ActorMethod<[bigint], undefined>,
  'search' : ActorMethod<
    [Text, [] | [bigint], [] | [bigint]],
    [Array<PackageSummary>, PageCount]
  >,
  'setUserProp' : ActorMethod<[string, string], Result_3>,
  'startFileUpload' : ActorMethod<
    [PublishingId, Text, bigint, Uint8Array | number[]],
    Result_2
  >,
  'startPublish' : ActorMethod<[PackageConfigV3_Publishing], Result_1>,
  'transformRequest' : ActorMethod<[HttpTransformArg], HttpResponse>,
  'uploadBenchmarks' : ActorMethod<[PublishingId, Benchmarks], Result>,
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
  'curBenchmarks' : Benchmarks__1,
  'prevBenchmarks' : Benchmarks__1,
  'notes' : string,
  'devDeps' : Array<DepChange>,
}
export interface PackageConfigV3 {
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
  'requirements' : Array<Requirement>,
  'license' : string,
  'readme' : string,
}
export interface PackageConfigV3_Publishing {
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
  'requirements' : [] | [Array<Requirement>],
  'license' : string,
  'readme' : string,
}
export interface PackageDetails {
  'benchmarks' : Benchmarks__1,
  'ownerInfo' : User,
  'owners' : Array<User>,
  'maintainers' : Array<User>,
  'owner' : Principal,
  'depAlias' : string,
  'deps' : Array<PackageSummary__1>,
  'quality' : PackageQuality,
  'publisher' : User,
  'testStats' : TestStats__1,
  'highestVersion' : PackageVersion,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'downloadTrend' : Array<DownloadsSnapshot>,
  'fileStats' : PackageFileStatsPublic,
  'versionHistory' : Array<PackageSummaryWithChanges__1>,
  'dependents' : Array<PackageSummary__1>,
  'devDeps' : Array<PackageSummary__1>,
  'downloadsInLast7Days' : bigint,
  'config' : PackageConfigV3,
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
  'owners' : Array<User>,
  'maintainers' : Array<User>,
  'owner' : Principal,
  'depAlias' : string,
  'quality' : PackageQuality,
  'publisher' : User,
  'highestVersion' : PackageVersion,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'downloadsInLast7Days' : bigint,
  'config' : PackageConfigV3,
  'publication' : PackagePublication,
}
export interface PackageSummaryWithChanges {
  'ownerInfo' : User,
  'owners' : Array<User>,
  'maintainers' : Array<User>,
  'owner' : Principal,
  'depAlias' : string,
  'quality' : PackageQuality,
  'publisher' : User,
  'highestVersion' : PackageVersion,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'downloadsInLast7Days' : bigint,
  'config' : PackageConfigV3,
  'changes' : PackageChanges,
  'publication' : PackagePublication,
}
export interface PackageSummaryWithChanges__1 {
  'ownerInfo' : User,
  'owners' : Array<User>,
  'maintainers' : Array<User>,
  'owner' : Principal,
  'depAlias' : string,
  'quality' : PackageQuality,
  'publisher' : User,
  'highestVersion' : PackageVersion,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'downloadsInLast7Days' : bigint,
  'config' : PackageConfigV3,
  'changes' : PackageChanges,
  'publication' : PackagePublication,
}
export interface PackageSummary__1 {
  'ownerInfo' : User,
  'owners' : Array<User>,
  'maintainers' : Array<User>,
  'owner' : Principal,
  'depAlias' : string,
  'quality' : PackageQuality,
  'publisher' : User,
  'highestVersion' : PackageVersion,
  'downloadsTotal' : bigint,
  'downloadsInLast30Days' : bigint,
  'downloadsInLast7Days' : bigint,
  'config' : PackageConfigV3,
  'publication' : PackagePublication,
}
export type PackageVersion = string;
export type PackageVersion__1 = string;
export type PageCount = bigint;
export type PublishingId = string;
export interface Request {
  'url' : string,
  'method' : string,
  'body' : Uint8Array | number[],
  'headers' : Array<Header>,
  'certificate_version' : [] | [number],
}
export interface Requirement { 'value' : string, 'name' : string }
export interface Response {
  'body' : Uint8Array | number[],
  'headers' : Array<Header>,
  'upgrade' : [] | [boolean],
  'streaming_strategy' : [] | [StreamingStrategy],
  'status_code' : number,
}
export type Result = { 'ok' : null } |
  { 'err' : Err };
export type Result_1 = { 'ok' : PublishingId } |
  { 'err' : Err };
export type Result_2 = { 'ok' : FileId } |
  { 'err' : Err };
export type Result_3 = { 'ok' : null } |
  { 'err' : string };
export type Result_4 = { 'ok' : PackageDetails } |
  { 'err' : Err };
export type Result_5 = { 'ok' : PackageVersion__1 } |
  { 'err' : Err };
export type Result_6 = { 'ok' : Array<[PackageName__1, PackageVersion__1]> } |
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
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
