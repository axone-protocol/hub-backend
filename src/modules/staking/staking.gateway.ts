import { Event } from "@core/enums/event.enum";
import { OnEvent } from "@nestjs/event-emitter";
import { OnGatewayConnection, WebSocketGateway } from "@nestjs/websockets";
import { Socket } from 'socket.io';
import { SignatureDto } from "./dtos/signature.dto";
import { StakingService } from "./services/staking.service";

@WebSocketGateway()
export class StakingGateway implements OnGatewayConnection {
  private connections: Socket[] = [];

  constructor(private readonly service: StakingService) {}

  handleConnection(client: Socket) {
    this.connections.push(client);
  }

  @OnEvent(Event.SIGNATURES_CACHED)
  async uptimeUpdate(map: Map<string, SignatureDto[]>) {
    for (const [addr, signatures] of map) {
      this.sendUpdate(`uptime.${addr}`, signatures);
    }
  }

  @OnEvent(Event.BLOCK_CACHED)
  async blockUpdate() {
    const lastBlock = await this.service.getLastBlock();
    this.sendUpdate("new_block", lastBlock);
  }

  private sendUpdate(event: string, data: unknown) {
    for (const connection of this.connections) {
      connection.emit(event, data);
    }
  }
}