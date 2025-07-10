module {
	public type CirculationChange = {
		minted: Nat;
		burned: Nat;
		votingRewards: Nat;
		transferFees: Nat;
		gameFees: Nat;
		daoFees: Nat;
		unknownFees: Nat;
	};
};