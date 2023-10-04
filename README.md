# js-particles POW Blockchain Miner

Welcome to `js-particles`, a proof-of-work blockchain miner built with JavaScript.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Checking Balance](#check-balance)
- [Logs & Output](#log)

### Contract Configuration

1. **Environment Variables**:
   - Set up a `.env` file based on `.env.sample` and provide a valid wallet address.

## Prerequisites

Ensure you have the following installed on your local machine:

- [Node.js](https://nodejs.org/) (v16 or above)
- [npm](https://www.npmjs.com/) (v7 or above)

## Installation

### 1. **Installing Dependencies:**

If you haven't installed Yarn, you can do it using npm:

```bash
npm install -g yarn
```

Then, install the project dependencies:

```bash
yarn
```

### 2. **Starting the Miner:**

To start the mining process, execute:

```bash
node miner.js
```

## Usage

### <a name="check-balance"></a>Checking Balance

To check the balance for a specific address:

```bash
curl --location 'https://p2p.particles.digital/get-balance?address=${address}'
```

### <a name="log"></a>Logs & Output

Below is an example log from the mining process:

![Mining Log](image.png)
