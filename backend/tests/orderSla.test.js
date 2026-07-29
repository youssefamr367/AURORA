import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSla } from "../../shared/backend/modules/orders/order.entity.js";

test("normalizeSla keeps only statuses with complete date windows", () => {
  const result = normalizeSla({
    New: {
      greenDate: "2026-07-20",
      orangeDate: "2026-07-22",
      redDate: "2026-07-25",
    },
    manufacturing: {},
    Done: {
      greenDate: "2026-07-26",
      orangeDate: "2026-07-28",
      redDate: "2026-07-30",
    },
  });

  assert.deepEqual(result, [
    {
      status: "New",
      greenDate: "2026-07-20",
      orangeDate: "2026-07-22",
      redDate: "2026-07-25",
    },
    {
      status: "Done",
      greenDate: "2026-07-26",
      orangeDate: "2026-07-28",
      redDate: "2026-07-30",
    },
  ]);
});

test("normalizeSla rejects invalid date ordering", () => {
  assert.throws(() =>
    normalizeSla({
      New: {
        greenDate: "2026-07-20",
        orangeDate: "2026-07-19",
        redDate: "2026-07-25",
      },
    })
  );
});
