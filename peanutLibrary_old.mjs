////////////////// Peanut Library ///////////////////////
//
//  This library provides a set of stable functions to interact
//  with Peanut Protocol.
//
/////////////////////////////////////////////////////////

// import ethers
import { ethers } from "ethers";

// Peanut Contract Addresses on various networks
// Please use the latest version of the contract (v3)
const PEANUT_CONTRACTS = {"ethereum":{"mainnet":{"v3":"0xdB60C736A30C41D9df0081057Eae73C3eb119895"},"goerli":{"v1":"0x616d197A29E50EBD08a4287b26e47041286F171D","v2":"0xd4964Df4dc2eb6B2fD4157DFda264AA9dd720C92","v3":"0xd068b1F6F0623CbCC7ADC7545290f8991C9B8Ec9"}},"polygon":{"mainnet":{"v1":"0xB184b7D19d747Db9084C355b5B6a093d7063B710","v2":"0x45fd48f58c47d929E9D181837fBB7Cda1974a773","v3":"0xCEd763C2Ff8d5B726b8a5D480c17C24B6686837F"},"mumbai":{}},"optimism":{"mainnet":{"v1":"0x9B0817fA08b46670B92300B58AA1f4AB155701ea","v3":"0x1aBe03DC4706aE47c4F2ae04EEBe5c8607c74e17"},"kovan":{}},"arbitrum":{"mainnet":{"v1":"0x8d1a17A3A4504aEB17515645BA8098f1D75237f7","v3":"0x9B0817fA08b46670B92300B58AA1f4AB155701ea"},"rinkeby":{}},"xdai":{"mainnet":{"v1":"0x8d1a17A3A4504aEB17515645BA8098f1D75237f7","v3":"0x897F8EDdB345F0d16081615823F76055Ad60A00c"},"testnet":{}},"bsc":{"mainnet":{"v3":"0x8d1a17A3A4504aEB17515645BA8098f1D75237f7"},"testnet":{}},"solana":{"mainnet":{},"devnet":{}},"moonbeam":{"mainnet":{"v1":"0xF5D83DF662f58255D9E9d5fe9a59ac7Cd1eF85BC"},"moonbase":{}},"avalanche":{"mainnet":{"v1":"0x8d1a17A3A4504aEB17515645BA8098f1D75237f7"},"fuji":{}},"fantom":{"mainnet":{},"testnet":{}},"harmony":{"mainnet":{},"testnet":{}}};
const PEANUT_ABI_V3 = [{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "_index", "type": "uint256" }, { "indexed": false, "internalType": "uint8", "name": "_contractType", "type": "uint8" }, { "indexed": false, "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "_senderAddress", "type": "address" }], "name": "DepositEvent", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "string", "name": "message", "type": "string" }], "name": "MessageEvent", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "_index", "type": "uint256" }, { "indexed": false, "internalType": "uint8", "name": "_contractType", "type": "uint8" }, { "indexed": false, "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "_recipientAddress", "type": "address" }], "name": "WithdrawEvent", "type": "event" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "deposits", "outputs": [{ "internalType": "address", "name": "pubKey20", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "address", "name": "tokenAddress", "type": "address" }, { "internalType": "uint8", "name": "contractType", "type": "uint8" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getDepositCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_tokenAddress", "type": "address" }, { "internalType": "uint8", "name": "_contractType", "type": "uint8" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "uint256", "name": "_tokenId", "type": "uint256" }, { "internalType": "address", "name": "_pubKey20", "type": "address" }], "name": "makeDeposit", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_operator", "type": "address" }, { "internalType": "address", "name": "_from", "type": "address" }, { "internalType": "uint256[]", "name": "_ids", "type": "uint256[]" }, { "internalType": "uint256[]", "name": "_values", "type": "uint256[]" }, { "internalType": "bytes", "name": "_data", "type": "bytes" }], "name": "onERC1155BatchReceived", "outputs": [{ "internalType": "bytes4", "name": "", "type": "bytes4" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_operator", "type": "address" }, { "internalType": "address", "name": "_from", "type": "address" }, { "internalType": "uint256", "name": "_tokenId", "type": "uint256" }, { "internalType": "uint256", "name": "_value", "type": "uint256" }, { "internalType": "bytes", "name": "_data", "type": "bytes" }], "name": "onERC1155Received", "outputs": [{ "internalType": "bytes4", "name": "", "type": "bytes4" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_operator", "type": "address" }, { "internalType": "address", "name": "_from", "type": "address" }, { "internalType": "uint256", "name": "_tokenId", "type": "uint256" }, { "internalType": "bytes", "name": "_data", "type": "bytes" }], "name": "onERC721Received", "outputs": [{ "internalType": "bytes4", "name": "", "type": "bytes4" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes4", "name": "_interfaceId", "type": "bytes4" }], "name": "supportsInterface", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_index", "type": "uint256" }, { "internalType": "address", "name": "_recipientAddress", "type": "address" }, { "internalType": "bytes32", "name": "_recipientAddressHash", "type": "bytes32" }, { "internalType": "bytes", "name": "_signature", "type": "bytes" }], "name": "withdrawDeposit", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }];


