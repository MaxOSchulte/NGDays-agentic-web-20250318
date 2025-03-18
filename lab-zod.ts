import { z } from 'zod';

// experiment creating a Schema.
const ZodTestSchema = z.object({ abc: z.number(), foo: z.string() }).strict();

// Update the passed object to match your schema.
ZodTestSchema.parse({ abc: 123, foo: 'bar' });

// hover to see static type
type ZodTestType = z.infer<typeof ZodTestSchema>;

function testZodFunction(input: ZodTestType) {
  console.log(ZodTestSchema.safeParse(input).error);
}
