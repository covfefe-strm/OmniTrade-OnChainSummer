# Omni-Trade-solidity-smart-contracts

Welcome to the StreamerInu smart contract repository.

## Prerequisites

Before you begin, ensure you have [Node.js](https://nodejs.org/) installed on your system. This environment requires Node.js version 14.x or higher.

## Installation

To set up your development environment, follow these steps:

1. Clone the repository to your local machine.
2. Navigate into the repository directory.
3. Run the following command to install the necessary Node.js modules:

```bash
npm install
```

### Compiling Contracts

To compile the smart contracts in this project, use one of the following commands:

```bash
npx hardhat compile
```

or

```bash
npm run compile
```

This will compile all Solidity contracts located in the contracts/ directory and output their artifacts to the artifacts/ directory.

### Running Tests

To run the tests for the smart contracts, you will need to set up your environment variables first. This includes specifying an Infura API key that supports the Polygon mainnet network.

Copy the .env.example file to create a new .env file:

```bash
cp .env.example .env
```

Open the .env file and add your Infura API key and any other necessary environment variables.

After setting up the .env file, use one of the following commands to run the tests:

```bash
npx hardhat test
```

or

```bash
npm run test
```

### Verifying Smart Contracts

To verify your smart contracts on networks such as Ethereum Mainnet, Ropsten, or Polygon, you must provide an API key for services such as Etherscan or Polygonscan. The necessary API key must be added to your .env file under the respective environment variable as outlined in the .env.example file.

### Environment Variables

Refer to the .env.example file in the repository for a comprehensive list of environment variables you'll need to configure for various functionalities like testing and verifying contracts.
