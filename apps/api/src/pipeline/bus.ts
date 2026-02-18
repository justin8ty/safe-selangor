import { EventEmitter } from "node:events";
import type { PipelineEvent, PipelineContext } from "./events.ts";

type BusListener = (ctx: PipelineContext) => void;

class PipelineBus extends EventEmitter {
  emit(event: PipelineEvent, ctx: PipelineContext): boolean {
    return super.emit(event, ctx);
  }

  on(event: PipelineEvent, listener: BusListener): this {
    return super.on(event, listener);
  }

  off(event: PipelineEvent, listener: BusListener): this {
    return super.off(event, listener);
  }
}

export const bus = new PipelineBus();
