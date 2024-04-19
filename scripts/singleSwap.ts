import { constants, layerZeroEndpointsList } from "./helpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
import { SwapRouterMock, ERC20Mock } from "../typechain-types";
async function main() {
  const SwapR = await ethers.getContractFactory("SwapRouterMock");
  const Erc20 = await ethers.getContractFactory("ERC20Mock");
  const [owner] = await ethers.getSigners();

  const STRM = "0xCf3A1d88414a0B5215B4ff888E2312ceE3bE176e";
  const ERC20_2 = "0x23Ac304E24a6c0FFBaB0d8b99f38c0b1FC3A724E";

  const swap = (await SwapR.attach(
    "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  )) as SwapRouterMock;
  const erc20 = (await Erc20.attach(STRM)) as ERC20Mock;

  let amount = ethers.parseEther("0.001");
  // await erc20.approve(await swap.getAddress(), amount);

  const swapOption = {
    tokenIn: ERC20_2,
    tokenOut: STRM,
    fee: 500,
    recipient: owner.address,
    deadline: 1990000000,
    amountIn: amount,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };
  let tx = await swap.exactInputSingle(swapOption);
  // let tx = await swap.sendFrom(
  //   owner.address,
  //   184,
  //   toAddress,
  //   amount,
  //   callParams,
  //   { value: fees },
  // );
  console.log(tx);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
