# Hub backend

[![lint](https://img.shields.io/github/actions/workflow/status/axone-protocol/template-oss/lint.yml?branch=main&label=lint&style=for-the-badge&logo=github)](https://github.com/axone-protocol/template-oss/actions/workflows/lint.yml)
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
2. **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
3. **Add docker containers**
    ```bash
    docker run -d --name your_db_container_name -p 5432:5432 -e POSTGRES_PASSWORD=your_password POSTGRES_DB=your_db_name timescale/timescaledb-ha:pg16
    docker run --name your_redis_container_name -p 6379:6379 -d redis
4. **Configure env**
    After creation .env.local change env variable to what you settup in docker
    ```bash
    cp .env.example .env.local
5. **Starting server**
    ```bash
    yarn dev for dev mode
    yarn start for live mode
## You want to get involved? 😍

Please check out Axone health files :

- [Contributing](https://github.com/axone-protocol/.github/blob/main/CONTRIBUTING.md)
- [Code of conduct](https://github.com/axone-protocol/.github/blob/main/CODE_OF_CONDUCT.md)
