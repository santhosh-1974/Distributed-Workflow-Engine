import { RedisOptions } from "ioredis";
import {config} from "../config/env";

export const bullConnection: RedisOptions = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT
};