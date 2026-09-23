/**
 * Deploy script for TreasuryReleaseCourt.
 *
 * Deploys the contract to a GenLayer network (studionet by default) using a
 * private-key account, estimates deployment fees for real, waits for
 * finalization, and prints the resulting contract address plus a ready-to-
 * paste frontend/.env.local snippet.
 *
 * Usage:
 *   cp deploy/.env.example deploy/.env
 *   # fill in DEPLOYER_PRIVATE_KEY, BENEFICIARY_ADDRESS, TREASURY_ADDRESS,
 *   # COMMITTEE_CSV, COMMITTEE_KINDS_CSV
 *   npm run deploy
 *
 * The constructor arguments intentionally mirror the demo script in the
 * README: a short charter, a 2-member committee (1 human + 1 agent), a
 * small tranche + bond, and short submission/appeal windows so the full
 * end-to-end flow can be demoed live in minutes.
 */

import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "genlayer-js";
import { studionet, studioDev } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { createAccount } from "genlayer-js/accounts";

function readEnv(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function resolveChain(name: string) {
  switch (name) {
    case "studionet":
      return studionet;
    case "studio-dev":
      return studioDev;
    default:
      throw new Error(
        `Unsupported CHAIN "${name}". Use "studionet" or "studio-dev", ` +
          `or add a Bradbury chain config here (see README "Studio vs Bradbury").`
      );
  }
}

async function main() {
  const chainName = readEnv("CHAIN", "studionet");
  const chain = resolveChain(chainName);
  const privateKey = readEnv("DEPLOYER_PRIVATE_KEY");

  const charter = readEnv(
    "CHARTER",
    "The committee must ship a public dashboard reachable at a live URL that " +
      "clearly displays current DAO treasury balances across all tracked wallets."
  );
  const beneficiary = readEnv("BENEFICIARY_ADDRESS");
  const treasury = readEnv("TREASURY_ADDRESS");
  const trancheGen = readEnv("TRANCHE_GEN", "10");
  const appealBondGen = readEnv("APPEAL_BOND_GEN", "2");
  const submissionWindowSec = readEnv("SUBMISSION_WINDOW_SEC", "300");
  const appealWindowSec = readEnv("APPEAL_WINDOW_SEC", "180");
  const committeeCsv = readEnv("COMMITTEE_CSV"); // "0xHuman,0xAgent"
  const committeeKindsCsv = readEnv("COMMITTEE_KINDS_CSV", "human,agent");

  const trancheWei = (BigInt(Math.round(Number(trancheGen) * 1e18))).toString();
  const appealBondWei = (
    BigInt(Math.round(Number(appealBondGen) * 1e18))
  ).toString();

  const account = createAccount(privateKey as `0x${string}`);

  const client = createClient({
    chain,
    account,
    provider: undefined, // node/CLI context: genlayer-js signs locally with the account
  });
  await client.connect(chainName as "studionet" | "studio-dev");

  console.log(`Deploying TreasuryReleaseCourt to ${chainName} (chain id ${chain.id})`);
  console.log(`  deployer:    ${account.address}`);
  console.log(`  beneficiary: ${beneficiary}`);
  console.log(`  treasury:    ${treasury}`);
  console.log(`  tranche:     ${trancheGen} GEN (${trancheWei} wei)`);
  console.log(`  appeal bond: ${appealBondGen} GEN (${appealBondWei} wei)`);
  console.log(`  windows:     submit=${submissionWindowSec}s appeal=${appealWindowSec}s`);
  console.log(`  committee:   ${committeeCsv} (${committeeKindsCsv})`);

  const contractCode = fs.readFileSync(
    path.join(__dirname, "..", "contracts", "TreasuryReleaseCourt.py"),
    "utf-8"
  );

  const deployArgs = [
    charter,
    beneficiary,
    treasury,
    trancheWei,
    appealBondWei,
    submissionWindowSec,
    appealWindowSec,
    committeeCsv,
    committeeKindsCsv,
  ];

  const deployTx = {
    code: contractCode,
    args: deployArgs,
  };

  // Real fee estimation — never skipped, matches the UI's write flow.
  const estimate = await client.estimateTransactionFeesForDeploy(deployTx as any);
  console.log("Estimated deploy fee:", estimate);

  const deployTxId = await client.deployContract({
    ...deployTx,
    fees: {
      distribution: estimate.distribution,
      feeValue: estimate.feeValue,
    },
  } as any);

  console.log(`Deploy tx submitted: ${deployTxId}`);
  console.log("Waiting for ACCEPTED...");
  const acceptedReceipt = await client.waitForTransactionReceipt({
    hash: deployTxId,
    status: TransactionStatus.ACCEPTED,
  });
  console.log("Accepted. Waiting for FINALIZED (consensus)...");

  const finalReceipt = await client.waitForTransactionReceipt({
    hash: deployTxId,
    status: TransactionStatus.FINALIZED,
  });

  const contractAddress =
    (finalReceipt as any).data?.contract_address ??
    (acceptedReceipt as any).data?.contract_address;

  if (!contractAddress) {
    console.error("Finalized receipt did not include a contract address:");
    console.error(JSON.stringify(finalReceipt, null, 2));
    process.exit(1);
  }

  console.log("\n✅ Deployed TreasuryReleaseCourt");
  console.log(`   address: ${contractAddress}`);
  console.log(`\nAdd this to frontend/.env.local:\n`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`NEXT_PUBLIC_CHAIN=${chainName}`);
}

main().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});
