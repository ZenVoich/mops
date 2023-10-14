export const idlFactory = ({ IDL }) => {
  const BenchResult = IDL.Record({
    'instructions' : IDL.Int,
    'rts_memory_size' : IDL.Int,
    'rts_total_allocation' : IDL.Int,
    'rts_collector_instructions' : IDL.Int,
    'rts_mutator_instructions' : IDL.Int,
    'rts_heap_size' : IDL.Int,
  });
  const BenchSchema = IDL.Record({
    'cols' : IDL.Vec(IDL.Text),
    'name' : IDL.Text,
    'rows' : IDL.Vec(IDL.Text),
    'description' : IDL.Text,
  });
  const anon_class_10_1 = IDL.Service({
    'getStats' : IDL.Func([], [BenchResult], ['query']),
    'init' : IDL.Func([], [BenchSchema], []),
    'runCellQuery' : IDL.Func([IDL.Nat, IDL.Nat], [BenchResult], ['query']),
    'runCellUpdate' : IDL.Func([IDL.Nat, IDL.Nat], [BenchResult], []),
  });
  return anon_class_10_1;
};
export const init = ({ IDL }) => { return []; };
