import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { akashMlApiRequest } from '../shared/transport';

type ModelsResponse = {
	data?: Array<{
		id: string;
	}>;
};

export async function getModels(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const response = (await akashMlApiRequest.call(this, 'GET', '/models')) as ModelsResponse;

	const models = response?.data ?? [];

	return models
		.filter((m) => typeof m?.id === 'string' && m.id.length > 0)
		.map((m) => ({
			name: m.id,
			value: m.id,
		}));
}


