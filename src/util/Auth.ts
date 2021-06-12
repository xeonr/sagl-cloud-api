import { Request as HapiRequest, RequestAuth } from '@hapi/hapi';
import _ from 'lodash';

import { User } from '../models/User';

// tslint:disable-next-line
export interface RequestAuthenticationInformation extends RequestAuth {
	credentials: {
		user: User;
	};
}

// tslint:disable-next-line
export interface Request extends HapiRequest {
	auth: RequestAuthenticationInformation;
	query: any; // tslint:disable-line
	payload: any; // tslint:disable-line
}

export interface IToken {
	userId: number;
}

export async function validateAuth(token: IToken): Promise<{ isValid: boolean; credentials?: unknown }> {
	const user: User | null = await User.findOne({ where: { id: token.userId } });

	if (!user) {
		return { isValid: false };
	}

	return { isValid: true, credentials: { user: user } };

}
