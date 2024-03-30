if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined');
}

export const jwtConstants = {
  secret: process.env.JWT_SECRET,
};

export const kTakenDownAccountErrorStr =
  'We cannot perform this action because your account has been temporarily suspended';
