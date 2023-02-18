////////////////////////////////////////
// Demo of the a private transfer using PrivatePeanut & IEXEC
// 
// 1. create deposit, get receipt
// 2. Call IEXEC to create a voucher
// 3. 3rd party redeems voucher from smart contract
// 
////////////////////////////////////////

import * as peanutLibrary from './peanutLibrary.mjs'
import { ethers, BigNumber } from 'ethers';
import StreamZip from 'node-stream-zip';
import * as fs from 'fs';
import pkg from 'iexec';
const { IExec, IExecConfig, IExecAccountModule, IExecDealModule, IExecWalletModule, IExecAppModule, IExecTaskModule, IExecStorageModule, IExecOrderModule, IExecSecretsModule, IExecResultModule, IExecOrderbookModule, utils } = pkg;

import dotenv from 'dotenv';
dotenv.config();

const APP_ADDRESS = "0x16c5eE85CA60C301a32Abb705e6098a4c3B7840E";
const DATASET_ADDRESS = "0xe7d615d87Fd6524f7C9d6Ac30123c0B8B9Eb473C";
const CATEGORY = 0;
const WORKERPOOL_ADDERSS = "0x9849E7496CdBFf132c84753591D09B181c25f29a"; // workerpool v7-debug.main.pools.iexec.eth // 0xeb14dc854a8873e419183c81a657d025ec70276b v7-prod.main.pools.iexec.eth
const VOUCHER_ID = "1"
const MAX = 1000;
const SMS_URL = "https://v7.sms.debug-tee-services.bellecour.iex.ec/";
const CHAIN_ID = "134";
const CHAIN_HTTP = "https://bellecour2.iex.ec/";

function getRandomString() {
    return Math.floor(Math.random() * MAX).toString();
  }

