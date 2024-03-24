//read
// https://github.com/sc-forks/solidity-coverage/blob/master/README.md
// https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-stack
module.exports = {
  skipFiles: ["test/", "mock/", "dex/", "squidrouter/"],
  configureYulOptimizer: true,
  solcOptimizerDetails: {
    peephole: false,
    inliner: false,
    jumpdestRemover: false,
    orderLiterals: true,
    deduplicate: false,
    cse: false,
    constantOptimizer: false,
    yul: false,
  },
};
