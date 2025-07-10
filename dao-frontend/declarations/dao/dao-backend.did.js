export const idlFactory = ({ IDL }) => {
  const CirculationChange = IDL.Record({
    'votingRewards' : IDL.Nat,
    'daoFees' : IDL.Nat,
    'transferFees' : IDL.Nat,
    'minted' : IDL.Nat,
    'unknownFees' : IDL.Nat,
    'gameFees' : IDL.Nat,
    'burned' : IDL.Nat,
  });
  const Main = IDL.Service({
    'getCirculationChange30Days' : IDL.Func([], [CirculationChange], ['query']),
  });
  return Main;
};
export const init = ({ IDL }) => { return []; };
