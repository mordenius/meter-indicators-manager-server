import {
  startApp,
  stopApp,
  request,
  connectToServer,
  Method
} from "./__helpers__";

import { Meter } from "../src/meters/meter.entity";

beforeAll(async function(): Promise<void> {
  await startApp();
  connectToServer();
});

afterAll(async function(): Promise<void> {
  await stopApp();
});

describe("Meters API", function() {
  it("should find a meter by id", async (): Promise<void> => {
    const ITEM_ID = 1;
    const response = await request<Meter>({
      path: `/hello/${ITEM_ID}`,
      method: Method.GET
    });
    console.log(response.headers);
    expect(response.statusCode).toBe(200);
    expect(response.data?.id).toBe(ITEM_ID);
  });
});
