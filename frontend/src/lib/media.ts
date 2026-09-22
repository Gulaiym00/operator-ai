const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const resolveAvatarUrl = (avatar?: string) => {
  if (!avatar) return undefined;
  if (/^https?:\/\//.test(avatar)) return avatar;
  return `${apiUrl}/${avatar}`;
};
