export const idlFactory = ({ IDL }) => {
  const BackupId = IDL.Nat;
  const Chunk = IDL.Vec(IDL.Nat8);
  const HeaderField = IDL.Tuple(IDL.Text, IDL.Text);
  const HttpRequest = IDL.Record({
    'url' : IDL.Text,
    'method' : IDL.Text,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HeaderField),
  });
  const HttpResponse = IDL.Record({
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HeaderField),
    'status_code' : IDL.Nat16,
  });
  const Backup = IDL.Service({
    'add' : IDL.Func([IDL.Vec(IDL.Nat8)], [], ['oneway']),
    'finishBackup' : IDL.Func([BackupId], [], []),
    'getChunk' : IDL.Func([IDL.Nat, IDL.Nat], [Chunk, IDL.Bool], ['query']),
    'http_request' : IDL.Func([HttpRequest], [HttpResponse], ['query']),
    'startBackup' : IDL.Func([IDL.Text], [BackupId], []),
    'uploadChunk' : IDL.Func([BackupId, Chunk], [], []),
  });
  return Backup;
};
export const init = ({ IDL }) => { return [IDL.Vec(IDL.Principal)]; };
