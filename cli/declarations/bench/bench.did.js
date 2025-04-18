export const idlFactory = ({ IDL }) => {
  const BenchSchema = IDL.Record({
    'cols' : IDL.Vec(IDL.Text),
    'name' : IDL.Text,
    'rows' : IDL.Vec(IDL.Text),
    'description' : IDL.Text,
  });
  const BenchResult = IDL.Record({
    'rts_stable_memory_size' : IDL.Int,
    'stable_memory_size' : IDL.Int,
    'instructions' : IDL.Int,
    'rts_memory_size' : IDL.Int,
    'rts_total_allocation' : IDL.Int,
    'rts_collector_instructions' : IDL.Int,
    'rts_mutator_instructions' : IDL.Int,
    'rts_logical_stable_memory_size' : IDL.Int,
    'rts_heap_size' : IDL.Int,
    'rts_reclaimed' : IDL.Int,
  });
  const _anon_class_13_1 = IDL.Service({
    'getSchema' : IDL.Func([], [BenchSchema], ['query']),
    'getStats' : IDL.Func([], [BenchResult], ['query']),
    'init' : IDL.Func([], [BenchSchema], []),
    'runCellQuery' : IDL.Func([IDL.Nat, IDL.Nat], [BenchResult], ['query']),
    'runCellUpdate' : IDL.Func([IDL.Nat, IDL.Nat], [BenchResult], []),
    'runCellUpdateAwait' : IDL.Func([IDL.Nat, IDL.Nat], [BenchResult], []),
  });
  return _anon_class_13_1;
};
export const init = ({ IDL }) => { return []; };
