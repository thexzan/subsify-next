import { z } from "zod";
import { subscriptionInputSchema } from "./validation";
import {
  subscriptionResponseSchema,
  statsResponseSchema,
  tokenResponseSchema,
  errorResponseSchema,
  credentialsSchema,
  changePasswordSchema,
} from "./api-schemas";

// Derive JSON Schema from the same zod schemas the API validates with, so the
// documented contract can't drift from runtime behavior. zod 4 emits draft
// 2020-12, which OpenAPI 3.1 consumes directly.
function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  // `unrepresentable: "any"` lets schemas that use .transform() (e.g. the
  // subscription input) serialize instead of throwing; the transformed fields
  // simply document as permissive.
  const out = z.toJSONSchema(schema, {
    unrepresentable: "any",
    io: "input",
  }) as Record<string, unknown>;
  delete out["$schema"];
  return out;
}

const errorResponse = (description: string) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
});

export function buildOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Subsify API",
      version: "1.0.0",
      description:
        "REST API for the Subsify subscription tracker. Authenticate with either the session cookie (web) or an `Authorization: Bearer <token>` header (obtain a token from POST /api/auth/token).",
    },
    servers: [{ url: "/", description: "This deployment" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "next-auth.session-token",
        },
      },
      schemas: {
        Subscription: jsonSchema(subscriptionResponseSchema),
        SubscriptionInput: jsonSchema(subscriptionInputSchema),
        Stats: jsonSchema(statsResponseSchema),
        TokenResponse: jsonSchema(tokenResponseSchema),
        Credentials: jsonSchema(credentialsSchema),
        ChangePassword: jsonSchema(changePasswordSchema),
        Error: jsonSchema(errorResponseSchema),
      },
    },
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    paths: {
      "/api/auth/token": {
        post: {
          summary: "Exchange credentials for a Bearer token",
          security: [],
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Credentials" },
              },
            },
          },
          responses: {
            "200": {
              description: "Token issued",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TokenResponse" },
                },
              },
            },
            "400": errorResponse("Validation error"),
            "401": errorResponse("Invalid email or password"),
          },
        },
      },
      "/api/auth/change-password": {
        post: {
          summary: "Change the authenticated user's password",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ChangePassword" },
              },
            },
          },
          responses: {
            "200": { description: "Password changed" },
            "400": errorResponse("Wrong current password or validation error"),
            "401": errorResponse("Authentication required"),
          },
        },
      },
      "/api/subscriptions": {
        get: {
          summary: "List subscriptions",
          tags: ["Subscriptions"],
          parameters: [
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: ["active", "expiring_soon", "expired", "cancelled"],
              },
              description: "Filter by effective status",
            },
            {
              name: "search",
              in: "query",
              schema: { type: "string" },
              description: "Match tool name or department",
            },
            {
              name: "department",
              in: "query",
              schema: { type: "string" },
              description: "Filter by exact department",
            },
          ],
          responses: {
            "200": {
              description: "Matching subscriptions",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Subscription" },
                  },
                },
              },
            },
            "401": errorResponse("Authentication required"),
          },
        },
        post: {
          summary: "Create a subscription",
          tags: ["Subscriptions"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SubscriptionInput" },
              },
            },
          },
          responses: {
            "201": {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Subscription" },
                },
              },
            },
            "400": errorResponse("Validation error"),
            "401": errorResponse("Authentication required"),
          },
        },
      },
      "/api/subscriptions/{id}": {
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        get: {
          summary: "Get a subscription",
          tags: ["Subscriptions"],
          responses: {
            "200": {
              description: "The subscription",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Subscription" },
                },
              },
            },
            "401": errorResponse("Authentication required"),
            "404": errorResponse("Not found"),
          },
        },
        put: {
          summary: "Update a subscription",
          tags: ["Subscriptions"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SubscriptionInput" },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Subscription" },
                },
              },
            },
            "400": errorResponse("Validation error"),
            "401": errorResponse("Authentication required"),
            "404": errorResponse("Not found"),
          },
        },
        delete: {
          summary: "Delete a subscription",
          tags: ["Subscriptions"],
          responses: {
            "204": { description: "Deleted" },
            "401": errorResponse("Authentication required"),
            "404": errorResponse("Not found"),
          },
        },
      },
      "/api/stats": {
        get: {
          summary: "Dashboard statistics",
          tags: ["Stats"],
          responses: {
            "200": {
              description: "Counts by effective status and total monthly cost",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Stats" },
                },
              },
            },
            "401": errorResponse("Authentication required"),
          },
        },
      },
    },
  };
}
