# StreamerInu Cross-Chain Application Description

Welcome to the GitHub repository of the StreamerInu cross-chain application. This document provides an overview of the core smart contracts deployed within our ecosystem, designed for a seamless cross-chain trading experience.

## Core Smart Contracts

Our application created three core smart contracts:

1. **StreamerInuToken (STRM)**
2. **StreamerInuRouter (OmniTrade)**
3. **StreamerInuVault**

These contracts work in tandem to facilitate cross-chain transactions and liquidity management for the STRM token, an ERC20 asset.

## Cross-Chain Terminology

Understanding the flow of transactions across different blockchain networks is key to interacting with our application. Here are essential terms:

- **Source Network:** The blockchain network from where a user initiates the original transaction.
- **Main Network:** This network hosts the primary liquidity pools for the STRM token, particularly the STRM/USDC pair. It is central to our application's liquidity management.
- **Destination Network:** The network to which a transaction is directed in the context of cross-chain operations.

### StreamerInuToken (STRM)

The `StreamerInuToken`, also referred to as STRM, is an ERC20 token that incorporates features from the LayerZero Omnifungible Token (OFT) Version 1. A distinct feature of STRM is the transaction fee imposed on purchases made via Uniswap. This fee is variable, ranging from 0% to 40%, with the current rate set at 0.4%. This fee rate is fixed and not subject to future changes under current planning.

### StreamerInuRouter (OmniTrade)

`StreamerInuRouter`, also known as OmniTrade, is a utility contract crucial for enabling cross-chain trading activities. This contract is used in cross-buy and cross-sale flows.
<br>OmniTrade also imposes a fee of 0.2% on each buy and sell transaction involving STRM tokens, which is a fixed rate.

### StreamerInuVault

The `StreamerInuVault` is a straightforward vault contract tasked with holding the fees accrued from transactions involving the STRM token and those routed through the StreamerInuRouter. This vault ensures that fees are securely stored and accounted for within the ecosystem.

### Cross-buy flow

Our cross-buy flow works in next way:

1. user executes cross network transaction from a source network to a main network. To do it we use squidRouter smart contracts. With the transaction user pass some amount of tokens to swap to STRM.
2. The passed tokens swapped on source network to [axlUSDC][axlUSDC] and pass the tokens to squidRouter on chosen main chain.
3. On main chain squidRouter swap the tokens from axlUSDC to STRM and ETH(native currency), the amount of eth is strictly equals to amount which needs to covert LZ OFT transfer back to source network to user.
4. squidMulticall call function `sendOFTTokenToOwner` of StreamerInuRouter SC.
5. The StreamerInuRouter transfer swapped STRM tokens to user to source chain.

### Cross-sale flow

Our cross-buy flow works in next way:

1. user transfers STRM token from source network to StreamerInuRouter on a main network by using LayerZero cross network transfer.
2. user trigger function `sellSi` on StreamerInuRouter on a main network.
3. the StreamerInuRouter call to squidRouter.
4. the squidRouter swap STRM to axlUSDC and transfer them to the source network to squidRouter
5. the squidRouter on source network swap axlUSDC to chosen tokens and transfer the tokens to the user

<br>Thank you for exploring the StreamerInu cross-chain application. We hope this description provides a clear understanding of our smart contract architecture and its functionality within the broader blockchain ecosystem.

[axlUSDC]: https://www.axelar.network/blog/what-is-axlusdc-and-how-do-you-get-it
