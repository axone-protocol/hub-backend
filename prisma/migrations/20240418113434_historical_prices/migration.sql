CREATE TABLE "historical_prices" (
    "time" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "historical_prices_pkey" PRIMARY KEY ("time")
);

SELECT create_hypertable('historical_prices', 'time');
CREATE UNIQUE INDEX "historical_prices_time_key" ON "historical_prices"("time");
