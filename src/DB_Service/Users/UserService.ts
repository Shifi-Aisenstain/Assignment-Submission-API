import bcrypt from 'bcrypt';
import createError from 'http-errors';
import { User, IUser } from './UserModel';
import { AuthService } from '../../Routers/Authentication/JwtUtils';
import { logger } from '../../Utils/Logger';

const authService = new AuthService();

export async function createUser(userData: Pick<IUser, '_id' | 'name' | 'email' | 'password' | 'role'>) {
  // pick only the allowed fields instead of trusting the whole request body
  const user = new User({
    _id: userData._id,
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: userData.role
  });
  logger.info(`Creating new user with ID: ${userData._id}`);
  return await user.save();
}

export async function loginUser(_id: string, password: string): Promise<string> {
  const user = await User.findById(_id).exec();
  const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

  if (!user || !passwordMatches) {
    // same message for both cases, so the API does not reveal which user IDs exist
    logger.warn(`Login attempt failed for user ${_id}`);
    throw createError(401, 'Invalid user ID or password');
  }
  return authService.generateToken(user._id, user.role);
}
