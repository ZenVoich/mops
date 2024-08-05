import Debug "mo:base/Debug";

actor class MyCanister() {
	public query ({caller}) func getCaller() : async Principal {
		caller;
	};
};

actor class Agent(canister : MyCanister) {
	public func call() : async Principal {
		await canister.getCaller();
	};
};

let myCanister = await MyCanister();
let agent1 = await Agent(myCanister);
let agent2 = await Agent(myCanister);

Debug.print(debug_show(await agent1.call()));
Debug.print(debug_show(await agent2.call()));

assert (await agent1.call()) != (await agent2.call());