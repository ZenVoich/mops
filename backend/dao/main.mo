import Types "./types";

actor class Main() = this {
	public query func getCirculationChange30Days() : async Types.CirculationChange {
		return {
			minted = 6857;
			burned = 2854;
			votingRewards = 1857392;
			transferFees = 1752;
			gameFees = 2947;
			daoFees = 1094;
			unknownFees = 213;
		};
	}
}