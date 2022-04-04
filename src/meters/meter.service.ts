import { DataSource, DeepPartial, In, Repository } from "typeorm";
import { Meter } from "./meter.entity";
import { MeterChangeService } from "./changes/meterChange.service";

export class MeterService {
  private readonly repository: Repository<Meter>;
  private readonly relations = ["changes"];
  private readonly searchQuery = '"name" ilike :search';

  constructor(
    dataSource: DataSource,
    private readonly meterChangeService: MeterChangeService
  ) {
    this.repository = dataSource.getRepository(Meter);
  }

  async findAll({
    limit,
    page
  }: {
    limit: number;
    page: number;
  }): Promise<[Meter[], number]> {
    return Promise.all([
      this.repository.find({
        relations: this.relations,
        take: limit,
        skip: (page - 1) * limit
      }),
      this.repository.count()
    ]);
  }

  search({
    search,
    limit,
    page
  }: {
    search: string;
    limit: number;
    page: number;
  }): Promise<[Meter[], number]> {
    return this.repository
      .createQueryBuilder()
      .where(this.searchQuery, { search: `%${search}%` })
      .take(limit)
      .skip((page - 1) * limit)
      .getManyAndCount();
  }

  findOne(id: number): Promise<Meter | null> {
    return this.repository.findOne({
      where: { id },
      relations: this.relations
    });
  }

  async create(data: DeepPartial<Meter>): Promise<Meter> {
    const meter = this.repository.create(data);
    return this.repository.save(meter);
  }

  async update(id: number, newValue: number): Promise<Meter> {
    const meter = await this.repository.findOneBy({ id });

    if (meter == null) {
      throw new Error(`Meter #${id} not found`);
    }

    meter.currentValue = newValue;

    await Promise.all([
      this.repository.save(meter),
      this.meterChangeService.create({
        meter: meter,
        previousValue: 0,
        currentValue: newValue
      })
    ]);

    return meter;
  }

  async remove(id: number): Promise<void> {
    await this.repository.softDelete({ id });
  }
}
