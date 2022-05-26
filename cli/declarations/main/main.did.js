export const idlFactory = ({ IDL }) => {
  const PublishingId = IDL.Text;
  const Err = IDL.Text;
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : Err });
  const PackageName__1 = IDL.Text;
  const Version = IDL.Text;
  const Access = IDL.Variant({ 'readOnly' : IDL.Null, 'readWrite' : IDL.Null });
  const Permission = IDL.Record({ 'access' : Access, 'user' : IDL.Principal });
  const Script = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const PackageName = IDL.Text;
  const Dependency = IDL.Record({ 'name' : PackageName, 'version' : IDL.Text });
  const PackageConfig = IDL.Record({
    'dfx' : IDL.Text,
    'moc' : IDL.Text,
    'permissions' : IDL.Vec(Permission),
    'scripts' : IDL.Vec(Script),
    'owner' : IDL.Principal,
    'documentation' : IDL.Text,
    'name' : PackageName,
    'homepage' : IDL.Text,
    'description' : IDL.Text,
    'version' : IDL.Text,
    'keywords' : IDL.Vec(IDL.Text),
    'donation' : IDL.Text,
    'isPrivate' : IDL.Bool,
    'repository' : IDL.Text,
    'dependencies' : IDL.Vec(Dependency),
    'license' : IDL.Text,
    'readme' : IDL.Text,
  });
  const FileId = IDL.Text;
  const Text = IDL.Text;
  const File = IDL.Record({
    'id' : FileId,
    'content' : IDL.Vec(IDL.Nat8),
    'path' : Text,
  });
  const Time = IDL.Int;
  const PackageSummary = IDL.Record({
    'name' : PackageName,
    'downloadsTotal' : IDL.Nat,
    'downloadsInLast30Days' : IDL.Nat,
    'description' : IDL.Text,
    'version' : IDL.Text,
    'keywords' : IDL.Vec(IDL.Text),
    'updatedAt' : Time,
  });
  const PublishingErr = IDL.Text;
  const Result_1 = IDL.Variant({ 'ok' : PublishingId, 'err' : PublishingErr });
  return IDL.Service({
    'finishPublish' : IDL.Func([PublishingId], [Result], []),
    'getConfig' : IDL.Func(
        [PackageName__1, Version],
        [PackageConfig],
        ['query'],
      ),
    'getFile' : IDL.Func([FileId], [File], ['query']),
    'getFileIds' : IDL.Func(
        [PackageName__1, Version],
        [IDL.Vec(FileId)],
        ['query'],
      ),
    'getLastConfig' : IDL.Func([PackageName__1], [PackageConfig], ['query']),
    'getLastVersion' : IDL.Func([PackageName__1], [Version], ['query']),
    'getReadmeFile' : IDL.Func([PackageName__1, Version], [File], ['query']),
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
    'whoami' : IDL.Func([], [Text], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