const main = async () => {
    // ////////////////////////////////
    // // 1. CREATE DEPOSIT
    // ////////////////////////////////
    // console.log("\nCreating deposit...");

    // // initialize test wallet and set provider
    const provider = new ethers.providers.JsonRpcProvider(process.env.POKT_GOERLI_RPC);
    const wallet = new ethers.Wallet(process.env.DEV_WALLET_PRIVATE_KEY, provider);

    // instantiate contract
    const peanutContract = new ethers.Contract(process.env.GOERLI_CONTRACT_ADDRESS, peanutLibrary.PRIVATE_PEANUT_ABI, wallet);

    //UNCOMMENT NEXT LINES IN FINAL VERSION
    // make deposit
    // const tx = await peanutContract.deposit({value: ethers.utils.parseEther("0.0123")});

    // // get receipt
    // const receipt = await tx.wait();
    // // console.log("Full Receipt: " + JSON.stringify(receipt));
    // const txHash = receipt.transactionHash;
    const receipt = { transactionHash: "0xed89062ab5c2be24c31d1dbd5895133d01f330dd362921a49682ad322de613f8" }

    ////////////////////////////////
    // 2. CREATE VOUCHER
    ////////////////////////////////
    console.log("\nCreating voucher...");

    // Calculating message's hash
    const stringHash = ethers.utils.solidityKeccak256(["address"], [receipt.transactionHash]);
    // alternative way to solidityKeccak256(["address"], [receipt.transactionHash]); below
    // var stringHash = ethers.utils.keccak256(receipt.transactionHash);

    const msgHash = ethers.utils.hashMessage(ethers.utils.arrayify(stringHash))
    console.log("msgHash: " + msgHash);

    // Sign the hash with the wallets private key
    const stringHashbinary = ethers.utils.arrayify(stringHash);
    const signature = await wallet.signMessage(stringHashbinary);
    console.log("SECRET: Signature: " + signature);

    // Call iexec TEE endpoint to create voucher

    // instanciate iExec SDK
    const ethProvider = utils.getSignerFromPrivateKey(
        CHAIN_HTTP,
        process.env.DEV_WALLET_PRIVATE_KEY
    )
    const configArgs = { ethProvider: ethProvider, chainId: CHAIN_ID };
    const configOptions = { smsURL: SMS_URL };
    const iexec = new IExec(configArgs, configOptions);

    console.log("Requester address: " + ethProvider.address)
    const config = new IExecConfig({ ethProvider: ethProvider });

    // result decryption key
    console.log("\nENCRYPTION KEY...");
    const isEncryptionKeyAvailable = await iexec.result.checkResultEncryptionKeyExists(ethProvider.address);
    console.log('encryption key available:', isEncryptionKeyAvailable);
    if (!isEncryptionKeyAvailable) {
        const { ekIsPushed } = await iexec.result.pushResultEncryptionKey(
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
    console.log("\nBENEFICIARY STORAGE ...");
    const isIpfsStorageInitialized = await iexec.storage.checkStorageTokenExists(ethProvider.address);
    console.log('Storage previously initialized:', isIpfsStorageInitialized);
    if (!isIpfsStorageInitialized) {
        const token = await iexec.storage.defaultStorageLogin();
        const { isPushed } = await iexec.storage.pushStorageToken(token, {forceUpdate: true});
        console.log('Default  IPFS storage initialized:', isPushed);
    }

    // check that requester secrets are pushed
    console.log("\nREQUESTER SECRETS ...");
    var secretName1 = getRandomString();
    var secretName2 = secretName1+'2';
    var secret1Check = await iexec.secrets.checkRequesterSecretExists(ethProvider.address, secretName1);
    var secret2Check = await iexec.secrets.checkRequesterSecretExists(ethProvider.address, secretName2);
    while (secret1Check || secret2Check) {
        secretName1 = getRandomString();
        secretName2 = secretName1+'2';
        secret1Check = await iexec.secrets.checkRequesterSecretExists(ethProvider.address, secretName1);
        secret2Check = await iexec.secrets.checkRequesterSecretExists(ethProvider.address, secretName2);
    }
    
    // push secrets to the SMS
    try {
        console.log("SECRET: pushing req secret 1 ...: " + signature);
        const secret1 = await iexec.secrets.pushRequesterSecret(secretName1, signature);
        console.log("SECRET: pushing req secret 2 ...: " + VOUCHER_ID);
        const secret2 = await iexec.secrets.pushRequesterSecret(secretName2, VOUCHER_ID);
    } catch (error) {
        console.log("Error pushing secrets to SMS: " + error);
    }

    // get workerpool order
    console.log("\nWORKERPOOL_ADDERSS ORDER ...");
    const { count, orders } = await iexec.orderbook.fetchWorkerpoolOrderbook({category: CATEGORY, workerpool: WORKERPOOL_ADDERSS, minTag:['tee']});
    const workerpoolorder = orders[0]?.order;
    if (!workerpoolorder) 
        throw Error(`no workerpoolorder found for app ${APP_ADDRESS}`); 
    else
        console.log("found")

    // get app order
    console.log("\nAPP ORDER ...");
    const { orders: appOrders } = await iexec.orderbook.fetchAppOrderbook(
        APP_ADDRESS, {dataset: DATASET_ADDRESS, workerpool: WORKERPOOL_ADDERSS, minTag: ['tee']}
    );
    const appOrder = appOrders && appOrders[0] && appOrders[0].order;
    if (!appOrder) 
        throw Error(`no apporder found for app ${APP_ADDRESS}`); 
    else
        console.log("found")

    // get dataset order
    console.log("\nDATASET ORDER ...");
    const { orders : dsOrders } = await iexec.orderbook.fetchDatasetOrderbook(DATASET_ADDRESS, {app: APP_ADDRESS, workerpool: WORKERPOOL_ADDERSS, minTag: ['tee']});
    const datasetOrder = dsOrders && dsOrders[0] && dsOrders[0].order;
    if (!datasetOrder) 
        throw Error(`no apporder found for app ${APP_ADDRESS}`); 
    else
        console.log("found")

    // create request order
    console.log("\nREQUESTER ORDER ...");
    // prerequisities: app developer secret (without 0x) & secret dataset pushed to the SMS
    const requestorderTemplate = await iexec.order.createRequestorder({
        app: APP_ADDRESS,
        requester: ethProvider.address,
        volume: 1,
        category: 0,
        trust: 1,
        dataset: DATASET_ADDRESS,
        workerpool: WORKERPOOL_ADDERSS,
        tag: ["tee"],
        params: {
            iexec_args: msgHash + ' ' + receipt.transactionHash,
            dataset: DATASET_ADDRESS,
            tag: "tee",
            iexec_secrets: { 
                "1": secretName1,
                "2": secretName2
            }//,
            //iexec_result_encryption: true // TODO: do we need this at this point?
        }
    });

    // sign request order 
    const signedRequestorder = await iexec.order.signRequestorder(requestorderTemplate);
    // publish request order
    const requestOrderHash = await iexec.order.publishRequestorder(signedRequestorder);
    console.log("Published Request order: " + requestOrderHash);

    // FINALLY: MATCH ORDERS
    console.log("\nMATCHING ORDERS ...");
    const result = await iexec.order.matchOrders({
        apporder: appOrder,
        requestorder: signedRequestorder,
        workerpoolorder: workerpoolorder,
        datasetorder: datasetOrder
    });

    // Start random check in order for the result from matchOrders to actually synchronise
    const userAddress = await iexec.wallet.getAddress();
    const [walletTmp, accountTmp] = await Promise.all([iexec.wallet.checkBalances(userAddress),
      iexec.account.checkBalance(userAddress)]);
    // End random check

    console.log(`created deal ${result.dealid} in tx ${result.taskHash}`);
    // get taskId from dealId
    // const dealid = "0xaf50677ce91e972ead5849aae12275fd5e22cc04fc3d94fd23a77305622b4f15";
    const deal = await iexec.deal.show(result.dealid);
    const taskId = deal.tasks["0"];
    console.log("taskId from deal: " + taskId);

    // FINALLLLYYY get results
    console.log("FETCHING RESULTS... (this may take a while)");
    // try every 5 minutes to get the results
    var res = null;
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    for (let i = 0; i < 20; i++) {
        try {
            res = await iexec.task.fetchResults(taskId);
            break;
        } catch (error) {
            console.log("Error fetching results: " + error);
            console.log("Retrying in 5 minutes...");
            await sleep(300000);
        }
    }
    
    console.log("\nREADING RESULTS ...");
    const zippedFile = await res.blob();
    const arrayBuffer = await zippedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync('results.zip', buffer);
    const zip = new StreamZip.async({ file: 'results.zip' });
    const data = await zip.entryData('result.txt');
    await zip.close();
    const jsonFile = JSON.parse(data);
    
    ////////////////////////////////
    // 3. GIVE VOUCHER TO 3RD PARTY
    // We assume it was transferred via email or some other secure channel
    ////////////////////////////////
    console.log("\nREDEEMING VOUCHER...");

    const wallet2 = new ethers.Wallet(process.env.DEV_WALLET2_PRIVATE_KEY, provider);

    // Withdraw funds from smart contract
    // the results are in the following format: {"msg": ["voucherId;amount"], "msg_hash": [sign_msg.messageHash.hex()], "sig": [sign_msg.signature.hex()]}
    const _recipientAddress = wallet2.address;
    const _amount = BigNumber.from(jsonFile.msg.split(";")[1]); // TODO: what format for the smartcontract? wei?
    const _voucherId = jsonFile.msg.split(";")[0];
    const _messageHash = jsonFile.msg_hash; 
    const _signature = jsonFile.sig;

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