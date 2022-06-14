export const idlFactory = ({ IDL }) => {
  const PublishingId = IDL.Text;
  const Err = IDL.Text;
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : Err });
  const Text = IDL.Text;
  const PackageName__1 = IDL.Text;
  const Version = IDL.Text;
  const FileId = IDL.Text;
  const Script = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const PackageName = IDL.Text;
  const Dependency = IDL.Record({ 'name' : PackageName, 'version' : IDL.Text });
  const PackageConfig__1 = IDL.Record({
    'dfx' : IDL.Text,
    'moc' : IDL.Text,
    'scripts' : IDL.Vec(Script),
    'documentation' : IDL.Text,
    'name' : PackageName,
    'homepage' : IDL.Text,
    'description' : IDL.Text,
    'version' : IDL.Text,
    'keywords' : IDL.Vec(IDL.Text),
    'donation' : IDL.Text,
    'repository' : IDL.Text,
    'dependencies' : IDL.Vec(Dependency),
    'license' : IDL.Text,
    'readme' : IDL.Text,
  });
  const Time = IDL.Int;
  const PackagePublication = IDL.Record({
    'storage' : IDL.Principal,
    'time' : Time,
    'user' : IDL.Principal,
  });
  const PackageDetails = IDL.Record({
    'owner' : IDL.Principal,
    'downloadsTotal' : IDL.Nat,
    'downloadsInLast30Days' : IDL.Nat,
    'config' : PackageConfig__1,
    'publication' : PackagePublication,
  });
  const StorageId = IDL.Principal;
  const StorageStats = IDL.Record({
    'fileCount' : IDL.Nat,
    'cyclesBalance' : IDL.Nat,
    'memorySize' : IDL.Nat,
  });
  const Result_2 = IDL.Variant({ 'ok' : FileId, 'err' : Err });
  const PackageConfig = IDL.Record({
    'dfx' : IDL.Text,
    'moc' : IDL.Text,
    'scripts' : IDL.Vec(Script),
    'documentation' : IDL.Text,
    'name' : PackageName,
    'homepage' : IDL.Text,
    'description' : IDL.Text,
    'version' : IDL.Text,
    'keywords' : IDL.Vec(IDL.Text),
    'donation' : IDL.Text,
    'repository' : IDL.Text,
    'dependencies' : IDL.Vec(Dependency),
    'license' : IDL.Text,
    'readme' : IDL.Text,
  });
  const PublishingErr = IDL.Text;
  const Result_1 = IDL.Variant({ 'ok' : PublishingId, 'err' : PublishingErr });
  return IDL.Service({
    'finishPublish' : IDL.Func([PublishingId], [Result], []),
    'getApiVersion' : IDL.Func([], [Text], ['query']),
    'getFileIds' : IDL.Func(
        [PackageName__1, Version],
        [IDL.Vec(FileId)],
        ['query'],
      ),
    'getHighestVersion' : IDL.Func([PackageName__1], [Version], ['query']),
    'getPackageDetails' : IDL.Func(
        [PackageName__1, Version],
        [PackageDetails],
        ['query'],
      ),
    'getRecentlyUpdatedPackages' : IDL.Func(
        [],
        [IDL.Vec(PackageDetails)],
        ['query'],
      ),
    'getStoragesStats' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(StorageId, StorageStats))],
        ['query'],
      ),
    'notifyInstall' : IDL.Func([PackageName__1, Version], [], ['oneway']),
    'search' : IDL.Func([Text], [IDL.Vec(PackageDetails)], ['query']),
    'startFileUpload' : IDL.Func(
        [PublishingId, Text, IDL.Nat, IDL.Vec(IDL.Nat8)],
        [Result_2],
        [],
      ),
    'startPublish' : IDL.Func([PackageConfig], [Result_1], []),
    'uploadFileChunk' : IDL.Func(
        [PublishingId, FileId, IDL.Nat, IDL.Vec(IDL.Nat8)],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
