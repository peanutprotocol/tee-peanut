////////////////// Private Peanut Library ///////////////////////
//
//  This library provides a set of stable functions to interact
//  with Peanut Protocol.
//
/////////////////////////////////////////////////////////

// import ethers
import { ethers } from "ethers";

// Peanut Contract Addresses on various networks
const PRIVATE_PEANUT_ABI = [{"inputs":[{"internalType":"address","name":"_TEEAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_amount","type":"uint256"},{"indexed":true,"internalType":"address","name":"_senderAddress","type":"address"}],"name":"DepositEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"string","name":"message","type":"string"}],"name":"MessageEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_amount","type":"uint256"},{"indexed":true,"internalType":"address","name":"_recipientAddress","type":"address"}],"name":"WithdrawEvent","type":"event"},{"inputs":[],"name":"TEEAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_TEEAddress","type":"address"}],"name":"setTEEAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"signatures","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_recipientAddress","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"uint256","name":"_voucherId","type":"uint256"},{"internalType":"bytes32","name":"_messageHash","type":"bytes32"},{"internalType":"bytes","name":"_signature","type":"bytes"}],"name":"withdraw","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]


function generateKeysFromString(string) {
    /* generates a deterministic key pair from an arbitrary length string */
    var privateKey = ethers.keccak256(ethers.toUtf8Bytes(string));
    var wallet = new ethers.Wallet(privateKey);
    var publicKey = wallet.publicKey;

    return { address: wallet.address, privateKey: privateKey, publicKey: publicKey };
}


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
    hash_string,
    signMessageWithPrivatekey,
    verifySignature,
    solidityHashBytesEIP191,
    solidityHashAddress,
    signAddress,
    PRIVATE_PEANUT_ABI,
};