# tee-peanut
Probabilistically private payment links using private computation


## Architecture Reference
https://crosspl-my.sharepoint.com/personal/mikolaj_glinka_cross_pl/_layouts/15/Doc.aspx?sourcedoc=%7B296fe650-408c-4490-bfe0-3f6f35f7321d%7D&action=default&slrid=c59c93a0-40fd-6000-382e-a25b4812fa31&originalPath=aHR0cHM6Ly9jcm9zc3BsLW15LnNoYXJlcG9pbnQuY29tLzp4Oi9nL3BlcnNvbmFsL21pa29sYWpfZ2xpbmthX2Nyb3NzX3BsL0VWRG1ieW1NUUpCRXYtQV9ielgzTWgwQmJxVXhBSXp6S2wwNGxYMi0yNnJ6UXc_cnRpbWU9M2lHRHYyRUkyMGc&cid=3f7b9a76-116e-482d-9442-4b95737d2390


## Install guide

### Main JS app
1. Install [Node.js](https://nodejs.org/en/download/) (v12.16.1)
2. Run `npm install` in the root directory
3. Run `node main.mjs` to start the script

### Smart Contracts
Notice: Contract already deployed on Goerli at: https://goerli.etherscan.io/address/0x084012de7258604b7ddfed69da102eb52d13ce02#code 

1. Install Python & python3-venv
2. Create a virtual environment: `python3 -m venv venv` & activate it: `source venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Add .env file with a funded wallet `PRIVATE_KEY` and optionally Etherscan keys
4. Deploy contracts: `brownie run scripts/deploy.py` (optionally, you can specify a network with `--network <network>`)

### TEE
Notice: Enclave iexec image deployed on bellecour at 0x22bf4bff2b40A3BE098892970E079077851eC664

1. Build docker image: `docker build . --tag peanut-v0.1`
2. Sconify it: `./sconify.sh`
3. Update iexec.json (at least hash + fingerprint)
