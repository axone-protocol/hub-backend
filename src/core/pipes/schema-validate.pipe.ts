import {
  PipeTransform,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AnySchema } from 'joi';

@Injectable()
export class SchemaValidatePipe implements PipeTransform {
  constructor(private schema: AnySchema) {}

  transform(validationValue: unknown) {
    const { error, value } = this.schema.validate(validationValue);

    const errors: string[] = error?.details.map((err) => err.message) ?? [];

    if (errors.length)
      throw new HttpException(errors.toString(), HttpStatus.BAD_REQUEST);

    return value;
  }
}
