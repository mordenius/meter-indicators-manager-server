import {
  startApp,
  stopApp,
  request,
  Method,
  emptyDataTable
} from "./__helpers__";

import { Meter } from "../meters/meter.entity";

beforeAll(async function(): Promise<void> {
  await startApp();
  await emptyDataTable(Meter);
});

afterAll(async function(): Promise<void> {
  await emptyDataTable(Meter);
  await stopApp();
});

describe("Meters API", function() {
  it("should the table be empty before testing", async (): Promise<void> => {
    const response = await request<{ data: Meter[] }>({
      path: `/hello?limit=10&page=1`,
      method: Method.GET
    });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data)).toBeTruthy();
    expect(response.body.data.length).toEqual(0);
  });

  it("should create the meter with id", async (): Promise<void> => {
    const ITEM_ID = 999;
    const response = await request<{ data: Meter }>(
      {
        path: `/hello`,
        method: Method.POST
      },
      JSON.stringify({ id: ITEM_ID, name: "AUTO_TEST_API", currentValue: 0 })
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.data?.id).toBe(ITEM_ID);
  });

  it("should find a meter by id", async (): Promise<void> => {
    const ITEM_ID = 999;
    const response = await request<{ data: Meter }>({
      path: `/hello/${ITEM_ID}`,
      method: Method.GET
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.data?.id).toBe(ITEM_ID);
  });

  it("should receive a list of meters", async (): Promise<void> => {
    const response = await request<{ data: Meter[] }>({
      path: `/hello?limit=10&page=1`,
      method: Method.GET
    });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data)).toBeTruthy();
  });

  it("should create a lot of meters by one request", async (): Promise<
    void
  > => {
    const ITEM_ID = 999;

    const meters: object[] = [];
    for (let i = ITEM_ID + 1; i < ITEM_ID + 100; i++) {
      meters.push({ id: i, name: `AUTO_TEST_API_${i}`, currentValue: 0 });
    }

    const response = await request<{ data: Meter }>(
      {
        path: `/hello`,
        method: Method.POST
      },
      JSON.stringify(meters)
    );

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data)).toBeTruthy();

    for (const meter of response.body.data as any) {
      expect(meter.id).toBeGreaterThanOrEqual(ITEM_ID);
      expect(meter.id).toBeLessThanOrEqual(ITEM_ID + 100);
    }
  });

  test.each([1, 5, 10])(
    "should receive a list of meters with different limit parameter %i",
    async (limit: number): Promise<void> => {
      const response = await request<{ data: Meter[] }>({
        path: `/hello?limit=${limit}&page=1`,
        method: Method.GET
      });

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data)).toBeTruthy();
      expect(response.body.data.length).toBeLessThanOrEqual(limit);
    }
  );

  it("should receive a list of meters by search query", async (): Promise<
    void
  > => {
    const SEARCH = "test";
    const REGEX = /test/gim;

    const response = await request<{ data: Meter[] }>({
      path: `/hello?limit=10&page=1&search=${SEARCH}`,
      method: Method.GET
    });

    expect(response.statusCode).toBe(200);

    for (const meter of response.body.data) {
      expect(meter.name.match(REGEX)).not.toBeNull();
    }
  });

  it("should remove a meter by id", async (): Promise<void> => {
    const ITEM_ID = 999;
    const responseExist = await request<{ data: Meter }>({
      path: `/hello/${ITEM_ID}`,
      method: Method.GET
    });

    expect(responseExist.statusCode).toBe(200);
    expect(responseExist.body.data?.id).toBe(ITEM_ID);

    const responseRemove = await request<{ data: Meter }>({
      path: `/hello/${ITEM_ID}`,
      method: Method.DELETE
    });

    expect(responseRemove.statusCode).toBe(200);

    const responseNotExist = await request<{ data: Meter }>({
      path: `/hello/${ITEM_ID}`,
      method: Method.GET
    });

    expect(responseNotExist.statusCode).toBe(404);
    expect((responseNotExist.body as any)?.message).toMatch("was not found");
  });
});
