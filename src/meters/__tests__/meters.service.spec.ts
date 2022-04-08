import dotenv from "dotenv";
import { DataSource, DeepPartial } from "typeorm";

import { Meter } from "../meter.entity";
import { MetersService } from "../meters.service";

import { MeterChange } from "../changes/meterChange.entity";
import { MeterChangesService } from "../changes/meterChanges.service";

import {
  initializeLogger,
  initializeDataSource,
  Logger,
} from "../../_frameworks/index";

let logger: Logger;
let dataSource: DataSource;

beforeAll(
  async (): Promise<void> => {
    dotenv.config();
    logger = initializeLogger();
    dataSource = await initializeDataSource({ logger, entities: [Meter, MeterChange] });
  }
);

afterAll(
  async (): Promise<void> => {
    await dataSource.destroy();
  }
);
describe("Meter Service", (): void => {
  it("should create a new meter", async (): Promise<void> => {
    const meterChangeService = new MeterChangesService(dataSource);
    const meterService = new MetersService(dataSource, logger, meterChangeService);

    const data: DeepPartial<Meter> = {
      name: "TEST_METER",
      currentValue: 1
    };

    const meter = await meterService.create(data);

    expect(meter.name).toBe(meter.name);
    expect(meter.currentValue).toBe(meter.currentValue);
  });

  it("should create a new meter with 0 as default value", async (): Promise<void> => {
    const meterChangeService = new MeterChangesService(dataSource);
    const meterService = new MetersService(dataSource, logger, meterChangeService);

    const DEFAULT_VALUE = 0;

    const data: DeepPartial<Meter> = {
      name: "TEST_METER"
    };

    const meter = await meterService.create(data);

    expect(meter.name).toBe(meter.name);
    expect(meter.currentValue).toBe(DEFAULT_VALUE);
  });
});
