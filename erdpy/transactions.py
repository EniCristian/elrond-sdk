import base64
import json
import logging
from collections import OrderedDict
from typing import Any, Dict

from erdpy import errors, utils
from erdpy.accounts import Account, Address
from erdpy.interfaces import IElrondProxy, ITransaction
from erdpy.wallet import signing

logger = logging.getLogger("transactions")


class Transaction(ITransaction):
    def __init__(self):
        self.hash = ""
        self.nonce = 0
        self.value = "0"
        self.sender = ""
        self.receiver = ""
        self.gasPrice = 0
        self.gasLimit = 0
        self.data = ""
        self.chainID = ""
        self.version = 0
        self.signature = ""

    # The data field is base64-encoded. erdpy only supports utf-8 "data" at this moment.
    def data_encoded(self) -> str:
        data_bytes = self.data.encode("utf-8")
        data_base64 = base64.b64encode(data_bytes).decode()
        return data_base64

    # Useful when loading a tx from a file (when data is already encoded in base64)
    def data_decoded(self) -> str:
        return base64.b64decode(self.data).decode()

    def sign(self, account: Account):
        self.signature = signing.sign_transaction(self, account)

    def serialize(self) -> bytes:
        dictionary = self.to_dictionary()
        serialized = self._dict_to_json(dictionary)
        return serialized

    def _dict_to_json(self, dictionary: Dict[str, Any]):
        serialized = json.dumps(dictionary, separators=(',', ':')).encode("utf8")
        return serialized

    def serialize_as_inner(self):
        inner_dictionary = self.to_dictionary_as_inner()
        serialized = self._dict_to_json(inner_dictionary)
        serialized_hex = serialized.hex()
        return f"relayedTx@{serialized_hex}"

    @classmethod
    def load_from_file(cls, f: Any):
        data_json: bytes = utils.read_file(f).encode()
        fields = json.loads(data_json).get("tx")
        instance = cls()
        instance.__dict__.update(fields)
        instance.data = instance.data_decoded()
        return instance

    def dump_to(self, f: Any, extra: Any = {}):
        dump: Any = utils.Object()
        dump.tx = self.to_dictionary()
        dump.hash = self.hash or ""
        dump.data = self.data
        dump.__dict__.update(extra)
        f.writelines([dump.to_json(), "\n"])

    def send(self, proxy: IElrondProxy):
        if not self.signature:
            raise errors.TransactionIsNotSigned()

        logger.info(f"Transaction.send: nonce={self.nonce}")

        dictionary = self.to_dictionary()
        self.hash = proxy.send_transaction(dictionary)
        logger.info(f"Hash: {self.hash}")
        return self.hash

    def simulate(self, proxy: IElrondProxy):
        if not self.signature:
            raise errors.TransactionIsNotSigned()

        dictionary = self.to_dictionary()
        return proxy.simulate_transaction(dictionary)

    def to_dictionary(self) -> Dict[str, Any]:
        dictionary: Dict[str, Any] = OrderedDict()
        dictionary["nonce"] = self.nonce
        dictionary["value"] = self.value
        dictionary["receiver"] = self.receiver
        dictionary["sender"] = self.sender
        dictionary["gasPrice"] = self.gasPrice
        dictionary["gasLimit"] = self.gasLimit

        if self.data:
            dictionary["data"] = self.data_encoded()

        dictionary["chainID"] = self.chainID
        dictionary["version"] = int(self.version)

        if self.signature:
            dictionary["signature"] = self.signature

        return dictionary

    # Creates the payload for a "user" / "inner" transaction
    def to_dictionary_as_inner(self) -> Dict[str, Any]:
        dictionary = self.to_dictionary()
        dictionary["receiver"] = base64.b64encode(Address(self.receiver).pubkey()).decode()
        dictionary["sender"] = base64.b64encode(Address(self.sender).pubkey()).decode()
        dictionary["chainID"] = base64.b64encode(self.chainID.encode()).decode()
        dictionary["signature"] = base64.b64encode(bytes(bytearray.fromhex(self.signature))).decode()
        dictionary["value"] = int(self.value)

        return dictionary

    def wrap_inner(self, inner: ITransaction) -> None:
        self.data = inner.serialize_as_inner()


class BunchOfTransactions:
    def __init__(self):
        self.transactions = []

    def add_prepared(self, transaction: Transaction):
        self.transactions.append(transaction)

    def add(self, sender: Account, receiver_address: str, nonce: Any, value: Any, data: str, gas_price: int, gas_limit: int, chain: str, version: int):
        tx = Transaction()
        tx.nonce = int(nonce)
        tx.value = str(value)
        tx.sender = sender.address.bech32()
        tx.receiver = receiver_address
        tx.gasPrice = gas_price
        tx.gasLimit = gas_limit
        tx.data = data
        tx.chainID = chain
        tx.version = version

        tx.sign(sender)
        self.transactions.append(tx)

    def add_in_sequence(self):
        pass

    def send(self, proxy: IElrondProxy):
        logger.info(f"BunchOfTransactions.send: {len(self.transactions)} transactions")
        payload = [transaction.to_dictionary() for transaction in self.transactions]
        num_sent, hashes = proxy.send_transactions(payload)
        logger.info(f"Sent: {num_sent}")
        logger.info(f"TxsHashes: {hashes}")
        return num_sent, hashes


def do_prepare_transaction(args: Any) -> Transaction:
    account = Account()
    if args.pem:
        account = Account(pem_file=args.pem, pem_index=args.pem_index)
    elif args.keyfile and args.passfile:
        account = Account(key_file=args.keyfile, pass_file=args.passfile)

    tx = Transaction()
    tx.nonce = int(args.nonce)
    tx.value = args.value
    tx.sender = account.address.bech32()
    tx.receiver = args.receiver
    tx.gasPrice = int(args.gas_price)
    tx.gasLimit = int(args.gas_limit)
    tx.data = args.data
    tx.chainID = args.chain
    tx.version = int(args.version)

    tx.sign(account)
    return tx
