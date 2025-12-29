import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IExecuteSingleFunctions,
} from 'n8n-workflow';

type AkashMlCredentials = {
	apiKey: string;
	baseUrl: string;
};

function normalizeBaseUrl(baseUrl: string): string {
	return baseUrl.replace(/\/+$/, '');
}

export async function akashMlApiRequest(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	qs: IDataObject = {},
	body: IDataObject | undefined = undefined,
) {
	const { baseUrl } = (await this.getCredentials('akashMlApi')) as unknown as AkashMlCredentials;

	const urlBase = normalizeBaseUrl(baseUrl || 'https://api.akashml.com/v1');
	const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

	const options: IHttpRequestOptions = {
		method,
		url: `${urlBase}${path}`,
		qs,
		body,
		json: true,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
	};

	return this.helpers.httpRequestWithAuthentication.call(this, 'akashMlApi', options);
}


