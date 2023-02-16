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
const { IExec, IExecConfig, IExecAccountModule, IExecDealModule, IExecWalletModule, IExecAppModule, IExecTaskModule, IExecStorageModule, IExecOrderModule, IExecSecretsModule, IExecResultModule, IExecOrderbookModule, utils } = pkg;


import dotenv from 'dotenv';
dotenv.config();

const APP_ADDRESS = "0x22bf4bff2b40A3BE098892970E079077851eC664";
const DATASET_ADDRESS = "0xe7d615d87Fd6524f7C9d6Ac30123c0B8B9Eb473C";

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

    // UNCOMMENT NEXT LINES IN FINAL VERSION
    // // make deposit
    // const tx = await peanutContract.deposit({value: ethers.utils.parseEther("0.0123")});

    // // get receipt
    // const receipt = await tx.wait();
    // // console.log("Full Receipt: " + JSON.stringify(receipt));
    // const txHash = receipt.transactionHash;
    const receipt = { transactionHash: "0xed89062ab5c2be24c31d1dbd5895133d01f330dd362921a49682ad322de613f8" }
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(receipt.transactionHash));
    // const hash = "0xed89062ab5c2be24c31d1dbd5895133d01f330dd362921a49682ad322de613f8";  // debug hash
    console.log("Transaction Hash: " + hash);

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
        // process.env.POKT_GOERLI_RPC,
        "https://bellecour2.iex.ec/",
        process.env.DEV_WALLET_PRIVATE_KEY
    )
    console.log("Requester address: " + ethProvider.address)
    const config = new IExecConfig({ ethProvider: ethProvider });
    const iexec = IExec.fromConfig(config);

    // also instanciate IExecModules sharing the same configuration
    // const account = IExecAccountModule.fromConfig(config);
    // const iexecWallet = IExecWalletModule.fromConfig(config);
    const iexecApp = IExecAppModule.fromConfig(config);
    const iexecSecrets = IExecSecretsModule.fromConfig(config);



    // result decryption key
    const iexecResults = IExecResultModule.fromConfig(config);
    const isEncryptionKeyAvailable = await iexecResults.checkResultEncryptionKeyExists(ethProvider.address);
    console.log('encryption key available:', isEncryptionKeyAvailable);
    if (!isEncryptionKeyAvailable) {
        const { ekIsPushed } = await iexecResults.pushResultEncryptionKey(
            `-----BEGIN PUBLIC KEY-----
            MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA0gKRKKNCLe1O+A8nRsOc
            gnnvLwE+rpvmKnjOTzoR8ZBTaIjD1dqlhPyJ3kgUnKyCNqru9ayf0srUddwj+20N
            zdLvhI03cYD+GFYM6rrGvaUekGZ43f309f3wOrQjNkTeGo+K+hloHL/gmuN/XML9
            MST/01+mdCImPdG+dxk4RQAsFS7HE00VXsVjcLGeZ95AKILFJKLbCOJxxvsQ+L1g
            rameEwTUF1Mb5TJnV44YZJiCKYFj6/6zrZ3+pdUjxBSN96iOyE2KiYeNuhEEJbjb
            4rWl+TpWLmDkLIeyL3TpDTRedaXVx6h7DOOphX5vG63+5UIHol3vJwPbeODiFWH0
            hpFcFVPoW3wQgEpSMhUabg59Hc0rnXfM5nrIRS+SHTzjD7jpbSisGzXKcuHMc69g
            brEHGJsNnxr0A65PzN1RMJGq44lnjeTPZnjWjM7PnnfH72MiWmwVptB38QP5+tao
            UJu9HvZdCr9ZzdHebO5mCWIBKEt9bLRa2LMgAYfWVg21ARfIzjvc9GCwuu+958GR
            O/VhIFB71aaAxpGmK9bX5U5QN6Tpjn/ykRIBEyY0Y6CJUkc33KhVvxXSirIpcZCO
            OY8MsmW8+J2ZJI1JA0DIR2LHingtFWlQprd7lt6AxzcYSizeWVTZzM7trbBExBGq
            VOlIzoTeJjL+SgBZBa+xVC0CAwEAAQ==
            -----END PUBLIC KEY-----`,
        );
        console.log('encryption key pushed:', ekIsPushed);
    }



    // push ipfs storage token
    const iexecStorage = IExecStorageModule.fromConfig(config);
    const isIpfsStorageInitialized = await iexecStorage.checkStorageTokenExists(ethProvider.address);
    console.log('IPFS storage initialized:', isIpfsStorageInitialized);
    if (!isIpfsStorageInitialized) {
        const token = await iexecStorage.defaultStorageLogin();
        const { isPushed } = await iexecStorage.pushStorageToken(token);
        console.log('default storage initialized:', isPushed);
    }

    // check if dev / app secret exists
    const isSecretSet = await iexecApp.checkAppSecretExists(APP_ADDRESS);
    console.log('app secret set:', isSecretSet);

    // push secrets to the SMS
    try {
        const secret1 = await iexecSecrets.pushRequesterSecret("signature", hashSignature);
        const secret2 = await iexecSecrets.pushRequesterSecret("voucherid", "sampleVoucherId");
    } catch (error) {
        console.log("Error pushing secrets to SMS: " + error);
        // secrets probably already exist
    }
    // check that secrets are pushed
    const secret1Check = await iexecSecrets.checkRequesterSecretExists(ethProvider.address, "signature");
    const secret2Check = await iexecSecrets.checkRequesterSecretExists(ethProvider.address, "voucherid");
    console.log("Secret 1: " + secret1Check);
    console.log("Secret 2: " + secret2Check);


    // Create, sign and publish app order (apparently we need this BEFORE request order?)
    const ethProviderOwner = utils.getSignerFromPrivateKey(
        // process.env.POKT_GOERLI_RPC,
        "https://bellecour2.iex.ec/",
        process.env.IEXEC_WALLET_PRIVATE_KEY
    )
    const configOwner = new IExecConfig({ ethProvider: ethProviderOwner });
    const iexecordermoduleOwner = IExecOrderModule.fromConfig(configOwner);

    const apporderTemplate = await iexecordermoduleOwner.createApporder({ app: APP_ADDRESS });
    const signedApporder = await iexecordermoduleOwner.signApporder(apporderTemplate);
    const apporderHash = await iexecordermoduleOwner.publishApporder(signedApporder);
    console.log('Published App Order: ', apporderHash);


    // create request order
    const iexecordermodule = IExecOrderModule.fromConfig(config);

    // prerequisities: app developer secret (without 0x) & secret dataset pushed to the SMS
    const requestorderTemplate = await iexecordermodule.createRequestorder({
        // app: '0x6B2f9C513E51965A0dB9BA1EEa5bC81E5Fc7C711', // non-tee old app
        app: APP_ADDRESS, // new tee app
        category: 0,
        params: {
            iexec_args: hash + ' ' + receipt.transactionHash,//'TODO: msgHash msg',
            dataset: DATASET_ADDRESS,
            tag: "tee",
            // iexec_secrets: { 
            //     "1": "signature", //"TODO: msgSig",
            //     "2": "voucherid" //"TODO: voucherId"
            // },
            iexec_result_encryption: true
        }
    });
    // sign request order 
    const signedRequestorder = await iexecordermodule.signRequestorder(requestorderTemplate);
    // publish request order
    const requestOrderHash = await iexecordermodule.publishRequestorder(signedRequestorder);
    console.log("\nPublished Request order: " + requestOrderHash);


    // now we need to find a workerpool order and match it with the request order and app order?
    const iexecOrderbook = IExecOrderbookModule.fromConfig(config);

    // get workerpool order
    const { count, orders } = await iexecOrderbook.fetchWorkerpoolOrderbook();
    const workerpoolorder = orders[0]?.order;

    // FINALLY: MATCH ORDERS
    const { orders: appOrders } = await iexecOrderbook.fetchAppOrderbook(
        APP_ADDRESS
    );
    // const appOrder = appOrders && appOrders[0] && appOrders[0].order;
    // if (!appOrder) throw Error(`no apporder found for app ${APP_ADDRESS}`);
    
    // const dealId = "0xf335a1a7ff88caaf383197e12bea4fa771647bc881431d5cc30fcc1a42c6b20d" // debug (apparently can only be one deal at a time?)
    const { dealId, taskTxHash } = await iexecordermodule.matchOrders({
        apporder: signedApporder,
        requestorder: signedRequestorder,
        workerpoolorder: workerpoolorder,
    });
    console.log(`created deal ${dealId} in tx ${taskTxHash}`);
    // get taskId from dealId
    const iexecDeal = IExecDealModule.fromConfig(config);
    const deal = await iexecDeal.show(dealId);
    const taskId = deal.tasks["0"];
    console.log("taskId from deal: " + taskId);


    // FINALLLLYYY get results
    const iexecTask = IExecTaskModule.fromConfig(config);
    
    console.log("Fetching results... (this may take a while)");
    // try every 5 minutes to get the results
    var res = null;
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    for (let i = 0; i < 20; i++) {
        try {
            res = await iexecTask.fetchResults(taskId, {
                ipfsGatewayURL: "https://ipfs.iex.ec"
            });
            console.log("res: " + res);
            //the results are in the following format: {"msg": ["voucherId;amount"], "msg_hash": [sign_msg.messageHash.hex()], "sig": [sign_msg.signature.hex()]}
            break;
        } catch (error) {
            console.log("Error fetching results: " + error);
            console.log("Retrying in 5 minutes...");
            await sleep(300000);
        }
    }
    //the results are in the following format: {"msg": ["voucherId;amount"], "msg_hash": [sign_msg.messageHash.hex()], "sig": [sign_msg.signature.hex()]}

    ////////////////////////////////
    // 3. GIVE VOUCHER TO 3RD PARTY
    // We assume it was transferred via email or some other secure channel
    ////////////////////////////////
    console.log("\nRedeeming voucher...");
    console.log("Error: returning for now, first have to get iexec result from ipfs");

    const wallet2 = new ethers.Wallet(process.env.DEV_WALLET2_PRIVATE_KEY, provider);

    // Withdraw funds from smart contract
    const _recipientAddress = wallet2.address;
    const _amount = 0 // SHOULD BE RETURNED FROM IEXEC
    const _voucherId = 0 // SHOULD BE RETURNED FROM IEXEC
    const _messageHash = hash; // SHOULD BE RETURNED FROM IEXEC
    const _signature = hashSignature; // SHOULD BE RETURNED FROM IEXEC (signed TEE )

    return;

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