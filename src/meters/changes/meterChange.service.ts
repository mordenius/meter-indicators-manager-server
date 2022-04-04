import { DataSource, DeepPartial, Repository } from "typeorm";
import { MeterChange } from "./meterChange.entity";

export class MeterChangeService {
  private readonly repository: Repository<MeterChange>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(MeterChange);
  }

  async create(data: DeepPartial<MeterChange>): Promise<MeterChange> {
    const meter = this.repository.create(data);
    return this.repository.save(meter);
  }
}
