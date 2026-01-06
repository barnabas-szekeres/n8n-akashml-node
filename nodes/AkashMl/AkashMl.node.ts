import {
	type IDataObject,
	type JsonObject,
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

import { akashMlApiRequest } from './shared/transport';
import { getModels } from './methods/loadOptions';

type ChatCompletionMessage = {
	role: 'system' | 'user' | 'assistant' | string;
	content: string;
};

export class AkashMl implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AkashML',
		name: 'akashMl',
		icon: 'file:../../icons/akashml.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'OpenAI-compatible API with AkashML base URL',
		defaults: {
			name: 'AkashML',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'akashMlApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Chat Completions',
						value: 'chatCompletions',
						action: 'Create a chat completion',
					},
				],
				default: 'chatCompletions',
			},

			// Chat Completions
			{
				displayName: 'Model Name or ID',
				name: 'model',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getModels',
				},
				required: true,
				displayOptions: {
					show: {
						operation: ['chatCompletions'],
					},
				},
				default: '',
				description: 'The model to use. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Messages',
				name: 'messages',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				required: true,
				displayOptions: {
					show: {
						operation: ['chatCompletions'],
					},
				},
				default: {},
				options: [
					{
						name: 'values',
						displayName: 'Message',
						values: [
							{
								displayName: 'Role',
								name: 'role',
								type: 'options',
								options: [
									{ name: 'User', value: 'user' },
									{ name: 'System', value: 'system' },
									{ name: 'Assistant', value: 'assistant' },
								],
								default: 'user',
							},
							{
								displayName: 'Content',
								name: 'content',
								type: 'string',
								default: '',
								required: true,
								typeOptions: {
									rows: 4,
								},
							},
						],
					},
				],
				description: 'Messages to send to the model',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['chatCompletions'],
					},
				},
				typeOptions: {
					minValue: 0,
					maxValue: 2,
					numberPrecision: 2,
				},
				default: 0.7,
				description: 'Controls randomness: lower is more deterministic',
			},
			{
				displayName: 'Max Tokens',
				name: 'maxTokens',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['chatCompletions'],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 2048,
				description: 'The maximum number of tokens to generate',
			},
			{
				displayName: 'Top P',
				name: 'topP',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['chatCompletions'],
					},
				},
				typeOptions: {
					minValue: 0,
					maxValue: 1,
					numberPrecision: 3,
				},
				default: 0.9,
				description: 'Nucleus sampling probability',
			},

		],
	};

	methods = {
		loadOptions: {
			getModels,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'chatCompletions') {
					const model = this.getNodeParameter('model', i) as string;
					const messagesParam = this.getNodeParameter('messages', i) as {
						values?: Array<{ role: string; content: string }>;
					};

					const messages = (messagesParam?.values ?? []).map(
						(m): ChatCompletionMessage => ({
							role: m.role,
							content: m.content,
						}),
					);

					if (messages.length === 0) {
						throw new NodeOperationError(this.getNode(), 'Please add at least one message.');
					}

					const temperature = this.getNodeParameter('temperature', i) as number;
					const maxTokens = this.getNodeParameter('maxTokens', i) as number;
					const topP = this.getNodeParameter('topP', i) as number;

					const body = {
						model,
						messages,
						temperature,
						max_tokens: maxTokens,
						top_p: topP,
					};

					const response = (await akashMlApiRequest.call(
						this,
						'POST',
						'/chat/completions',
						{},
						body,
					)) as unknown as {
						choices?: Array<{ message?: { content?: string } }>;
					};

					const text = response?.choices?.[0]?.message?.content ?? '';

					returnData.push({
						json: { ...(response as unknown as object), text } as unknown as IDataObject,
						pairedItem: { item: i },
					});

					continue;
				}

				throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message } as unknown as IDataObject,
						pairedItem: { item: i },
					});
					continue;
				}

				const errorResponse =
					typeof error === 'object' && error !== null
						? (error as unknown as JsonObject)
						: ({ message: String(error) } as unknown as JsonObject);

				throw new NodeApiError(this.getNode(), errorResponse, { message: 'AkashML request failed' });
			}
		}

		return [returnData];
	}
}


