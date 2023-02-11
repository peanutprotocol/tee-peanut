import os
import sys
import json
from web3 import Web3
import requests
from collections import Counter
from eth_account import Account
from eth_account.messages import encode_defunct


try:
    iexec_out = os.environ["IEXEC_OUT"]
    iexec_in = os.environ["IEXEC_IN"]
    dataset_filename = os.environ["IEXEC_DATASET_FILENAME"]

    NETWORK = "goerli"
    NETWORK_NAMES = {
        "infura": {"goerli": "goerli"},
        "alchemy": {"goerli": "eth-goerli"},
        "pokt": {"goerli": "eth-goerli"},
    }

    ################### LOGIC BODY START ###################

    try:
        # dev_secret stores the TEE's private key, must not be prepended with a 0x
        dev_secret = os.environ["IEXEC_APP_DEVELOPER_SECRET"]
    except Exception:
        print("missing IEXEC_APP_DEVELOPER_SECRET")
        exit(1)

    try:
        # req_secret_1 stores depositor's message signature
        req_secret_1 = os.environ["IEXEC_REQUESTER_SECRET_1"]
    except Exception:
        print("missing IEXEC_REQUESTER_SECRET_1")
        exit(1)

    try:
        # req_secret_2 stores voucher id to generate. TODO: replace getting voucher id from requester with a hash of txId + privateKey
        req_secret_2 = os.environ["IEXEC_REQUESTER_SECRET_2"]
    except Exception:
        print("missing IEXEC_REQUESTER_SECRET_1")
        exit(1)

    try:
        dataset_file = open(iexec_in + "/" + dataset_filename, "r")
        dataset = dataset_file.read()
        API_KEYS = json.loads(dataset)
    except OSError:
        print("confidential file does not exists or data corrupted")
        exit(1)

    # sys.argv stores depositor's message and message hash in a string, seperated with a whitespace
    if (
        len(sys.argv) != 3
        or not isinstance(sys.argv[1], str)
        or not isinstance(sys.argv[2], str)
    ):
        print("arguments ill-defined")
        exit(1)

    ### 0) read args, verify message hash and recover signer from signature
    e_message_hash = sys.argv[1]  # TODO: verify order of args
    e_message = sys.argv[2]
    i_message_hash = Web3.keccak(
        b"\x19Ethereum Signed Message:\n32" + Web3.keccak(hexstr=e_message)
    )

    # assert hashes match
    if i_message_hash.hex() != e_message_hash:
        print("hashes not equal")
        exit(1)

    # recover signer
    signer = Account.recoverHash(e_message_hash, signature=req_secret_1)

    ### 1) iExecTeeApp will check 3 blockchain data providers (e.g. alchemy, moralis, infura) to confirm if the tx has been included in a block and whether the details check out. API keys will be stored in a confidential asset (encrypted dataset)
    oracle_depositor = Counter()
    oracle_amount = Counter()
    oracle_to = Counter()
    # get tx info from alchemy https://docs.alchemy.com/reference/eth-gettransactionbyhash
    url = f"https://{NETWORK_NAMES['alchemy'][NETWORK]}.g.alchemy.com/v2/{API_KEYS['alchemy']}"
    payload = {
        "id": 1,
        "jsonrpc": "2.0",
        "params": [e_message],
        "method": "eth_getTransactionByHash",
    }
    headers = {"accept": "application/json", "content-type": "application/json"}

    response = requests.post(url, json=payload, headers=headers)

    json_response = json.loads(response.text)
    if isinstance(json_response["result"]["blockHash"], str):
        oracle_depositor.update([json_response["result"]["from"]])
        oracle_amount.update([json_response["result"]["value"]])
        oracle_to.update([json_response["result"]["to"]])

    # get tx info from infura https://docs.infura.io/infura/networks/ethereum/json-rpc-methods/eth_gettransactionbyhash
    url = (
        f"https://{NETWORK_NAMES['infura'][NETWORK]}.infura.io/v3/{API_KEYS['infura']}"
    )
    payload = {
        "id": 1,
        "jsonrpc": "2.0",
        "params": [e_message],
        "method": "eth_getTransactionByHash",
    }
    headers = {"accept": "application/json", "content-type": "application/json"}

    response = requests.post(url, json=payload, headers=headers)

    json_response = json.loads(response.text)
    if isinstance(json_response["result"]["blockHash"], str):
        oracle_depositor.update([json_response["result"]["from"]])
        oracle_amount.update([json_response["result"]["value"]])
        oracle_to.update([json_response["result"]["to"]])

    # get tx info from pokt
    url = f"https://{NETWORK_NAMES['pokt'][NETWORK]}.gateway.pokt.network/v1/lb/{API_KEYS['pokt']}"
    payload = {
        "id": 1,
        "jsonrpc": "2.0",
        "params": [e_message],
        "method": "eth_getTransactionByHash",
    }
    headers = {"accept": "application/json", "content-type": "application/json"}

    response = requests.post(url, json=payload, headers=headers)

    json_response = json.loads(response.text)
    if isinstance(json_response["result"]["blockHash"], str):
        oracle_depositor.update([json_response["result"]["from"]])
        oracle_amount.update([json_response["result"]["value"]])
        oracle_to.update([json_response["result"]["to"]])

    # sum up the oracle info
    most_common_depositor = Counter(oracle_depositor).most_common(1)
    most_common_amount = Counter(oracle_amount).most_common(1)
    most_common_to = Counter(oracle_to).most_common(1)
    depositor = None if most_common_depositor[0][1] < 2 else most_common_depositor[0][0]
    amount = None if most_common_amount[0][1] < 2 else most_common_amount[0][0]
    to = None if most_common_to[0][1] < 2 else most_common_to[0][0]

    # assert oracle consensus
    if depositor is None or amount is None or to is None:
        print("no oracle consensus")
        exit(1)

    if to != "0x084012de7258604b7ddfed69da102eb52d13ce02":
        print("deposit recipient not a peanut smartcontract")
        exit(1)

    # assert signer is the depositor
    if signer.lower() != depositor.lower():
        print("wrong signer")
        exit(1)

    ### 2) check if voucher for tx not generated before
    ## TODO: check against an iExec dataset

    ### 3) if all is ok then the iExecTeeApp will sign a message (containing voucher_id and amount) with its own priv key (taken from DEVELOPER_SECRET)
    message = req_secret_2 + ";" + amount  # TODO: settle on msg structure
    message_hash = Web3.keccak(text=message)
    sign_msg = Account.sign_message(
        encode_defunct(hexstr=message_hash.hex()),
        private_key=bytearray.fromhex(dev_secret),
    )  # dev_secret must not be prepended with 0x

    ### 4) set a confidential flag that for this txId, voucherId already generated
    ## TODO: update the iExec dataset

    ### 5) and return the results in a "protected mode"
    # Append some results in /iexec_out/
    with open(iexec_out + "/result.txt", "w+") as fout:
        json.dump(
            {
                "msg": message,
                "msg_hash": sign_msg.messageHash.hex(),
                "sig": sign_msg.signature.hex(),
            },
            fout,
        )

    #################### LOGIC BODY END ####################

    # Declare everything is computed
    with open(iexec_out + "/computed.json", "w+") as f:
        json.dump({"deterministic-output-path": iexec_out + "/result.txt"}, f)

except Exception as e:
    # do not log anything that could reveal the app developer secret!
    print("something went wrong!")
    print(e)
    exit(1)
