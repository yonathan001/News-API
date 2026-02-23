import { Router } from 'express';
import { signup, login } from '../controllers/auth.controller';
import { signupValidator, loginValidator } from '../validators/auth.validator';
import { validate } from '../middleware/validation';

const router = Router();

router.post('/signup', validate(signupValidator), signup);
router.post('/login', validate(loginValidator), login);

export default router;
