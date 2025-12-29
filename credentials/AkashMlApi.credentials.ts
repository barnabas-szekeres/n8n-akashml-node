import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class AkashMlApi implements ICredentialType {
	name = 'akashMlApi';

	displayName = 'AkashML API';

	icon: Icon = 'file:../icons/akashml.svg';

	documentationUrl = 'https://docs.akashml.com';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your AkashML API key',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.akashml.com/v1',
			required: true,
			description: 'AkashML webroot including /v1 (OpenAI-compatible)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/models',
			method: 'GET',
		},
	};
}


