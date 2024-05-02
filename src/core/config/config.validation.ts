import { ConfigSchema } from '@core/config/config.schema';

export default () => {
  const { error } = ConfigSchema.validate(process.env, { allowUnknown: true });

  const errors: string[] = error?.details.map((err) => err.message) ?? [];

  if (errors.length) throw new Error(errors.toString());
};
