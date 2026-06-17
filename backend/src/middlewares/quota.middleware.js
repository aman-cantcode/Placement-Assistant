import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { QUOTA_LIMITS } from "../constants.js";

export const checkQuota = (type) =>
  asyncHandler(async (req, _res, next) => {
    const limit = QUOTA_LIMITS[type];
    if (limit === undefined) {
      throw new ApiError(500, `Unknown quota type: ${type}`);
    }

    if (limit === Infinity) {
      return next();
    }

    // TODO (subscriptions): count today's usage for req.user,
    // compare with the plan limit and throw 429 when exceeded
    next();
  });