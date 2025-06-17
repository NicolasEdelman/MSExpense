import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

const UNSAFE_TABLE_NAMES = ["apiKey"];

prisma.$extends({
  query: {
    $allOperations({ model, operation, args, query }) {
      if (!model) return query(args);
      // table does not have company id restrictions
      if (!UNSAFE_TABLE_NAMES.includes(model)) {
        if (!args.where) {
          args.where = { companyId: { equals: "__INVALID_COMPANY_ID" } };
        } else {
          // Check inclusion in case of compund keys: where: { id_companyId: { equals: 1} }
          if (
            !Object.keys(args.where).some((k) =>
              k.toLowerCase().includes("companyid")
            )
          ) {
            args.where.companyId = { equals: "__INVALID_COMPANY_ID" };
          }
        }
      }
      // if the companyId is not set, we need to throw an error
      if (args.where.companyId === "__INVALID_COMPANY_ID") {
        throw new Error("Company ID is required for this operation.");
      }

      return query(args);
    },
  },
});
