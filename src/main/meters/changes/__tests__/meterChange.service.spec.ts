import { DataSource, DeepPartial } from "typeorm";

import { Meter } from "../../meter.entity";
import { MeterChange } from "../meterChange.entity";
import { MeterChangesService } from "../meterChanges.service";

import {
  initializeConfiguration,
  initializeLogger,
  initializeDataSource
} from "../../../_frameworks";

let dataSource: DataSource;

beforeAll(
  async (): Promise<void> => {
    initializeConfiguration("main");
    const logger = initializeLogger();
    dataSource = await initializeDataSource({
      logger,
      entities: [Meter, MeterChange]
    });
  }
);

afterAll(
  async (): Promise<void> => {
    await dataSource.destroy();
  }
);

describe("Meter Changes Service", (): void => {
  it("should create a new meter change", async (): Promise<void> => {
    const meterChangeService = new MeterChangesService(dataSource);

    const data: DeepPartial<MeterChange> = {
      previousValue: 0,
      currentValue: 1,
      commitedAt: "2022-04-04T01:44:34.562Z"
    };

    const change = await meterChangeService.create(data);

    expect(change.previousValue).toBe(data.previousValue);
    expect(change.currentValue).toBe(data.currentValue);
  });
});