function generateKeysFromString(string) {
    /* generates a deterministic key pair from an arbitrary length string */
    var privateKey = ethers.keccak256(ethers.toUtf8Bytes(string));
    var wallet = new ethers.Wallet(privateKey);
    var publicKey = wallet.publicKey;

    return { address: wallet.address, privateKey: privateKey, publicKey: publicKey };
}

/////////////////////////////////////////////////////////
//
// Generating a deposit link
//
// How to send $ using a trustless link
//
/////////////////////////////////////////////////////////

// lets make a simple eth deposit!
async function makeSampleDeposit(Signer, amount, chain) {
    console.log(PEANUT_CONTRACTS)
    const contractType = 0;  // 0 for eth, 1 for erc20, 2 for erc721, 3 for erc1155
    const tx_options = {
        value: ethers.utils.parseEther(amount),
    };

    // IMPORTANT: generate private public key pair deterministically from a string with sufficient entropy
    const password = "securePassword123";
    const keys = generateKeysFromString(password);

    // these values are unnecessary for eth deposits, but we set them to 0 for clarity
    const tokenId = 0;
    const tokenAddress = ethers.constants.AddressZero;
    amount = ethers.utils.parseEther("0");

    // get the contract instance
    const contract = new ethers.Contract(
        PEANUT_CONTRACTS[chain][subchain]["v3"],
        PEANUT_ABI_V3,
        Signer, // you'll need to pass in a signer here
    );

    // make the deposit!
    var tx = await contract.makeDeposit(
        tokenAddress,
        contractType,
        tokenAmount,
        tokenId,
        keys.address,
        tx_options
    );

    // now we need the deposit index from the tx receipt
    var txReceipt = await tx.wait();
    var events = txReceipt.events;
    if (chain == "polygon") {
        var depositIndex = events[events.length - 2].args[0]["_hex"];
        // var depositIndex = events[1].args[2]["_hex"];
    } else {
        var depositIndex = events[events.length - 1].args[0]["_hex"];
        // var depositIndex = events[0].args[2]["_hex"];
    }
    depositIndex = parseInt(depositIndex, 16);

    // now that we have the deposit index, we are finally ready to generate the link!
    const baseUrl = 'https://peanut.to/claim';
    // you can also use an endpoint on your own server to claim the deposit, or use the (COMING SOON) IPFS dApp
    // params = f"?c={chain_idx}&v={deposit_details['contract_version']}&i={deposit_details['deposit_index']}&p={deposit_details['password']}"
    const link = baseUrl + '?c=' + chain + '&v=3' + '&i=' + depositIndex + '&p=' + password
    console.log(link);
    return link;

    // And that's it! The user can now send the trustless link to his frens!
}


/////////////////////////////////////////////////////////
//
// Claiming a deposit
//
// Coming soon! Tutorial will be out by Jan 28th
//
/////////////////////////////////////////////////////////

// functions we'll need for the second part of the tutorial:

function hash_string(str) {
    /*
    1. convert to bytes, 2. right pad to 32 bytes, 3. hash
    */
    let hash = ethers.utils.toUtf8Bytes(str);
    hash = ethers.utils.hexlify(hash);
    hash = ethers.utils.hexZeroPad(hash, 32);
    hash = ethers.keccak256(hash);
    return hash;
}


async function signMessageWithPrivatekey(message, privateKey) {
    /* signs a message with a private key and returns the signature
        THIS SHOULD BE AN UNHASHED, UNPREFIXED MESSAGE
    */
    var signer = new ethers.Wallet(privateKey);
    return signer.signMessage(message);  // this calls ethers.utils.hashMessage and prefixes the hash
}


function verifySignature(message, signature, address) {
    /* verifies a signature with a public key and returns true if valid */
    const messageSigner = ethers.utils.verifyMessage(message, signature);
    return messageSigner == address;
}


function solidityHashBytesEIP191(bytes) {
    // assert input is Uint8Array
    assert(bytes instanceof Uint8Array);
    return ethers.utils.hashMessage(bytes);
}

function solidityHashAddress(address) {
    /* hashes an address to a 32 byte hex string */
    return ethers.utils.solidityKeccak256(["address"], [address]);
}


async function signAddress(string, privateKey) {
    // assert string is an address (starts with 0x and is 42 chars long)
    assert(string.startsWith("0x") && string.length == 42, "String is not an address");

    /// 1. hash plain address
    const stringHash = ethers.utils.solidityKeccak256(["address"], [string]);
    const stringHashbinary = ethers.utils.arrayify(stringHash);

    /// 2. add eth msg prefix, then hash, then sign
    var signer = new ethers.Wallet(privateKey);
    var signature = await signer.signMessage(stringHashbinary);  // this calls ethers.utils.hashMessage and prefixes the hash
    return signature;
}


export {
    generateKeysFromString,
    makeSampleDeposit,
    hash_string,
    signMessageWithPrivatekey,
    verifySignature,
    solidityHashBytesEIP191,
    solidityHashAddress,
    signAddress,
    PRIVATE_PEANUT_ABI,
};