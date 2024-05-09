CREATE TABLE "historical_mcap" (
    "time" TIMESTAMP(3) NOT NULL,
    "mcap" DOUBLE PRECISION NOT NULL,
    "change" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "historical_mcap_pkey" PRIMARY KEY ("time")
);

CREATE UNIQUE INDEX "historical_mcap_time_key" ON "historical_mcap"("time");