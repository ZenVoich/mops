import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface BenchResult {
  'instructions' : bigint,
  'rts_memory_size' : bigint,
  'rts_total_allocation' : bigint,
  'rts_collector_instructions' : bigint,
  'rts_mutator_instructions' : bigint,
  'rts_heap_size' : bigint,
}
export interface BenchSchema {
  'cols' : Array<string>,
  'name' : string,
  'rows' : Array<string>,
  'description' : string,
}
export interface anon_class_9_1 {
  'init' : ActorMethod<[], BenchSchema>,
  'runCell' : ActorMethod<[bigint, bigint], BenchResult>,
}
export interface _SERVICE extends anon_class_9_1 {}
