# Hub backend

[![lint](https://img.shields.io/github/actions/workflow/status/axone-protocol/template-oss/lint.yml?branch=main&label=lint&style=for-the-badge&logo=github)](https://github.com/axone-protocol/hub-backend/actions/workflows/lint.yml)
[![conventional commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=for-the-badge&logo=conventionalcommits)](https://conventionalcommits.org)
[![contributor covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg?style=for-the-badge)](https://github.com/axone-protocol/.github/blob/main/CODE_OF_CONDUCT.md)
[![License](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg?style=for-the-badge)](https://opensource.org/licenses/BSD-3-Clause)

> Official Axone Hub repository.

## Prerequisites

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v18.20.0)
- [npm](https://www.npmjs.com/) (comes with Node.js) or [Yarn](https://yarnpkg.com/) (~1.22.19)

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/axone-protocol/hub-backend.git
   ```

2. **Install dependencies:**

    ```bash
    yarn install
    ```

3. **Run docker containers**

    To set up the necessary database and caching services for our application, you will need to run two Docker containers: one for PostgreSQL with TimescaleDB and another for Redis. Follow the steps below to do this:

    Run PostgreSQL with TimescaleDB

    ```bash
    docker run -d --name your_db_container_name -p 5432:5432 -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=your_db_name timescale/timescaledb-ha:pg16
    ```

    TimescaleDB is an extension of PostgreSQL designed for time-series data, providing additional functionality and optimizations. This setup is essential for storing and querying time-series data efficiently.

    Run Redis

    ```bash
    docker run --name your_redis_container_name -p 6379:6379 -d redis
    ```

    Redis is an in-memory data structure store used as a database, cache, and message broker. It is highly performant and provides fast access to frequently used data, making it an essential component for caching and improving the application's performance.

    Intention and Necessity

    Running these containers is crucial for setting up the backend infrastructure of the application. PostgreSQL with TimescaleDB provides a robust solution for managing relational and time-series data, while Redis enhances the application's performance by caching frequently accessed data and managing message queues efficiently. By using Docker, we ensure that these services are easily deployable and maintainable across different environments, reducing setup time and potential configuration issues.

4. **Configure environment variables**
    After creating the .env.local file, change the environment variables to match the settings in Docker

    ```bash
    cp .env.example .env.local
    ```

5. **Starting server**

    ```bash
    yarn dev # for dev mode
    yarn start # for live mode
    ```

## You want to get involved? 😍

Please check out Axone health files :

- [Contributing](https://github.com/axone-protocol/.github/blob/main/CONTRIBUTING.md)
- [Code of conduct](https://github.com/axone-protocol/.github/blob/main/CODE_OF_CONDUCT.md)
