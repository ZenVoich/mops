export type KongswapTokenInfo = {
	token_id: number;
	name: string;
	symbol: string;
	canister_id: string;
	address: string;
	decimals: number;
	fee: number;
	icrc1: boolean;
	icrc2: boolean;
	icrc3: boolean;
	raw_json: {
		IC: {
			fee: string;
			name: string;
			icrc1: boolean;
			icrc2: boolean;
			icrc3: boolean;
			symbol: string;
			decimals: number;
			token_id: number;
			is_removed: boolean;
			canister_id: string;
		};
	};
	fee_fixed: string;
	logo_url: string;
	is_removed: boolean;
	has_custom_logo: boolean;
	token_type: string;
	logo_updated_at: string;
	metrics: {
		token_id: number;
		total_supply: string;
		market_cap: string;
		price: string;
		updated_at: string;
		volume_24h: string;
		tvl: string;
		price_change_24h: string;
		previous_price: string;
		market_cap_rank: number;
		is_verified: boolean;
	};
};

export const getKongswapTokenInfo = async (token: string): Promise<KongswapTokenInfo> => {
	let res = await fetch('https://api.kongswap.io/api/tokens/by_canister', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ canister_ids: [token] }),
	});
	let data = await res.json();
	return data.items[0];
};