export const idlFactory = ({ IDL }) => {
  const PublishingId = IDL.Text;
  const Err = IDL.Text;
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : Err });
  const Text = IDL.Text;
  const PackageName = IDL.Text;
  const PackageVersion = IDL.Text;
  const PackageId = IDL.Text;
  const Time = IDL.Int;
  const DownloadsSnapshot__1 = IDL.Record({
    'startTime' : Time,
    'endTime' : Time,
    'downloads' : IDL.Nat,
  });
  const FileId = IDL.Text;
  const Result_8 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Tuple(FileId, IDL.Vec(IDL.Nat8))),
    'err' : Err,
  });
  const Result_7 = IDL.Variant({ 'ok' : IDL.Vec(FileId), 'err' : Err });
  const SemverPart = IDL.Variant({
    'major' : IDL.Null,
    'minor' : IDL.Null,
    'patch' : IDL.Null,
  });
  const Result_6 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Tuple(PackageName, PackageVersion)),
    'err' : Err,
  });
  const Result_5 = IDL.Variant({ 'ok' : PackageVersion, 'err' : Err });
  const User = IDL.Record({
    'id' : IDL.Principal,
    'emailVerified' : IDL.Bool,
    'twitter' : IDL.Text,
    'displayName' : IDL.Text,
    'name' : IDL.Text,
    'site' : IDL.Text,
    'email' : IDL.Text,
    'twitterVerified' : IDL.Bool,
    'githubVerified' : IDL.Bool,
    'github' : IDL.Text,
  });
  const DepsStatus = IDL.Variant({
    'allLatest' : IDL.Null,
    'tooOld' : IDL.Null,
    'updatesAvailable' : IDL.Null,
  });
  const PackageQuality = IDL.Record({
    'depsStatus' : DepsStatus,
    'hasDescription' : IDL.Bool,
    'hasKeywords' : IDL.Bool,
    'hasLicense' : IDL.Bool,
    'hasDocumentation' : IDL.Bool,
    'hasTests' : IDL.Bool,
    'hasRepository' : IDL.Bool,
    'hasReleaseNotes' : IDL.Bool,
  });
  const Script = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const PackageName__1 = IDL.Text;
  const DependencyV2 = IDL.Record({
    'name' : PackageName__1,
    'repo' : IDL.Text,
    'version' : IDL.Text,
  });
  const PackageConfigV2__1 = IDL.Record({
    'dfx' : IDL.Text,
    'moc' : IDL.Text,
    'scripts' : IDL.Vec(Script),
    'baseDir' : IDL.Text,
    'documentation' : IDL.Text,
    'name' : PackageName__1,
    'homepage' : IDL.Text,
    'description' : IDL.Text,
    'version' : IDL.Text,
    'keywords' : IDL.Vec(IDL.Text),
    'donation' : IDL.Text,
    'devDependencies' : IDL.Vec(DependencyV2),
    'repository' : IDL.Text,
    'dependencies' : IDL.Vec(DependencyV2),
    'license' : IDL.Text,
    'readme' : IDL.Text,
  });
  const PackagePublication = IDL.Record({
    'storage' : IDL.Principal,
    'time' : Time,
    'user' : IDL.Principal,
  });
  const PackageSummary = IDL.Record({
    'ownerInfo' : User,
    'owner' : IDL.Principal,
    'quality' : PackageQuality,
    'downloadsTotal' : IDL.Nat,
    'downloadsInLast30Days' : IDL.Nat,
    'downloadsInLast7Days' : IDL.Nat,
    'config' : PackageConfigV2__1,
    'publication' : PackagePublication,
  });
  const PackageSummary__1 = IDL.Record({
    'ownerInfo' : User,
    'owner' : IDL.Principal,
    'quality' : PackageQuality,
    'downloadsTotal' : IDL.Nat,
    'downloadsInLast30Days' : IDL.Nat,
    'downloadsInLast7Days' : IDL.Nat,
    'config' : PackageConfigV2__1,
    'publication' : PackagePublication,
  });
  const TestStats__1 = IDL.Record({
    'passedNames' : IDL.Vec(IDL.Text),
    'passed' : IDL.Nat,
  });
  const DownloadsSnapshot = IDL.Record({
    'startTime' : Time,
    'endTime' : Time,
    'downloads' : IDL.Nat,
  });
  const PackageFileStatsPublic = IDL.Record({
    'sourceFiles' : IDL.Nat,
    'sourceSize' : IDL.Nat,
  });
  const TestsChanges = IDL.Record({
    'addedNames' : IDL.Vec(IDL.Text),
    'removedNames' : IDL.Vec(IDL.Text),
  });
  const DepChange = IDL.Record({
    'oldVersion' : IDL.Text,
    'name' : IDL.Text,
    'newVersion' : IDL.Text,
  });
  const PackageChanges = IDL.Record({
    'tests' : TestsChanges,
    'deps' : IDL.Vec(DepChange),
    'notes' : IDL.Text,
    'devDeps' : IDL.Vec(DepChange),
  });
  const PackageSummaryWithChanges__1 = IDL.Record({
    'ownerInfo' : User,
    'owner' : IDL.Principal,
    'quality' : PackageQuality,
    'downloadsTotal' : IDL.Nat,
    'downloadsInLast30Days' : IDL.Nat,
    'downloadsInLast7Days' : IDL.Nat,
    'config' : PackageConfigV2__1,
    'changes' : PackageChanges,
    'publication' : PackagePublication,
  });
  const PackageDetails = IDL.Record({
    'ownerInfo' : User,
    'owner' : IDL.Principal,
    'deps' : IDL.Vec(PackageSummary__1),
    'quality' : PackageQuality,
    'testStats' : TestStats__1,
    'downloadsTotal' : IDL.Nat,
    'downloadsInLast30Days' : IDL.Nat,
    'downloadTrend' : IDL.Vec(DownloadsSnapshot),
    'fileStats' : PackageFileStatsPublic,
    'versionHistory' : IDL.Vec(PackageSummaryWithChanges__1),
    'dependents' : IDL.Vec(PackageSummary__1),
    'devDeps' : IDL.Vec(PackageSummary__1),
    'downloadsInLast7Days' : IDL.Nat,
    'config' : PackageConfigV2__1,
    'changes' : PackageChanges,
    'publication' : PackagePublication,
  });
  const Result_4 = IDL.Variant({ 'ok' : PackageDetails, 'err' : Err });
  const PackageSummaryWithChanges = IDL.Record({
    'ownerInfo' : User,
    'owner' : IDL.Principal,
    'quality' : PackageQuality,
    'downloadsTotal' : IDL.Nat,
    'downloadsInLast30Days' : IDL.Nat,
    'downloadsInLast7Days' : IDL.Nat,
    'config' : PackageConfigV2__1,
    'changes' : PackageChanges,
    'publication' : PackagePublication,
  });
  const StorageId = IDL.Principal;
  const StorageStats = IDL.Record({
    'fileCount' : IDL.Nat,
    'cyclesBalance' : IDL.Nat,
    'memorySize' : IDL.Nat,
  });
  const User__1 = IDL.Record({
    'id' : IDL.Principal,
    'emailVerified' : IDL.Bool,
    'twitter' : IDL.Text,
    'displayName' : IDL.Text,
    'name' : IDL.Text,
    'site' : IDL.Text,
    'email' : IDL.Text,
    'twitterVerified' : IDL.Bool,
    'githubVerified' : IDL.Bool,
    'github' : IDL.Text,
  });
  const Header = IDL.Tuple(IDL.Text, IDL.Text);
  const Request = IDL.Record({
    'url' : IDL.Text,
    'method' : IDL.Text,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(Header),
    'certificate_version' : IDL.Opt(IDL.Nat16),
  });
  const StreamingToken = IDL.Vec(IDL.Nat8);
  const StreamingCallbackResponse = IDL.Record({
    'token' : IDL.Opt(StreamingToken),
    'body' : IDL.Vec(IDL.Nat8),
  });
  const StreamingCallback = IDL.Func(
      [StreamingToken],
      [IDL.Opt(StreamingCallbackResponse)],
      ['query'],
    );
  const StreamingStrategy = IDL.Variant({
    'Callback' : IDL.Record({
      'token' : StreamingToken,
      'callback' : StreamingCallback,
    }),
  });
  const Response = IDL.Record({
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(Header),
    'upgrade' : IDL.Opt(IDL.Bool),
    'streaming_strategy' : IDL.Opt(StreamingStrategy),
    'status_code' : IDL.Nat16,
  });
  const PageCount = IDL.Nat;
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'ok' : FileId, 'err' : Err });
  const PackageConfigV2 = IDL.Record({
    'dfx' : IDL.Text,
    'moc' : IDL.Text,
    'scripts' : IDL.Vec(Script),
    'baseDir' : IDL.Text,
    'documentation' : IDL.Text,
    'name' : PackageName__1,
    'homepage' : IDL.Text,
    'description' : IDL.Text,
    'version' : IDL.Text,
    'keywords' : IDL.Vec(IDL.Text),
    'donation' : IDL.Text,
    'devDependencies' : IDL.Vec(DependencyV2),
    'repository' : IDL.Text,
    'dependencies' : IDL.Vec(DependencyV2),
    'license' : IDL.Text,
    'readme' : IDL.Text,
  });
  const Result_2 = IDL.Variant({ 'ok' : PublishingId, 'err' : Err });
  const HttpHeader = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const HttpResponse = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HttpHeader),
  });
  const TransformArg = IDL.Record({
    'context' : IDL.Vec(IDL.Nat8),
    'response' : HttpResponse,
  });
  const TestStats = IDL.Record({
    'passedNames' : IDL.Vec(IDL.Text),
    'passed' : IDL.Nat,
  });
  const Main = IDL.Service({
    'backup' : IDL.Func([], [], []),
    'computeHashesForExistingFiles' : IDL.Func([], [], []),
    'finishPublish' : IDL.Func([PublishingId], [Result], []),
    'getApiVersion' : IDL.Func([], [Text], ['query']),
    'getBackupCanisterId' : IDL.Func([], [IDL.Principal], ['query']),
    'getDefaultPackages' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(IDL.Tuple(PackageName, PackageVersion))],
        ['query'],
      ),
    'getDownloadTrendByPackageId' : IDL.Func(
        [PackageId],
        [IDL.Vec(DownloadsSnapshot__1)],
        ['query'],
      ),
    'getDownloadTrendByPackageName' : IDL.Func(
        [PackageName],
        [IDL.Vec(DownloadsSnapshot__1)],
        ['query'],
      ),
    'getFileHashes' : IDL.Func([PackageName, PackageVersion], [Result_8], []),
    'getFileHashesByPackageIds' : IDL.Func(
        [IDL.Vec(PackageId)],
        [
          IDL.Vec(
            IDL.Tuple(PackageId, IDL.Vec(IDL.Tuple(FileId, IDL.Vec(IDL.Nat8))))
          ),
        ],
        [],
      ),
    'getFileIds' : IDL.Func(
        [PackageName, PackageVersion],
        [Result_7],
        ['query'],
      ),
    'getHighestSemverBatch' : IDL.Func(
        [IDL.Vec(IDL.Tuple(PackageName, PackageVersion, SemverPart))],
        [Result_6],
        ['query'],
      ),
    'getHighestVersion' : IDL.Func([PackageName], [Result_5], ['query']),
    'getMostDownloadedPackages' : IDL.Func(
        [],
        [IDL.Vec(PackageSummary)],
        ['query'],
      ),
    'getMostDownloadedPackagesIn7Days' : IDL.Func(
        [],
        [IDL.Vec(PackageSummary)],
        ['query'],
      ),
    'getNewPackages' : IDL.Func([], [IDL.Vec(PackageSummary)], ['query']),
    'getPackageDetails' : IDL.Func(
        [PackageName, PackageVersion],
        [Result_4],
        ['query'],
      ),
    'getPackagesByCategory' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Vec(PackageSummary)))],
        ['query'],
      ),
    'getRecentlyUpdatedPackages' : IDL.Func(
        [],
        [IDL.Vec(PackageSummaryWithChanges)],
        ['query'],
      ),
    'getStoragesStats' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(StorageId, StorageStats))],
        ['query'],
      ),
    'getTotalDownloads' : IDL.Func([], [IDL.Nat], ['query']),
    'getTotalPackages' : IDL.Func([], [IDL.Nat], ['query']),
    'getUser' : IDL.Func([IDL.Principal], [IDL.Opt(User__1)], ['query']),
    'http_request' : IDL.Func([Request], [Response], ['query']),
    'notifyInstall' : IDL.Func([PackageName, PackageVersion], [], ['oneway']),
    'notifyInstalls' : IDL.Func(
        [IDL.Vec(IDL.Tuple(PackageName, PackageVersion))],
        [],
        ['oneway'],
      ),
    'restore' : IDL.Func([IDL.Nat, IDL.Nat], [], []),
    'search' : IDL.Func(
        [Text, IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
        [IDL.Vec(PackageSummary), PageCount],
        ['query'],
      ),
    'setUserProp' : IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
    'startFileUpload' : IDL.Func(
        [PublishingId, Text, IDL.Nat, IDL.Vec(IDL.Nat8)],
        [Result_3],
        [],
      ),
    'startPublish' : IDL.Func([PackageConfigV2], [Result_2], []),
    'transferOwnership' : IDL.Func(
        [PackageName, IDL.Principal],
        [Result_1],
        [],
      ),
    'transformRequest' : IDL.Func([TransformArg], [HttpResponse], ['query']),
    'uploadFileChunk' : IDL.Func(
        [PublishingId, FileId, IDL.Nat, IDL.Vec(IDL.Nat8)],
        [Result],
        [],
      ),
    'uploadNotes' : IDL.Func([PublishingId, IDL.Text], [Result], []),
    'uploadTestStats' : IDL.Func([PublishingId, TestStats], [Result], []),
  });
  return Main;
};
export const init = ({ IDL }) => { return []; };
