export const idlFactory = ({ IDL }) => {
  const FileId = IDL.Text;
  const Chunk = IDL.Vec(IDL.Nat8);
  const Err = IDL.Text;
  const Result_2 = IDL.Variant({ 'ok' : Chunk, 'err' : Err });
  const FileId__1 = IDL.Text;
  const FileMeta = IDL.Record({
    'id' : FileId__1,
    'owners' : IDL.Vec(IDL.Principal),
    'path' : IDL.Text,
    'chunkCount' : IDL.Nat,
  });
  const Result_1 = IDL.Variant({ 'ok' : FileMeta, 'err' : Err });
  const StorageStats = IDL.Record({
    'fileCount' : IDL.Nat,
    'cyclesBalance' : IDL.Nat,
    'memorySize' : IDL.Nat,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : Err });
  const Storage = IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'deleteFile' : IDL.Func([FileId], [], []),
    'downloadChunk' : IDL.Func([FileId, IDL.Nat], [Result_2], ['query']),
    'finishUpload' : IDL.Func([FileId], [], []),
    'getFileIdsRange' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(FileId)],
        ['query'],
      ),
    'getFileMeta' : IDL.Func([FileId], [Result_1], ['query']),
    'getStats' : IDL.Func([], [StorageStats], ['query']),
    'startUpload' : IDL.Func([FileMeta], [Result], []),
    'updateFileOwners' : IDL.Func([FileId, IDL.Vec(IDL.Principal)], [], []),
    'uploadChunk' : IDL.Func([FileId, IDL.Nat, Chunk], [], []),
  });
  return Storage;
};
export const init = ({ IDL }) => { return []; };
