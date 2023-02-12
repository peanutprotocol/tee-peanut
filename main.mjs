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
// i'll never understand js imports
import pkg from 'iexec';
const { IExec, IExecConfig, IExecAccountModule, IExecWalletModule, IExecOrderModule, IExecSecretsModule, utils } = pkg;


import dotenv from 'dotenv';
dotenv.config();


const main = async () => {
    ////////////////////////////////
    // 1. CREATE DEPOSIT
    ////////////////////////////////
    console.log("\nCreating deposit...");

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
    const txHash = receipt.transactionHash;
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(receipt.transactionHash));
    // const hash = "0xed89062ab5c2be24c31d1dbd5895133d01f330dd362921a49682ad322de613f8";  // debug hash
    console.log("Hash: " + hash);

    ////////////////////////////////
    // 2. CREATE VOUCHER
    ////////////////////////////////
    console.log("\nCreating voucher...");

    // Sign the hash with the wallets private key
    const hashSignature = await wallet.signMessage(hash);
    console.log("Hash Signature: " + hashSignature);

    // Call iexec TEE endpoint to create voucher

    // instanciate iExec SDK
    const ethProvider = utils.getSignerFromPrivateKey(
        process.env.POKT_GOERLI_RPC,
        process.env.DEV_WALLET_PRIVATE_KEY
    )
    const config = new IExecConfig({ ethProvider: ethProvider });
    const iexec = IExec.fromConfig(config);

    // also instanciate IExecModules sharing the same configuration
    // const account = IExecAccountModule.fromConfig(config);
    // const iexecWallet = IExecWalletModule.fromConfig(config);
    const iexecSecrets = IExecSecretsModule.fromConfig(config);


    // create request order
    const iexecordermodule = IExecOrderModule.fromConfig(config);

    // I think here we have to use pushRequesterSecret ?
    // @dev: im getting error that SMS doesnt work on goerli. I'm assuming
    // push secrets to the SMS
    const secret1 = await iexecSecrets.pushRequesterSecret("1", hashSignature);
    const secret2 = await iexecSecrets.pushRequesterSecret("2", "sampleVoucherId");

    // check that secrets are pushed
    const secret1Check = await iexecSecrets.checkRequesterSecretExists("1", ethProvider.address);
    const secret2Check = await iexecSecrets.checkRequesterSecretExists("2", ethProvider.address);
    console.log("Secret 1: " + secret1Check);
    console.log("Secret 2: " + secret2Check);


    // prerequisities: app developer secret (without 0x) & secret dataset pushed to the SMS
    const requestorderTemplate = await iexecordermodule.createRequestorder({
        // app: '0x6B2f9C513E51965A0dB9BA1EEa5bC81E5Fc7C711', // non-tee old app
        app: '0x22bf4bff2b40A3BE098892970E079077851eC664', // new tee app
        category: 0,
        params: {
            iexec_args: hash+' '+receipt.transactionHash,//'TODO: msgHash msg',
            iexec_secrets: {
                "1": hashSignature,//"TODO: msgSig",
                "2": "sampleVoucherId"//"TODO: voucherId"
            },
            dataset: "TODO: input secret dataset id",
            tag: "tee",
            iexec_result_encryption: true
        }
       });
    console.log("\nRequest order: " + JSON.stringify(requestorderTemplate));
    // sign request order 
    const signedRequestorder = await iexecordermodule.signRequestorder(requestorderTemplate);
    console.log("\nSigned Request order: " + JSON.stringify(signedRequestorder));
    // publish request order
    const publishedRequestorder = await iexecordermodule.publishRequestorder(signedRequestorder);
    console.log("\nPublished Request order: " + JSON.stringify(publishedRequestorder));
    
    // ...? Get computation result?
    //the results are in the following format: {"msg": ["voucherId;amount"], "msg_hash": [sign_msg.messageHash.hex()], "sig": [sign_msg.signature.hex()]}

    ////////////////////////////////
    // 3. GIVE VOUCHER TO 3RD PARTY
    // We assume it was transferred via email or some other secure channel
    ////////////////////////////////
    console.log("\nRedeeming voucher...");

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