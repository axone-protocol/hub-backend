CREATE TABLE "historical_supply" (
    "time" TIMESTAMP(3) NOT NULL,
    "supply" TEXT NOT NULL,
    "change" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "historical_supply_pkey" PRIMARY KEY ("time")
);

SELECT create_hypertable('historical_supply', 'time');
CREATE UNIQUE INDEX "historical_supply_time_key" ON "historical_supply"("time");
