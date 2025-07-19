import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface CirculationChange {
  'votingRewards' : bigint,
  'daoFees' : bigint,
  'transferFees' : bigint,
  'minted' : bigint,
  'unknownFees' : bigint,
  'gameFees' : bigint,
  'burned' : bigint,
}
export interface Main {
  'getCirculationChange30Days' : ActorMethod<[], CirculationChange>,
}
export interface _SERVICE extends Main {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
