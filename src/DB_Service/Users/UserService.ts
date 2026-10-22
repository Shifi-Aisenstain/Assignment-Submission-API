import { User, IUser } from '../../DB_Service/Users/UserModel';
import createError from "http-errors";
import { AuthService } from '../../Routers/Authentication/JwtUtils';
import {logger} from '../../Utils/Logger';
import bcrypt from 'bcrypt';

const outhService=new AuthService();   

export  async function createUser(userData: 
    { _id: string,name: string, email: string , password: string, role: string}): Promise<IUser> {
    const newUser = new User(userData);
    console.log("User created:", newUser); // בדקי מה מודפס בטרמינל של ה-VS Code
    logger.info(`Creating new user with ID: ${userData._id}`);
    const savedUser = await newUser.save();
    
    console.log("User saved to database:", savedUser); // בדקי מה מודפס בטרמינל של ה-VS Code
    return savedUser;
  }

export  async function loginUser(_id: string, password: string): Promise<string> {
    const user = await User.findOne({ _id }).exec();
    if (!user) {
        logger.warn(`Login attempt failed: User ${_id} not found`);
        throw createError(404, "User not found");
    }
    if (user.password !== password) {
        logger.warn(`Login attempt failed: Invalid password for user ${_id}`);
        throw createError(402, "Invalid password");
    }
    return outhService.generateToken(user._id, user.role);
}

