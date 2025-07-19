import {createActor as createDaoBackendActor} from '/declarations/dao';

export let dao = createDaoBackendActor(
	process.env.CANISTER_ID_DAO_BACKEND || 'rfqzr-yqaaa-aaaam-qdx6a-cai',
	{
		agentOptions: {
			host: process.env.NODE_ENV === 'production' ? 'https://icp-api.io' : 'http://localhost:8080',
			verifyQuerySignatures: false,
		},
	}
);