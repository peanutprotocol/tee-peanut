////////////////////////////////////////
// Demo of the a private transfer using PrivatePeanut & IEXEC
// 
// 1. create deposit, get receipt
// 2. Call IEXEC to create a voucher
// 3. Give voucher to 3rd party
// 4. 3rd party redeems voucher from smart contract
// 
////////////////////////////////////////

import * as peanutLibrary from './peanutLibrary.mjs'
import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();


// print all peanutLibrary functions
console.log(peanutLibrary);

const main = async () => {
    
    // 1. CREATE DEPOSIT

    // initialize wallet address from private key
    const wallet = new ethers.Wallet(process.env.DEV_WALLET_PRIVATE_KEY, process.env.POKT_GOERLI_RPC);
    console.log("Wallet address: " + wallet.address);

    // instantiate contract
    console.log(peanutLibrary.PRIVATE_PEANUT_ABI);
    const peanutContract = new ethers.Contract(process.env.GOERLI_CONTRACT_ADDRESS, peanutLibrary.PRIVATE_PEANUT_ABI, wallet);

    // make deposit
    const deposit = await peanutContract.deposit({value: ethers.utils.parseEther("0.0123")});

    // get receipt
    const receipt = await deposit.wait();
    console.log("Receipt: " + JSON.stringify(receipt));

}

main();