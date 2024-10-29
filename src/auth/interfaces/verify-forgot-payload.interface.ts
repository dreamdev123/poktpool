import { ForgotPasswordDto } from '../dto/forgot-password.dto';

interface VerificationForgotPayload {
  forgotPasswordDto: ForgotPasswordDto;
  createdTimestamp: number;
}
export default VerificationForgotPayload;
