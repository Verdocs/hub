const currentUser = null;

export interface IVerdocsUser {
	sub: string;
	firstName: string;
	lastName: string;
}

export interface IVerdocsSession {
	valid: boolean;
	expires: number;
	user: IVerdocsUser | null;
}

export const loadSession = async () => {};

export const saveSession = async (session: any) => {};

export const getCurrentUser = async () => {
  return currentUser;
};

export const refreshSession = async () => {

};
