import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying CreditPulse with account:", deployer);

  const deployed = await deploy("CreditPulse", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log(`CreditPulse contract deployed at: ${deployed.address}`);
};

export default func;
func.id = "deploy_credit_pulse";
func.tags = ["CreditPulse"];

