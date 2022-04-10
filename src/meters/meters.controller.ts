import { DeepPartial } from "typeorm";
import {
  Controller,
  Get,
  Delete,
  Inject,
  Param,
  Query,
  Post,
  Patch,
  Body
} from "../_frameworks";
import { Meter } from "./meter.entity";
import { MetersService } from "./meters.service";

interface Paginate<D> {
  data: D;
  limit: number;
  page: number;
  count: number;
}

@Controller("/hello")
export class MetersController {
  constructor(@Inject(MetersService) private readonly service: MetersService) {}

  @Get()
  async getAll(
    @Query("limit") limit: number,
    @Query("page") page: number,
    @Query("search") search: string
  ): Promise<Paginate<Meter[]>> {
    console.log(limit, page, search)
    if (search) {
      const [data, count] = await this.service.search({ page, limit, search });
      return {
        data,
        page,
        limit,
        count
      };
    }
    const [data, count] = await this.service.findAll({
      limit,
      page
    });
    return { data, limit, page, count };
  }

  @Get(":id")
  getById(@Param("id") id: string): Promise<Meter | null> {
    console.log("getById", id)
    if (Number.isNaN(Number(id))) {
      throw new Error("Wrong id parameter");
    }
    return this.service.findOne(Number(id));
  }

  @Post()
  create(@Body() body: DeepPartial<Meter>[]) {
    return this.service.create(body);
  }

  @Patch(":id")
  edit(@Param("id") id: string, @Body() body: DeepPartial<Meter>) {
    if (Number.isNaN(Number(id))) {
      throw new Error("Wrong id parameter");
    }
    return this.service.update(Number(id), body);
  }

  @Delete(":id")
  removeById(@Param("id") id: string): Promise<void> {
    if (Number.isNaN(Number(id))) {
      throw new Error("Wrong id parameter");
    }
    return this.service.remove(Number(id));
  }
}
