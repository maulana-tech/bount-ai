export interface Credentials {
    did: string;
    authToken: string;
}
export declare function getConfigFile(): string;
export declare function getStoredCredentials(): Credentials | null;
export declare function login(): Promise<Credentials>;
