import { z } from 'zod';

// experiment creating a Schema.
const ZodTestSchema = z.object({});

// Update the passed object to match your schema.
ZodTestSchema.parse({});

// hover to see static type
type ZodTestType = z.infer<typeof ZodTestSchema>;

function testZodFunction(input: ZodTestType) {
  console.log(ZodTestSchema.safeParse(input));
}
