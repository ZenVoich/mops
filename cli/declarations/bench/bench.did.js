export const idlFactory = ({ IDL }) => {
  const BenchResult = IDL.Record({
    'instructions' : IDL.Nat,
    'rts_memory_size' : IDL.Nat,
    'rts_total_allocation' : IDL.Nat,
    'rts_collector_instructions' : IDL.Nat,
    'rts_mutator_instructions' : IDL.Nat,
    'rts_heap_size' : IDL.Nat,
  });
  const BenchSchema = IDL.Record({
    'cols' : IDL.Vec(IDL.Text),
    'name' : IDL.Text,
    'rows' : IDL.Vec(IDL.Text),
    'description' : IDL.Text,
  });
  const anon_class_9_1 = IDL.Service({
    'getStats' : IDL.Func([], [BenchResult], ['query']),
    'init' : IDL.Func([], [BenchSchema], []),
    'runCellQuery' : IDL.Func([IDL.Nat, IDL.Nat], [BenchResult], ['query']),
    'runCellUpdate' : IDL.Func([IDL.Nat, IDL.Nat], [BenchResult], []),
  });
  return anon_class_9_1;
};
export const init = ({ IDL }) => { return []; };
