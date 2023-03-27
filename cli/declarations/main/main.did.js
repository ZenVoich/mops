export const idlFactory = ({ IDL }) => {
  const PublishingId = IDL.Text;
  const Err = IDL.Text;
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : Err });
  const Text = IDL.Text;
  const PackageName__1 = IDL.Text;
  const Version = IDL.Text;
  const PackageId = IDL.Text;
  const Time = IDL.Int;
  const DownloadsSnapshot__1 = IDL.Record({
    'startTime' : Time,
    'endTime' : Time,
    'downloads' : IDL.Nat,
  });
  const Ver = IDL.Text;
  const FileId = IDL.Text;
  const Result_5 = IDL.Variant({ 'ok' : IDL.Vec(FileId), 'err' : Err });
  const Result_4 = IDL.Variant({ 'ok' : Ver, 'err' : Err });
  const Script = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const PackageName = IDL.Text;
  const DependencyV2 = IDL.Record({
    'name' : PackageName,
    'repo' : IDL.Text,
    'version' : IDL.Text,
  });
  const PackageConfigV2__1 = IDL.Record({
    'dfx' : IDL.Text,
    'moc' : IDL.Text,
    'scripts' : IDL.Vec(Script),
    'baseDir' : IDL.Text,
    'documentation' : IDL.Text,
    'name' : PackageName,
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
    'owner' : IDL.Principal,
    'downloadsTotal' : IDL.Nat,
    'downloadsInLast30Days' : IDL.Nat,
    'downloadsInLast7Days' : IDL.Nat,
    'config' : PackageConfigV2__1,
    'publication' : PackagePublication,
  });
  const PackageSummary__1 = IDL.Record({
    'owner' : IDL.Principal,
    'downloadsTotal' : IDL.Nat,
    'downloadsInLast30Days' : IDL.Nat,
    'downloadsInLast7Days' : IDL.Nat,
    'config' : PackageConfigV2__1,
    'publication' : PackagePublication,
  });
  const DownloadsSnapshot = IDL.Record({
    'startTime' : Time,
    'endTime' : Time,
    'downloads' : IDL.Nat,
  });
  const PackageDetails = IDL.Record({
    'owner' : IDL.Principal,
    'deps' : IDL.Vec(PackageSummary__1),
    'downloadsTotal' : IDL.Nat,
    'downloadsInLast30Days' : IDL.Nat,
    'downloadTrend' : IDL.Vec(DownloadsSnapshot),
    'versionHistory' : IDL.Vec(PackageSummary__1),
    'dependents' : IDL.Vec(PackageSummary__1),
    'devDeps' : IDL.Vec(PackageSummary__1),
    'downloadsInLast7Days' : IDL.Nat,
    'config' : PackageConfigV2__1,
    'publication' : PackagePublication,
  });
  const Result_3 = IDL.Variant({ 'ok' : PackageDetails, 'err' : Err });
  const StorageId = IDL.Principal;
  const StorageStats = IDL.Record({
    'fileCount' : IDL.Nat,
    'cyclesBalance' : IDL.Nat,
    'memorySize' : IDL.Nat,
  });
  const Result_2 = IDL.Variant({ 'ok' : FileId, 'err' : Err });
  const PackageConfigV2 = IDL.Record({
    'dfx' : IDL.Text,
    'moc' : IDL.Text,
    'scripts' : IDL.Vec(Script),
    'baseDir' : IDL.Text,
    'documentation' : IDL.Text,
    'name' : PackageName,
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
  const PublishingErr = IDL.Text;
  const Result_1 = IDL.Variant({ 'ok' : PublishingId, 'err' : PublishingErr });
  return IDL.Service({
    'finishPublish' : IDL.Func([PublishingId], [Result], []),
    'getApiVersion' : IDL.Func([], [Text], ['query']),
    'getDefaultPackages' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(IDL.Tuple(PackageName__1, Version))],
        ['query'],
      ),
    'getDownloadTrendByPackageId' : IDL.Func(
        [PackageId],
        [IDL.Vec(DownloadsSnapshot__1)],
        ['query'],
      ),
    'getDownloadTrendByPackageName' : IDL.Func(
        [PackageName__1],
        [IDL.Vec(DownloadsSnapshot__1)],
        ['query'],
      ),
    'getFileIds' : IDL.Func([PackageName__1, Ver], [Result_5], ['query']),
    'getHighestVersion' : IDL.Func([PackageName__1], [Result_4], ['query']),
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
    'getPackageDetails' : IDL.Func(
        [PackageName__1, Ver],
        [Result_3],
        ['query'],
      ),
    'getRecentlyUpdatedPackages' : IDL.Func(
        [],
        [IDL.Vec(PackageSummary)],
        ['query'],
      ),
    'getStoragesStats' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(StorageId, StorageStats))],
        ['query'],
      ),
    'getTotalDownloads' : IDL.Func([], [IDL.Nat], ['query']),
    'getTotalPackages' : IDL.Func([], [IDL.Nat], ['query']),
    'notifyInstall' : IDL.Func([PackageName__1, Ver], [], ['oneway']),
    'search' : IDL.Func([Text], [IDL.Vec(PackageSummary)], ['query']),
    'startFileUpload' : IDL.Func(
        [PublishingId, Text, IDL.Nat, IDL.Vec(IDL.Nat8)],
        [Result_2],
        [],
      ),
    'startPublish' : IDL.Func([PackageConfigV2], [Result_1], []),
    'uploadFileChunk' : IDL.Func(
        [PublishingId, FileId, IDL.Nat, IDL.Vec(IDL.Nat8)],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
