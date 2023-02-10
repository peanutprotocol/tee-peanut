#!/usr/bin/python3

#############################################################################################
# Usage: (venv)$ brownie run scripts/deploy.py
#   Optional: --network ...
#
#############################################################################################

import time

from brownie import PeanutERC20, PrivatePeanut, accounts, config, network, web3
from brownie.network import gas_price, priority_fee
from brownie.network.gas.strategies import LinearScalingStrategy
from scripts.helpful_scripts import (
    LOCAL_BLOCKCHAIN_ENVIRONMENTS,
    estimate_cost,
    get_price,
    get_publish_source,
    get_usd_value_of_token,
)


def main():
    dev = accounts.add(config["wallets"]["from_key"])
    print(f"Deploying contracts to {network.show_active()}")
    print(f"Deployer account: {dev}")

    # if on local network
    if network.show_active() in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        # priority_fee(0)
        # gas_price(0)
        pass
    elif "goerli" in network.show_active() or "mumbai" in network.show_active():
        # set gas price to current network gas price
        gas_price(int(web3.eth.generateGasPrice() * 1.5))
    else:
        # set gas price 50% lower than current network gas price
        current_network_gas_price = web3.eth.generateGasPrice()
        min_gas_price = current_network_gas_price * 0.5
        max_gas_price = current_network_gas_price * 1.5
        print(
            f"Current network gas price: {current_network_gas_price / 1e9} gwei",
            f"Min gas price: {min_gas_price / 1e9} gwei",
            f"Max gas price: {max_gas_price / 1e9} gwei",
        )
        # if network polygon, set min gas price to 30 gwei (its hardcoded to prevent spam)
        if network.show_active() == "polygon-main":
            min_gas_price = "30 gwei"

        # set gas price strategy
        gas_strategy = LinearScalingStrategy(min_gas_price, max_gas_price, 1.05)
        gas_price(gas_strategy)

    contract = PrivatePeanut.deploy(
        "0x6B3751c5b04Aa818EA90115AA06a4D9A36A16f02",
        {"from": dev, "nonce": web3.eth.getTransactionCount(dev.address)},
        publish_source=get_publish_source(),
    )

    # Brownies console.log equivalent
    # have to add emit events in contract...
    print()
    events = contract.tx.events  # dictionary
    if "Log" in events:
        for e in events["Log"]:
            print(e["message"])
    print()

    # get gas cost of TX
    gas_used = contract.tx.gas_used
    print(f"Gas used: {gas_used}")
    current_network = network.show_active()
    print(f"Current network: {current_network}")
    cost = estimate_cost(gas_used, current_network)
    print(f"Cost: ${cost}")

    return contract
