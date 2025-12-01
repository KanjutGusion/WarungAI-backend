import { Reflector } from '@nestjs/core';
import { EUserRole } from 'src/types';

export const Roles = Reflector.createDecorator<EUserRole[]>();
