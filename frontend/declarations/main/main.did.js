export const idlFactory = ({ IDL }) => {
  const PublishingId = IDL.Text;
  const Err = IDL.Text;
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : Err });
  const Text = IDL.Text;
  const PackageName__1 = IDL.Text;
  const Version = IDL.Text;
  const Script = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const PackageName = IDL.Text;
  const Dependency = IDL.Record({ 'name' : PackageName, 'version' : IDL.Text });
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
  const FileId = IDL.Text;
  const File = IDL.Record({
    'id' : FileId,
    'content' : IDL.Vec(IDL.Nat8),
    'path' : Text,
  });
  const Time = IDL.Int;
  const PackageSummary = IDL.Record({
    'dfx' : IDL.Text,
    'moc' : IDL.Text,
    'scripts' : IDL.Vec(Script),
    'owner' : IDL.Principal,
    'documentation' : IDL.Text,
    'storage' : IDL.Principal,
    'name' : PackageName,
    'homepage' : IDL.Text,
    'downloadsTotal' : IDL.Nat,
    'downloadsInLast30Days' : IDL.Nat,
    'description' : IDL.Text,
    'version' : IDL.Text,
    'keywords' : IDL.Vec(IDL.Text),
    'donation' : IDL.Text,
    'updatedAt' : Time,
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
    'getConfig' : IDL.Func(
        [PackageName__1, Version],
        [PackageConfig],
        ['query'],
      ),
    'getFile' : IDL.Func([FileId], [File], []),
    'getFileIds' : IDL.Func(
        [PackageName__1, Version],
        [IDL.Vec(FileId)],
        ['query'],
      ),
    'getMaxVersion' : IDL.Func([PackageName__1], [Version], ['query']),
    'getPackageSummary' : IDL.Func(
        [PackageName__1, Version],
        [PackageSummary],
        ['query'],
      ),
    'getReadmeFile' : IDL.Func([PackageName__1, Version], [File], []),
    'getRecentlyUpdatedPackages' : IDL.Func(
        [],
        [IDL.Vec(PackageSummary)],
        ['query'],
      ),
    'notifyInstall' : IDL.Func([PackageName__1, Version], [], ['oneway']),
    'search' : IDL.Func([Text], [IDL.Vec(PackageSummary)], ['query']),
    'startPublish' : IDL.Func([PackageConfig], [Result_1], []),
    'uploadFile' : IDL.Func(
        [PublishingId, Text, IDL.Vec(IDL.Nat8)],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
