import axios from "axios";
import { IProvider } from "./interface";
import { Transaction, TransactionHash, TransactionOnNetwork, TransactionStatus } from "./transaction";
import { NetworkConfig } from "./networkConfig";
import { Address } from "./address";
import { Nonce } from "./nonce";
import  * as errors from "./errors";
import { Balance } from "./balance";
import { AccountOnNetwork } from "./account";

export class ProxyProvider implements IProvider {
    private url: string;
    private timeoutLimit: number;

    constructor(url: string, timeout?: number) {
        this.url = url;
        this.timeoutLimit = timeout || 1000;
    }

    async getAccount(address: Address): Promise<AccountOnNetwork> {
        let response = await this.doGet(`address/${address.bech32()}`);
        let payload = response.account;
        return AccountOnNetwork.fromHttpResponse(payload);
    }

    async getBalance(address: Address): Promise<Balance> {
        let response = await this.doGet(`address/${address.bech32()}/balance`);
        let payload = response.balance;
        return Balance.fromString(payload);
    }

    async getNonce(address: Address): Promise<Nonce> {
        let response = await this.doGet(`address/${address.bech32()}/nonce`);
        let payload = response.nonce;
        return new Nonce(payload);
    }

    getVMValueString(address: string, funcName: string, args: string[]): Promise<string> {
        // TODO add error handling:
        //  * if the POST request fails
        let postBody = {
            "scAddress": address,
            "funcName": funcName,
            "args": args
        };
        return axios.post(
            this.url + `/vm-values/string`,
            postBody,
            { timeout: this.timeoutLimit }
        ).then(response => response.data.data);
    }

    getVMValueInt(address: string, funcName: string, args: string[]): Promise<bigint> {
        // TODO add error handling:
        //  * if the POST request fails
        let postBody = {
            "scAddress": address,
            "funcName": funcName,
            "args": args
        };
        return axios.post(
            this.url + `/vm-values/int`,
            postBody,
            { timeout: this.timeoutLimit }
        ).then(response => BigInt(response.data.data));
    }

    getVMValueHex(address: string, funcName: string, args: string[]): Promise<string> {
        // TODO add error handling:
        //  * if the POST request fails
        let postBody = {
            "scAddress": address,
            "funcName": funcName,
            "args": args
        };
        return axios.post(
            this.url + `/vm-values/hex`,
            postBody,
            { timeout: this.timeoutLimit }
        ).then(response => response.data.data);
    }

    getVMValueQuery(address: string, funcName: string, args: string[]): Promise<any> {
        // TODO add error handling:
        //  * if the POST request fails
        let postBody = {
            "scAddress": address,
            "funcName": funcName,
            "args": args
        };
        return axios.post(
            this.url + `/vm-values/query`,
            postBody,
            { timeout: this.timeoutLimit }
        ).then(response => response.data.data);
    }

    async sendTransaction(tx: Transaction): Promise<TransactionHash> {
        let response = await this.doPost("transaction/send", tx.toSendable());
        let txHash = response.txHash;
        return new TransactionHash(txHash);
    }

    async simulateTransaction(tx: Transaction): Promise<any> {
        console.log(tx.toSendable());
        let response = await this.doPost("transaction/simulate", tx.toSendable());
        return response;
    }

    async getTransaction(txHash: TransactionHash): Promise<TransactionOnNetwork> {
        let response = await this.doGet(`transaction/${txHash.toString()}`);
        let payload = response.transaction;
        return TransactionOnNetwork.fromHttpResponse(payload);
    }

    async getTransactionStatus(txHash: TransactionHash): Promise<TransactionStatus> {
        let response = await this.doGet(`transaction/${txHash.toString()}/status`);
        return new TransactionStatus(response.status);
    }

    async getNetworkConfig(): Promise<NetworkConfig> {
        let response = await this.doGet("network/config");
        let payload = response.config;
        return NetworkConfig.fromHttpResponse(payload);
    }

    private async doGet(resourceUrl: string): Promise<any> {
        try {
            let url = `${this.url}/${resourceUrl}`;
            let response = await axios.get(url, {timeout: this.timeoutLimit});
            let payload = response.data.data;
            return payload;
        } catch (error) {
            if (!error.response) {
                console.warn(error);
                throw new errors.ErrProxyProviderGet(resourceUrl, "", error);
            }

            let originalErrorMessage = error.response.data.error;
            throw new errors.ErrProxyProviderGet(resourceUrl, originalErrorMessage, error);
        }
    }

    private async doPost(resourceUrl: string, payload: any): Promise<any> {
        try {
            let url = `${this.url}/${resourceUrl}`;
            let json = JSON.stringify(payload);
            let response = await axios.post(url, json, {timeout: this.timeoutLimit});
            let responsePayload = response.data.data;
            return responsePayload;
        } catch (error) {
            if (!error.response) {
                console.warn(error);
                throw new errors.ErrProxyProviderPost(resourceUrl, "", error);
            }

            let originalErrorMessage = error.response.data.error || error.response.data;
            throw new errors.ErrProxyProviderPost(resourceUrl, originalErrorMessage, error);
        }
    }
}
