import { Request } from 'express';
import { PoktPoolUser } from '../entities/user.entity';

interface RequestWithUser extends Request {
  poktPoolUser: PoktPoolUser;
}

export default RequestWithUser;
