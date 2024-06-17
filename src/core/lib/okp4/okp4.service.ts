import { config } from "@core/config/config";
import { BadRequestException, Injectable } from "@nestjs/common";
import { SupplyByDenomResponse } from "./responses/supply-by-denom.response";
import { GSFResponse } from "./responses/generic-success-failed.response";
import { FailedResponse } from "./responses/failed.response";
import { Endpoints } from "./enums/endpoints.enum";
import { createUrlParams } from "@utils/create-url-params";
import { HttpService } from "../http.service";
import { GetDelegationsResponse } from "./responses/get-delegations.response";
import { RouteParam } from "./enums/route-param.enum";
import { DelegatorValidatorsResponse } from "./responses/delegators-validators.response";
import { DelegatorsRewardsResponse } from "./responses/delegators-rewards.response";
import { SpendableBalancesResponse } from "./responses/spendable-balances.response";
import { SupplyResponse } from "./responses/supply.response";
import { ValidatorStatus } from "./enums/validator-status.enum";
import { ValidatorDelegationsResponse } from "./responses/validator-delegations.response";
import { fromBase64, toBase64, fromHex, toHex } from "@cosmjs/encoding";
import { sha256 } from "@cosmjs/crypto";
import { BlocksResponse } from "./responses/blocks.response";
import { WebSocket } from "ws";
import { Log } from "@core/loggers/log";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GovType } from "./enums/gov-type.enum";
import { GovParamsResponse } from "./responses/gov-params.response";
import { GetProposalsResponse } from "./responses/get-proposals.response";
import { GetProposalResponse } from "@core/lib/okp4/responses/get-proposal.response";

@Injectable()
export class Okp4Service {
    private BASE_URL = config.okp4.url;

    constructor(
        private readonly httpService: HttpService,
        private eventEmitter: EventEmitter2
    ) {}

    private constructUrl(endpoint: string, params?: string): string {
        return `${this.BASE_URL}/${endpoint}${params ? `?${params}` : ""}`;
    }

    private getWithErrorHandling<T>(url: string): Promise<T> {
        return this.errorHandleWrapper(this.httpService.get.bind(null, url));
    }

    async getSupplyByDenom(denom: string): Promise<SupplyByDenomResponse> {
        return this.getWithErrorHandling(
            this.constructUrl(
                Endpoints.SUPPLY_BY_DENOM,
                createUrlParams({ denom })
            )
        );
    }

    async getDelegations(addr: string): Promise<GetDelegationsResponse> {
        return this.getWithErrorHandling(
            this.constructUrl(`${Endpoints.STAKING_DELEGATIONS}/${addr}`)
        );
    }

    async getDelegatorsValidators(
        addr: string
    ): Promise<DelegatorValidatorsResponse> {
        return this.getWithErrorHandling(
            this.constructUrl(
                Endpoints.DELEGATORS_VALIDATORS.replace(
                    RouteParam.DELEGATOR_ADDRES,
                    addr
                )
            )
        );
    }

    async getDelegatorsRewards(
        addr: string
    ): Promise<DelegatorsRewardsResponse> {
        return this.getWithErrorHandling(
            this.constructUrl(
                Endpoints.DELEGATORS_REWARDS.replace(
                    RouteParam.DELEGATOR_ADDRES,
                    addr
                )
            )
        );
    }

    async getSpendableBalances(
        addr: string
    ): Promise<SpendableBalancesResponse> {
        return this.getWithErrorHandling(
            this.constructUrl(`${Endpoints.SPENDABLE_BALANCE}/${addr}`)
        );
    }

    async getBondValidators() {
        return this.getValidators(ValidatorStatus.BONDED);
    }

    async getValidators(status?: string): Promise<DelegatorValidatorsResponse> {
        let params = undefined;
        if (status) {
            params = createUrlParams({ status });
        }
        const url = this.constructUrl(Endpoints.VALIDATORS, params);
        return this.getWithErrorHandling(url);
    }

    async getTotalSupply(): Promise<SupplyResponse> {
        const url = this.constructUrl(Endpoints.TOTAL_SUPPLY);
        return this.getWithErrorHandling(url);
    }

    async getValidatorDelegations(
        validatorAddr: string,
        limit?: number,
        offset?: number
    ): Promise<ValidatorDelegationsResponse> {
        let params = undefined;
        if (limit && offset) {
            params = createUrlParams({
                "pagination.offset": offset.toString(),
                "pagination.limit": limit.toString(),
                "pagination.count_total": true.toString(),
            });
        }
        return this.getWithErrorHandling(
            this.constructUrl(
                Endpoints.VALIDATOR_DELEGATIONS.replace(
                    RouteParam.VALIDATOR_ADDRES,
                    validatorAddr
                ),
                params
            )
        );
    }

    async getLatestBlocks(): Promise<BlocksResponse> {
        return this.getWithErrorHandling(
            this.constructUrl(Endpoints.BLOCKS_LATEST)
        );
    }

    async getBlocksByHeight(height: number): Promise<BlocksResponse> {
        return this.getWithErrorHandling(
            this.constructUrl(
                Endpoints.BLOCKS_BY_HEIGHT.replace(
                    RouteParam.HEIGHT,
                    height.toString()
                )
            )
        );
    }

    apiPubkeyToAddr(pubkey: string) {
        return toBase64(
            fromHex(toHex(sha256(fromBase64(pubkey))).slice(0, 40))
        );
    }

    wssPubkeyToAddr(pubkey: string) {
        return toHex(sha256(fromBase64(pubkey))).slice(0, 40);
    }

    async connectToNewBlockSocket(event: string) {
        const client = new WebSocket(config.okp4.wss);
        client.on("open", () => {
            client.send(
                JSON.stringify({
                    jsonrpc: "2.0",
                    method: "subscribe",
                    id: 0,
                    params: { query: "tm.event='NewBlock'" },
                })
            );
        });
        client.on("message", (data) => {
            if (Buffer.isBuffer(data)) {
                const message = data.toString("utf-8");
                try {
                    const jsonData = JSON.parse(message);
                    if (
                        jsonData &&
                        jsonData?.result &&
                        jsonData?.result?.query === "tm.event='NewBlock'"
                    ) {
                        this.eventEmitter.emit(
                            event,
                            jsonData?.result?.data?.value
                        );
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (e: any) {
                    Log.warn(
                        "[OKP4] Problem with parsing data from wss\n" +
                            e.message
                    );
                }
            }
        });
    }

    async getGovParams(type = GovType.VOTING): Promise<GovParamsResponse> {
        return this.getWithErrorHandling(
            this.constructUrl(
                Endpoints.GOV_PARAMS.replace(RouteParam.PARAMS_TYPE, type)
            )
        );
    }

    async getProposals(): Promise<GetProposalsResponse> {
        return this.getWithErrorHandling(
            this.constructUrl(Endpoints.GOV_PROPOSALS)
        );
    }

    async getProposal(
        proposalId: string | number
    ): Promise<GetProposalResponse> {
        return this.getWithErrorHandling(
            this.constructUrl(
                Endpoints.GOV_PROPOSAL.replace(
                    RouteParam.PROPOSAL_ID,
                    String(proposalId)
                )
            )
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async errorHandleWrapper<T>(fn: any): Promise<T> {
        try {
            const response: GSFResponse<T> = await fn();

            if (this.isFailedResponse(response)) {
                throw new BadRequestException(response.message);
            }

            return response as T;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            throw new BadRequestException(e.message);
        }
    }

    private isFailedResponse<T>(
        response: GSFResponse<T>
    ): response is FailedResponse {
        return (response as FailedResponse).message !== undefined;
    }
}
