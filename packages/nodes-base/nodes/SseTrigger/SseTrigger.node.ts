import EventSource from 'eventsource';
import type {
	IDataObject,
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	IRequestOptions,
	ITriggerResponse,
} from 'n8n-workflow';
import { NodeConnectionType, jsonParse } from 'n8n-workflow';

export class SseTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SSE Trigger',
		name: 'sseTrigger',
		icon: 'fa:cloud-download-alt',
		iconColor: 'dark-blue',
		group: ['trigger'],
		version: 1,
		description: 'Triggers the workflow when Server-Sent Events occur',
		eventTriggerDescription: '',
		activationMessage: 'You can now make calls to your SSE URL to trigger executions.',
		defaults: {
			name: 'SSE Trigger',
			color: '#225577',
		},
		triggerPanel: {
			header: '',
			executionsHelp: {
				inactive:
					"<b>While building your workflow</b>, click the 'listen' button, then trigger an SSE event. This will trigger an execution, which will show up in this editor.<br /> <br /><b>Once you're happy with your workflow</b>, <a data-key='activate'>activate</a> it. Then every time a change is detected, the workflow will execute. These executions will show up in the <a data-key='executions'>executions list</a>, but not in the editor.",
				active:
					"<b>While building your workflow</b>, click the 'listen' button, then trigger an SSE event. This will trigger an execution, which will show up in this editor.<br /> <br /><b>Your workflow will also execute automatically</b>, since it's activated. Every time a change is detected, this node will trigger an execution. These executions will show up in the <a data-key='executions'>executions list</a>, but not in the editor.",
			},
			activationHint:
				"Once you’ve finished building your workflow, <a data-key='activate'>activate</a> it to have it also listen continuously (you just won’t see those executions here).",
		},
		inputs: [],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'httpHeaderAuth',
				required: true,
				displayOptions: {
					show: {
						authentication: ['headerAuth'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'None',
						value: 'none',
					},
					{
						name: 'Header Auth',
						value: 'headerAuth',
					},
				],
				default: 'none',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				placeholder: 'http://example.com',
				description: 'The URL to receive the SSE from',
				required: true,
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const url = this.getNodeParameter('url') as string;
		let httpHeaderAuth;
		let requestOptions: IRequestOptions = {};

		try {
			httpHeaderAuth = await this.getCredentials('httpHeaderAuth');
		} catch (error) {
			// Do nothing
		}

		requestOptions = {
			headers: {},
		};

		if (httpHeaderAuth !== undefined) {
			requestOptions.headers![httpHeaderAuth.name as string] = httpHeaderAuth.value;
		}

		const eventSource = new EventSource(url, { headers: requestOptions.headers });

		eventSource.onmessage = (event) => {
			const eventData = jsonParse<IDataObject>(event.data as string, {
				errorMessage: 'Invalid JSON for event data',
			});
			this.emit([this.helpers.returnJsonArray([eventData])]);
		};

		async function closeFunction() {
			eventSource.close();
		}

		return {
			closeFunction,
		};
	}
}
