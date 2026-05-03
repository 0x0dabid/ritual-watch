-- CreateTable
CREATE TABLE "IndexedState" (
    "id" TEXT NOT NULL DEFAULT 'ritual-testnet',
    "lastBlock" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexedState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "number" BIGINT NOT NULL,
    "hash" TEXT NOT NULL,
    "parentHash" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "txCount" INTEGER NOT NULL,
    "gasUsed" TEXT NOT NULL,
    "gasLimit" TEXT NOT NULL,
    "baseFee" TEXT,
    "miner" TEXT,
    "size" INTEGER,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("number")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "hash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "blockHash" TEXT NOT NULL,
    "transactionIndex" INTEGER NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT,
    "value" TEXT NOT NULL,
    "gas" TEXT NOT NULL,
    "gasPrice" TEXT,
    "maxFeePerGas" TEXT,
    "nonce" INTEGER NOT NULL,
    "input" TEXT NOT NULL,
    "status" TEXT,
    "gasUsed" TEXT,
    "effectiveGasPrice" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "method" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "address" TEXT NOT NULL,
    "topic0" TEXT,
    "topic1" TEXT,
    "topic2" TEXT,
    "topic3" TEXT,
    "data" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddressActivity" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "direction" TEXT NOT NULL,

    CONSTRAINT "AddressActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenTransfer" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "TokenTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NftTransfer" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "contract" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "standard" TEXT NOT NULL,

    CONSTRAINT "NftTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenContract" (
    "address" TEXT NOT NULL,
    "symbol" TEXT,
    "name" TEXT,
    "decimals" INTEGER,

    CONSTRAINT "TokenContract_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "NftContract" (
    "address" TEXT NOT NULL,
    "name" TEXT,
    "symbol" TEXT,

    CONSTRAINT "NftContract_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "DailyStat" (
    "day" TIMESTAMP(3) NOT NULL,
    "txCount" INTEGER NOT NULL,
    "activeWallets" INTEGER NOT NULL,

    CONSTRAINT "DailyStat_pkey" PRIMARY KEY ("day")
);

-- CreateTable
CREATE TABLE "RitualName" (
    "name" TEXT NOT NULL,
    "tokenId" TEXT,
    "owner" TEXT NOT NULL,
    "resolver" TEXT,
    "primaryFor" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RitualName_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "RitualNameTextRecord" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "RitualNameTextRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Block_hash_key" ON "Block"("hash");

-- CreateIndex
CREATE INDEX "Block_timestamp_idx" ON "Block"("timestamp");

-- CreateIndex
CREATE INDEX "Transaction_from_idx" ON "Transaction"("from");

-- CreateIndex
CREATE INDEX "Transaction_to_idx" ON "Transaction"("to");

-- CreateIndex
CREATE INDEX "Transaction_blockNumber_idx" ON "Transaction"("blockNumber");

-- CreateIndex
CREATE INDEX "Transaction_timestamp_idx" ON "Transaction"("timestamp");

-- CreateIndex
CREATE INDEX "Log_address_idx" ON "Log"("address");

-- CreateIndex
CREATE INDEX "Log_topic0_idx" ON "Log"("topic0");

-- CreateIndex
CREATE INDEX "AddressActivity_address_idx" ON "AddressActivity"("address");

-- CreateIndex
CREATE INDEX "AddressActivity_timestamp_idx" ON "AddressActivity"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "AddressActivity_address_txHash_direction_key" ON "AddressActivity"("address", "txHash", "direction");

-- CreateIndex
CREATE INDEX "TokenTransfer_token_idx" ON "TokenTransfer"("token");

-- CreateIndex
CREATE INDEX "TokenTransfer_from_idx" ON "TokenTransfer"("from");

-- CreateIndex
CREATE INDEX "TokenTransfer_to_idx" ON "TokenTransfer"("to");

-- CreateIndex
CREATE INDEX "NftTransfer_contract_idx" ON "NftTransfer"("contract");

-- CreateIndex
CREATE INDEX "NftTransfer_from_idx" ON "NftTransfer"("from");

-- CreateIndex
CREATE INDEX "NftTransfer_to_idx" ON "NftTransfer"("to");

-- CreateIndex
CREATE INDEX "RitualName_owner_idx" ON "RitualName"("owner");

-- CreateIndex
CREATE UNIQUE INDEX "RitualNameTextRecord_name_key_key" ON "RitualNameTextRecord"("name", "key");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_blockNumber_fkey" FOREIGN KEY ("blockNumber") REFERENCES "Block"("number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_txHash_fkey" FOREIGN KEY ("txHash") REFERENCES "Transaction"("hash") ON DELETE CASCADE ON UPDATE CASCADE;
