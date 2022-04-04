import dotenv from "dotenv";
import { DataSource, DeepPartial } from "typeorm";

import { Meter } from "../meter.entity";
import { MeterService } from "../meter.service";

import { MeterChange } from "../changes/meterChange.entity";
import { MeterChangeService } from "../changes/meterChange.service";

import {
  initializeLogger,
  initializeDataSource
} from "../../_frameworks/index";

let dataSource: DataSource;

beforeAll(
  async (): Promise<void> => {
    dotenv.config();
    const logger = initializeLogger();
    dataSource = await initializeDataSource(logger, [Meter, MeterChange]);
  }
);

afterAll(
  async (): Promise<void> => {
    await dataSource.destroy();
  }
);
describe("Meter Service", (): void => {
  it("should create a new meter", async (): Promise<void> => {
    const meterChangeService = new MeterChangeService(dataSource);
    const meterService = new MeterService(dataSource, meterChangeService);

    const data: DeepPartial<Meter> = {
      name: "TEST_METER",
      currentValue: 1
    };

    const meter = await meterService.create(data);

    expect(meter.name).toBe(meter.name);
    expect(meter.currentValue).toBe(meter.currentValue);
  });

  it("should create a new meter with 0 as default value", async (): Promise<void> => {
    const meterChangeService = new MeterChangeService(dataSource);
    const meterService = new MeterService(dataSource, meterChangeService);

    const DEFAULT_VALUE = 0;

    const data: DeepPartial<Meter> = {
      name: "TEST_METER"
    };

    const meter = await meterService.create(data);

    expect(meter.name).toBe(meter.name);
    expect(meter.currentValue).toBe(DEFAULT_VALUE);
  });
});
