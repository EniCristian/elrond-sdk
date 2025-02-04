
import { IProvider } from "./interface";
import { Transaction, TransactionHash, TransactionOnNetwork, TransactionStatus } from "./transaction";
import { NetworkConfig } from "./networkConfig";
import { Address } from "./address";
import { Nonce } from "./nonce";
import { AsyncTimer } from "./asyncTimer";
import { AccountOnNetwork } from "./account";
import { Balance } from "./balance";
import * as errors from "./errors";

export class MockProvider implements IProvider {
    static AddressOfAlice = new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    static AddressOfBob = new Address("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
    static AddressOfCarol = new Address("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8");

    private readonly accounts: Map<string, AccountOnNetwork>;
    private readonly transactions: Map<string, TransactionOnNetwork>;

    constructor() {
        this.accounts = new Map<string, AccountOnNetwork>();
        this.transactions = new Map<string, TransactionOnNetwork>();

        this.accounts.set(MockProvider.AddressOfAlice.bech32(), new AccountOnNetwork({ nonce: new Nonce(0), balance: Balance.eGLD(1000) }));
        this.accounts.set(MockProvider.AddressOfBob.bech32(), new AccountOnNetwork({ nonce: new Nonce(5), balance: Balance.eGLD(500) }));
        this.accounts.set(MockProvider.AddressOfCarol.bech32(), new AccountOnNetwork({ nonce: new Nonce(42), balance: Balance.eGLD(300) }));
    }

    mockUpdateAccount(address: Address, mutate: (item: AccountOnNetwork) => void) {
        let account = this.accounts.get(address.bech32());
        if (account) {
            mutate(account);
        }
    }

    mockUpdateTransaction(hash: TransactionHash, mutate: (item: TransactionOnNetwork) => void) {
        let transaction = this.transactions.get(hash.toString());
        if (transaction) {
            mutate(transaction);
        }
    }

    mockPutTransaction(hash: TransactionHash, item: TransactionOnNetwork) {
        this.transactions.set(hash.toString(), item);
    }

    async mockTransactionTimeline(transactionOrHash: Transaction | TransactionHash, timelinePoints: any[]): Promise<void> {
        let hash = transactionOrHash instanceof TransactionHash ? transactionOrHash : transactionOrHash.hash;
        let timeline = new AsyncTimer(`mock timeline of ${hash}`);
        
        await timeline.start(0);

        for (const point of timelinePoints) {
            if (point instanceof TransactionStatus) {
                this.mockUpdateTransaction(hash, transaction => {
                    transaction.status = point;
                });
            } else if (point instanceof Wait) {
                await timeline.start(point.milliseconds);
            }
        }
    }

    async getAccount(address: Address): Promise<AccountOnNetwork> {
        let account = this.accounts.get(address.bech32());
        if (account) {
            return account;
        }

        return new AccountOnNetwork();
    }

    async getBalance(address: Address): Promise<Balance> {
        let account = await this.getAccount(address);
        return account.balance;
    }

    async getNonce(address: Address): Promise<Nonce> {
        let account = await this.getAccount(address);
        return account.nonce;
    }

    async sendTransaction(transaction: Transaction): Promise<TransactionHash> {
        this.mockPutTransaction(transaction.hash, new TransactionOnNetwork({
            nonce: transaction.nonce,
            sender: transaction.sender,
            receiver: transaction.receiver,
            data: transaction.data,
            status: new TransactionStatus("pending")
        }));

        return transaction.hash;
    }

    async simulateTransaction(_transaction: Transaction): Promise<any> {
        return {};
    }

    async getTransaction(txHash: TransactionHash): Promise<TransactionOnNetwork> {
        let transaction = this.transactions.get(txHash.toString());
        if (transaction) {
            return transaction;
        }

        throw new errors.ErrMock("Transaction not found");
    }

    async getTransactionStatus(txHash: TransactionHash): Promise<TransactionStatus> {
        let transaction = this.transactions.get(txHash.toString());
        if (transaction) {
            return transaction.status;
        }

        throw new errors.ErrMock("Transaction not found");
    }

    async getNetworkConfig(): Promise<NetworkConfig> {
        return new NetworkConfig();
    }


    async getVMValueString(_address: string, _funcName: string, _args: string[]): Promise<string> {
        throw new errors.ErrMock("Not implemented");
    }

    async getVMValueInt(_address: string, _funcName: string, _args: string[]): Promise<bigint> {
        throw new errors.ErrMock("Not implemented");
    }

    async getVMValueHex(_address: string, _funcName: string, _args: string[]): Promise<string> {
        throw new errors.ErrMock("Not implemented");
    }

    async getVMValueQuery(_address: string, _funcName: string, _args: string[]): Promise<any> {
        throw new errors.ErrMock("Not implemented");
    }
}

export class Wait {
    readonly milliseconds: number;

    constructor(milliseconds: number) {
        this.milliseconds = milliseconds;
    }
}