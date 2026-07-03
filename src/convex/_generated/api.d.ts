/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as Cards from "../Cards.js";
import type * as CLAUDE from "../CLAUDE.js";
import type * as PublicConfig from "../PublicConfig.js";
import type * as ResearchLinks from "../ResearchLinks.js";
import type * as Tasks from "../Tasks.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  Cards: typeof Cards;
  CLAUDE: typeof CLAUDE;
  PublicConfig: typeof PublicConfig;
  ResearchLinks: typeof ResearchLinks;
  Tasks: typeof Tasks;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
