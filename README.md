# tee-peanut

Probabilistically private payment links using private computation

## Architecture Reference

https://crosspl-my.sharepoint.com/:x:/g/personal/mikolaj_glinka_cross_pl/EVDmbymMQJBEv-A_bzX3Mh0BNXwILU5jUHmFiFNcuNjgSg

## Install guide

### Main JS app

1. Install [Node.js](https://nodejs.org/en/download/) (v12.16.1)
2. Run `npm install` in the root directory
3. Run `node main.mjs` to start the script

### Smart Contracts

Notice: Contract already deployed on Goerli at: https://goerli.etherscan.io/address/0x801B9a3121662272844386e1D449dE4867efb43F

1. Install Python & python3-venv
2. Create a virtual environment: `python3 -m venv venv` & activate it: `source venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Add .env file with a funded wallet `PRIVATE_KEY` and optionally Etherscan keys
5. Deploy contracts: `brownie run scripts/deploy.py` (optionally, you can specify a network with `--network <network>`)

### TEE

Notice:

Enclave iexec image deployed on bellecour at 0xd09a816944332207f956e662e3ab178d0347bcf8.
Confidential dataset deployed on bellecour at 0xe7d615d87fd6524f7c9d6ac30123c0b8b9eb473c.

Useful iExec commands:

iexec init --skip-wallet
--create files Dockerfile, sconfiy.sh (with correct image names), src/app.py
docker login registry.scontain.com:5050
chmod +x sconify.sh
./sconify.sh
--push to docker hub the built tee image
iexec app init --tee
docker pull montenegrohugo/peanut-v0.3:tee-debug | grep "Digest: sha256:" | sed 's/.\*sha256:/0x/'
docker run -it --rm -e SCONE_HASH=1 tee-hello-world:tee-debug
--update iexec.json (name, multiaddr, checksum, fingerprint)
iexec app deploy --chain bellecour
sed -i 's|"bellecour": {},|"bellecour": { "sms": "https://v7.sms.debug-tee-services.bellecour.iex.ec" },|g' chain.json
iexec storage init --chain bellecour
iexec app push-secret --chain bellecour
iexec app check-secret --chain bellecour
iexec dataset push-secret --chain bellecour
iexec dataset check-secret --chain bellecour
iexec order init --app
--edit params (tag ["tee"], dataset address) in iexec.json
iexec order sign --app && iexec order publish --app
iexec orderbook app <your app address> --dataset <dataset_address>
iexec order init --dataset
--edit params (tag ["tee"], app address) in iexec.json
iexec order sign --dataset && iexec order publish --dataset
iexec orderbook dataset <your dataset address> --app <app_address>
