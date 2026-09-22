import jwt from "jsonwebtoken";

interface IPayload {
  id: number;
  name: string;
  email: string;
  google_id?: number;
}

export const access_secret = process.env.JWT_ACCESS_SECRET as string;
export const refresh_secret = process.env.JWT_REFRESH_SECRET as string;
export const generateToken = (payload: IPayload) => {
  const accessToken = jwt.sign(payload, access_secret, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(payload, refresh_secret, {
    expiresIn: "7d",
  });

  return {
    accessToken,
    refreshToken,
  };
};
