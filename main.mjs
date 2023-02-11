////////////////////////////////////////
// Demo of the a private transfer using PrivatePeanut & IEXEC
// 
// 1. create deposit, get receipt
// 2. Call IEXEC to create a voucher
// 3. 3rd party redeems voucher from smart contract
// 
////////////////////////////////////////

import * as peanutLibrary from './peanutLibrary.mjs'
import { ethers } from 'ethers';

// import { IExec } from 'iexec';
import pkg from 'iexec';
const { IExec } = pkg;

import dotenv from 'dotenv';
dotenv.config();


const main = async () => {
    ////////////////////////////////
    // 1. CREATE DEPOSIT
    ////////////////////////////////

    // initialize test wallet and set provider
    const provider = new ethers.providers.JsonRpcProvider(process.env.POKT_GOERLI_RPC);
    const wallet = new ethers.Wallet(process.env.DEV_WALLET_PRIVATE_KEY, provider);

    // instantiate contract
    const peanutContract = new ethers.Contract(process.env.GOERLI_CONTRACT_ADDRESS, peanutLibrary.PRIVATE_PEANUT_ABI, wallet);

    // make deposit
    const tx = await peanutContract.deposit({value: ethers.utils.parseEther("0.0123")});

    // get receipt
    const receipt = await tx.wait();
    console.log("Full Receipt: " + JSON.stringify(receipt));
    const hash = receipt.transactionHash;
    console.log("Hash: " + hash);

    ////////////////////////////////
    // 2. CREATE VOUCHER
    ////////////////////////////////

    // Sign the hash with the wallets private key
    const hashSignature = await wallet.signMessage(hash);
    console.log("Hash Signature: " + hashSignature);

    // Call iexec TEE endpoint to create voucher
    const ethProvider = new ethers.providers.JsonRpcProvider(process.env.POKT_GOERLI_RPC);
    const iexec = new IExec({
        ethProvider,
      });

    // ...? Call iexec
    // See docs: https://github.com/iExecBlockchainComputing/iexec-sdk/blob/HEAD/docs/README.md (backend section)


    ////////////////////////////////
    // 3. GIVE VOUCHER TO 3RD PARTY
    // We assume it was transferred via email or some other secure channel
    ////////////////////////////////

    const wallet2 = new ethers.Wallet(process.env.DEV_WALLET2_PRIVATE_KEY, provider);

    // Withdraw funds from smart contract
    const _recipientAddress = wallet2.address;
    const _amount = 0 // SHOULD BE RETURNED FROM IEXEC
    const _voucherId = 0 // SHOULD BE RETURNED FROM IEXEC
    const _messageHash = hash; // SHOULD BE RETURNED FROM IEXEC
    const _signature = hashSignature; // SHOULD BE RETURNED FROM IEXEC (signed TEE )

    const tx2 = await peanutContract.withdraw(_recipientAddress, _amount, _voucherId, _messageHash, _signature);
    const receipt2 = await tx2.wait();
    console.log("Full Receipt: " + JSON.stringify(receipt2));
    const hash2 = receipt2.transactionHash;
    console.log("Hash: " + hash2);
    

    // 🥳🥳🥳🥳🥳🥳🥳🥳🥳🥳🥳🥳🥳🥳🥳🥳🥳🥳
    console.log(
        `
        ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⠀⠀⠀⠀⠀⠀
       ⠀⠀⠀PEANUT⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣶⣶⣦⣌⠙⠋⢡⣴⣶⡄⠀⠀
       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⣿⣿⣿⡿⢋⣠⣶⣶⡌⠻⣿⠟⠀⠀
       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡆⠸⠟⢁⣴⣿⣿⣿⣿⣿⡦⠉⣴⡇⠀
       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⠟⠀⠰⣿⣿⣿⣿⣿⣿⠟⣠⡄⠹⠀⠀
       ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⢸⡿⢋⣤⣿⣄⠙⣿⣿⡿⠟⣡⣾⣿⣿⠀⠀⠀
       ⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⣾⠿⠀⢠⣾⣿⣿⣿⣦⠈⠉⢠⣾⣿⣿⣿⠏⠀⠀⠀
       ⠀⠀⠀⠀⣀⣤⣦⣄⠙⠋⣠⣴⣿⣿⣿⣿⠿⠛⢁⣴⣦⡄⠙⠛⠋⠁⠀⠀⠀⠀
       ⠀⠀⢀⣾⣿⣿⠟⢁⣴⣦⡈⠻⣿⣿⡿⠁⡀⠚⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
       ⠀⠀⠘⣿⠟⢁⣴⣿⣿⣿⣿⣦⡈⠛⢁⣼⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
       ⠀⢰⡦⠀⢴⣿⣿⣿⣿⣿⣿⣿⠟⢀⠘⠿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
       ⠀⠘⢀⣶⡀⠻⣿⣿⣿⣿⡿⠋⣠⣿⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
       ⠀⠀⢿⣿⣿⣦⡈⠻⣿⠟⢁⣼⣿⣿⠟⠀⠀⠀⠀⠀⠀PEANUT⠀⠀⠀⠀
       ⠀⠀⠈⠻⣿⣿⣿⠖⢀⠐⠿⠟⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
       ⠀⠀⠀⠀⠈⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`
    )
}

main();