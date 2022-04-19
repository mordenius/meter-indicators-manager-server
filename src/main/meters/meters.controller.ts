import { ServerHttp2Stream } from "http2";
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
  Body,
  Stream,
  StatusCode
} from "../../_common";
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
  async getById(
    @Param("id") id: string,
    @Stream() stream: ServerHttp2Stream
  ): Promise<{ data: Meter | null } | { message: string }> {
    if (Number.isNaN(Number(id))) {
      throw new Error("Wrong id parameter");
    }

    const meter = await this.service.findOne(Number(id));

    if (!meter) {
      stream.respond({
        "content-type": "application/json",
        ":status": 404
      });

      return JSON.stringify({
        message: `Meter with ID: ${id} was not found`
      }) as any;
    }

    return { data: meter };
  }

  @Post()
  async create(@Body() body: DeepPartial<Meter>[]): Promise<{ data: Meter[] }> {
    const meters = await this.service.create(body);
    return { data: meters };
  }

  @Patch(":id")
  async edit(
    @Param("id") id: string,
    @Body() body: DeepPartial<Meter>
  ): Promise<{ data: Meter }> {
    if (Number.isNaN(Number(id))) {
      throw new Error("Wrong id parameter");
    }
    const meter = await this.service.update(Number(id), body);
    return { data: meter };
  }

  @Delete(":id")
  @StatusCode(204)
  async removeById(@Param("id") id: string): Promise<{ message: string }> {
    if (Number.isNaN(Number(id))) {
      throw new Error("Wrong id parameter");
    }

    await this.service.remove(Number(id));

    return { message: "Done" };
  }
}
