import vaultConfig from 'config';
import { ServerService } from '@buf/xeonr_sagl-servers.connectrpc_es/serversapi/v1/api_connect';
import { createPromiseClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-node';

export const serverClient = createPromiseClient(ServerService, createConnectTransport({ baseUrl: vaultConfig.get('saglServerApi'), httpVersion: '1.1' }));
