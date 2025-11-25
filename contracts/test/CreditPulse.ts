import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { CreditPulse, CreditPulse__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("CreditPulse")) as CreditPulse__factory;
  const creditPulseContract = (await factory.deploy()) as CreditPulse;
  const creditPulseContractAddress = await creditPulseContract.getAddress();

  return { creditPulseContract, creditPulseContractAddress };
}

describe("CreditPulse", function () {
  let signers: Signers;
  let creditPulseContract: CreditPulse;
  let creditPulseContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ creditPulseContract, creditPulseContractAddress } = await deployFixture());
  });

  it("should have no assessment after deployment", async function () {
    const hasAssessment = await creditPulseContract.hasAssessment(signers.alice.address);
    expect(hasAssessment).to.eq(false);
  });

  it("should submit encrypted assessment successfully", async function () {
    // Test data: revenue=3, employees=2, years=4, debtRatio=5, cashflow=3, litigation=3
    const testData = {
      revenue: 3,
      employees: 2,
      years: 4,
      debtRatio: 5,
      cashflow: 3,
      litigation: 3,
    };

    // Encrypt all 6 metrics
    const encryptedInput = await fhevm
      .createEncryptedInput(creditPulseContractAddress, signers.alice.address)
      .add8(testData.revenue)
      .add8(testData.employees)
      .add8(testData.years)
      .add8(testData.debtRatio)
      .add8(testData.cashflow)
      .add8(testData.litigation)
      .encrypt();

    // Submit assessment
    const tx = await creditPulseContract
      .connect(signers.alice)
      .submitAssessment(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.handles[2],
        encryptedInput.handles[3],
        encryptedInput.handles[4],
        encryptedInput.handles[5],
        encryptedInput.inputProof
      );
    await tx.wait();

    // Verify assessment exists
    const hasAssessment = await creditPulseContract.hasAssessment(signers.alice.address);
    expect(hasAssessment).to.eq(true);
  });

  it("should calculate correct scale score (revenue + employees + years)", async function () {
    // Test data: revenue=3, employees=2, years=4 => scaleScore = 9
    const testData = {
      revenue: 3,
      employees: 2,
      years: 4,
      debtRatio: 5,
      cashflow: 3,
      litigation: 3,
    };
    const expectedScaleScore = testData.revenue + testData.employees + testData.years; // 9

    // Encrypt and submit
    const encryptedInput = await fhevm
      .createEncryptedInput(creditPulseContractAddress, signers.alice.address)
      .add8(testData.revenue)
      .add8(testData.employees)
      .add8(testData.years)
      .add8(testData.debtRatio)
      .add8(testData.cashflow)
      .add8(testData.litigation)
      .encrypt();

    const tx = await creditPulseContract
      .connect(signers.alice)
      .submitAssessment(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.handles[2],
        encryptedInput.handles[3],
        encryptedInput.handles[4],
        encryptedInput.handles[5],
        encryptedInput.inputProof
      );
    await tx.wait();

    // Get encrypted scale grade and decrypt
    const encryptedScaleGrade = await creditPulseContract.getScaleGrade(signers.alice.address);
    const decryptedScaleScore = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedScaleGrade,
      creditPulseContractAddress,
      signers.alice
    );

    expect(decryptedScaleScore).to.eq(expectedScaleScore);
  });

  it("should calculate correct health score (debtRatio + cashflow + litigation)", async function () {
    // Test data: debtRatio=5, cashflow=3, litigation=3 => healthScore = 11
    const testData = {
      revenue: 3,
      employees: 2,
      years: 4,
      debtRatio: 5,
      cashflow: 3,
      litigation: 3,
    };
    const expectedHealthScore = testData.debtRatio + testData.cashflow + testData.litigation; // 11

    // Encrypt and submit
    const encryptedInput = await fhevm
      .createEncryptedInput(creditPulseContractAddress, signers.alice.address)
      .add8(testData.revenue)
      .add8(testData.employees)
      .add8(testData.years)
      .add8(testData.debtRatio)
      .add8(testData.cashflow)
      .add8(testData.litigation)
      .encrypt();

    const tx = await creditPulseContract
      .connect(signers.alice)
      .submitAssessment(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.handles[2],
        encryptedInput.handles[3],
        encryptedInput.handles[4],
        encryptedInput.handles[5],
        encryptedInput.inputProof
      );
    await tx.wait();

    // Get encrypted health grade and decrypt
    const encryptedHealthGrade = await creditPulseContract.getHealthGrade(signers.alice.address);
    const decryptedHealthScore = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedHealthGrade,
      creditPulseContractAddress,
      signers.alice
    );

    expect(decryptedHealthScore).to.eq(expectedHealthScore);
  });

  it("should store assessment timestamp", async function () {
    const testData = {
      revenue: 1,
      employees: 1,
      years: 1,
      debtRatio: 1,
      cashflow: 1,
      litigation: 1,
    };

    const encryptedInput = await fhevm
      .createEncryptedInput(creditPulseContractAddress, signers.alice.address)
      .add8(testData.revenue)
      .add8(testData.employees)
      .add8(testData.years)
      .add8(testData.debtRatio)
      .add8(testData.cashflow)
      .add8(testData.litigation)
      .encrypt();

    const tx = await creditPulseContract
      .connect(signers.alice)
      .submitAssessment(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.handles[2],
        encryptedInput.handles[3],
        encryptedInput.handles[4],
        encryptedInput.handles[5],
        encryptedInput.inputProof
      );
    await tx.wait();

    const timestamp = await creditPulseContract.getAssessmentTimestamp(signers.alice.address);
    expect(timestamp).to.be.gt(0);
  });

  it("should allow different users to submit assessments", async function () {
    const testData = {
      revenue: 2,
      employees: 3,
      years: 2,
      debtRatio: 4,
      cashflow: 2,
      litigation: 2,
    };

    // Alice submits
    const aliceInput = await fhevm
      .createEncryptedInput(creditPulseContractAddress, signers.alice.address)
      .add8(testData.revenue)
      .add8(testData.employees)
      .add8(testData.years)
      .add8(testData.debtRatio)
      .add8(testData.cashflow)
      .add8(testData.litigation)
      .encrypt();

    await creditPulseContract
      .connect(signers.alice)
      .submitAssessment(
        aliceInput.handles[0],
        aliceInput.handles[1],
        aliceInput.handles[2],
        aliceInput.handles[3],
        aliceInput.handles[4],
        aliceInput.handles[5],
        aliceInput.inputProof
      );

    // Bob submits
    const bobInput = await fhevm
      .createEncryptedInput(creditPulseContractAddress, signers.bob.address)
      .add8(testData.revenue)
      .add8(testData.employees)
      .add8(testData.years)
      .add8(testData.debtRatio)
      .add8(testData.cashflow)
      .add8(testData.litigation)
      .encrypt();

    await creditPulseContract
      .connect(signers.bob)
      .submitAssessment(
        bobInput.handles[0],
        bobInput.handles[1],
        bobInput.handles[2],
        bobInput.handles[3],
        bobInput.handles[4],
        bobInput.handles[5],
        bobInput.inputProof
      );

    // Both should have assessments
    expect(await creditPulseContract.hasAssessment(signers.alice.address)).to.eq(true);
    expect(await creditPulseContract.hasAssessment(signers.bob.address)).to.eq(true);
  });

  it("should revert when getting grades for non-existent assessment", async function () {
    await expect(
      creditPulseContract.getScaleGrade(signers.alice.address)
    ).to.be.revertedWith("No assessment found");

    await expect(
      creditPulseContract.getHealthGrade(signers.alice.address)
    ).to.be.revertedWith("No assessment found");

    await expect(
      creditPulseContract.getAssessmentTimestamp(signers.alice.address)
    ).to.be.revertedWith("No assessment found");
  });
});

